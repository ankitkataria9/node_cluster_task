const Jobs = require('../../models/job.model');
const { jobStatus, jobTimeout } = require('../../utils/job/status.util');
const cluster = require('cluster');
const { resolve } = require('path');

const queueJob = function (isAppStarting = false) {
    return new Promise(async (resolve, reject) => {
        try {
            const job = await getJobToQue(isAppStarting);
            if (job) {
                const updateStatus = await updateJobStatus(job, jobStatus.queue);
                resolve({ job, updateStatus });
            } else
                resolve(null);
        }
        catch (error) {
            reject(error);
        }
    });
}

const getJobToQue = async (isAppStarting = false) => {
    return new Promise(async (resolve, reject) => {
        try {
            /* 
                first priority: status = run (only when app is starting)
                secont priority: forceStart = 1
                third priority: halt = 1
                fourth priority: 10-2
                fifth priority: regular jobs i.e, 1
            */
            let job;
            if (isAppStarting) {
                job = await Jobs.findOne({ status: jobStatus.run, priority: { $ne: 0 } }).sort({ createdAt: 1, priority: -1 });
            }
            if (!job)
                job = await Jobs.findOne({ status: jobStatus.abort, forceStart: true, priority: { $ne: 0 } }).sort({ createdAt: 1, priority: -1 });
            if (!job)
                job = await Jobs.findOne({ status: jobStatus.halt, totalHalts: { $eq: 1 }, priority: { $ne: 0 } }).sort({ createdAt: 1, priority: -1 });
            if (!job)
                job = await Jobs.findOne({ status: jobStatus.create, priority: { $ne: 0 } }).sort({ createdAt: 1, priority: -1 });

            resolve(job);
        }
        catch (error) {
            reject(error);
        }
    })
}

const getJobToProcess = () => {
    return new Promise(async (resolve, reject) => {
        try {
            let job;
            if (!job) {
                job = await Jobs.findOne({ status: jobStatus.queue, forceStart: true, priority: { $ne: 0 } })//.sort({ createdAt: 1, priority: -1 });
            }
            if (!job)
                job = await Jobs.findOne({ status: jobStatus.queue, totalHalts: { $eq: 1 }, priority: { $ne: 0 } }).sort({ createdAt: 1, priority: -1 });
            if (!job)
                job = await Jobs.findOne({ status: jobStatus.queue, priority: { $ne: 0 } }).sort({ createdAt: 1, priority: -1 });
            resolve(job);
        }
        catch (error) {
            reject(error);
        }
    })
}

const haltJob = (job) => {
    return new Promise((resolve, reject) => {
        try {
            let jobHalts = job.totalHalts ? job.totalHalts : 0;
            Jobs.updateOne({ _id: job._id }, {
                $set: {
                    status: jobHalts > 0 ? jobStatus.abort : jobStatus.halt,
                    totalHalts: ++jobHalts
                }
            })
                .then(doc => resolve(doc))
                .catch(error => reject(error))
        }
        catch (error) {
            reject(error)
        }
    })
}

const updateJobStatus = (job, status, workerId) => {
    return new Promise((resolve, reject) => {
        try {
            let set = { status }
            if (workerId)
                set['workerId'] = workerId;
            Jobs.updateOne(
                { _id: job._id },
                { $set: set }
            ).then(doc => resolve(doc))
                .catch(err => reject(err));
        }
        catch (error) {
            // console.error(`[updateJobStatus]`, error);
            reject(error);
        }
    })
}

const performJobProcess = () => {
    return new Promise((resolve, reject) => {
        try {
            const jobTime = Math.floor(Math.random() * 25) + 5;
            console.log(jobTime)
            let isReturned = false;
            setTimeout(() => {
                if (!isReturned) {
                    isReturned = true;
                    resolve(true);
                }
            }, jobTime * 1000)

            setTimeout(() => {
                if (!isReturned) {
                    isReturned = true;
                    return resolve(false);
                }
            }, jobTimeout);
        }
        catch (error) {
            reject(error);
        }
    })
}

const updateStatusOfInterruptedJob = (workerId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const job = Jobs.findOne({
                workerId,
                status: jobStatus.run
            });
            if (job) {
                const status = job.totalHalts ? jobStatus.abort : jobStatus.halt;
                Jobs.updateOne({
                    _id: job._id
                }, {
                    $set: {
                        status
                    }
                })
                    .then(doc => resolve(doc))
                    .catch(error => reject(error));
            } else throw new Error('Job not found.');

        }
        catch (error) {
            reject(error);
        }
    })
}

function queueAllRunningJobs() {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = await Jobs.updateMany({
                status: jobStatus.run
            }, {
                $set: {
                    status: jobStatus.queue
                }
            });
            resolve(doc);
        }
        catch (error) {
            reject(error);
        }
    });
}

function isAnyJobRunning() {
    return new Promise(async (resolve, reject) => {
        try {
            const job = await Jobs.findOne({ status: jobStatus.run })
            if (job) return resolve(true);
            resolve(false);
        }
        catch (error) {
            reject(error);
        }
    })
}

function abortRunningJob(job) {
    return new Promise((resolve, reject) => {
        try {
            for (let i in cluster.workers) {
                const worker = cluster.workers[i];

                if (worker.id === job.workerId) {
                    worker.process.kill(1);
                    resolve(true);
                    break;
                }
            }
            return resolve(false);
        }
        catch (err) {
            console.error(err);
            reject(err);
        }
    })
}

function abortJob(jobName) {
    return new Promise(async (resolve, reject) => {
        try {
            const job = await Jobs.findOne({ name: jobName });
            if (!job) throw new Error('Job not found');
            if (job.status === jobStatus.success) return resolve('Job already successfully executed.')
            switch (job.status) {
                case jobStatus.create:
                case jobStatus.halt:
                case jobStatus.queue:
                    await updateJobStatus(job, jobStatus.abort);
                    return resolve('Job successfully aborted.');
                case jobStatus.abort:
                    return resolve('Job already aborted.');
                case jobStatus.run:
                    await abortRunningJob(job);
                    await updateJobStatus(job, jobStatus.abort);
                    return resolve('Job successfully aborted.');
                default:
                    throw new Error('Invalid job Status.');

            }
        }
        catch (err) {
            console.error(err);
            reject(err);
        }
    })
}

function forceStartJob(jobName) {
    return new Promise(async (resolve, reject) => {
        try {
            const updateStatus = await Jobs.updateOne({
                name: jobName,
                status: jobStatus.abort
            }, {
                $set: {
                    status: jobStatus.queue,
                    forceStart: true
                }
            });
            if (updateStatus.ok && updateStatus.nModified) return resolve(true);
            else return resolve(false);
        }
        catch (err) {
            reject(err);
        }
    })
}

function setJobPriorityService(jobName, oldPriority, newPriority) {
    return new Promise(async (resolve, reject) => {
        try {
            const job = await Jobs.findOne({ name: jobName, priority: { $eq: oldPriority, $gt: 0 }, status: { $nin: [jobStatus.run, jobStatus.abort] } });
            if (!job) throw new Error('Job not found');
            await Jobs.updateMany({
                status: jobStatus.queue,
                priority: {
                    $gt: oldPriority,
                    $lte: newPriority
                }
            }, {
                $inc: {
                    priority: -1
                }
            });

            const updateStatus = await Jobs.updateOne({
                name: jobName,
                status: { $nin: [jobStatus.run, jobStatus.abort] }
            }, {
                $set: {
                    priority: newPriority
                }
            });
            if (updateStatus.nModified) resolve(true);
            else resolve(false);
        }
        catch (err) {
            console.error(err);
            reject(err);
        }
    })
}

module.exports = {
    updateJobStatus,
    getJobToQue,
    queueAllRunningJobs,
    isAnyJobRunning,
    queueJob,
    updateStatusOfInterruptedJob,
    getJobToProcess,
    performJobProcess,
    haltJob,
    abortJob,
    forceStartJob,
    setJobPriorityService
}