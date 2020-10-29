const mongoose = require('mongoose');
const cluster = require('cluster');
const os = require('os');
const workers = [];
const { updateJobStatus, performJobProcess, getJobToProcess, queueJob, haltJob, updateStatusOfInterruptedJob } = require('../services/job');
const { jobStatus } = require('../utils/job/status.util');

function setUpWorkers() {
    let numCores = require('os').cpus().length;
    console.log('Master cluster setting up ' + numCores + ' workers');

    // iterate on number of cores need to be utilized by an application
    // current example will utilize all of them
    for (let i = 0; i < numCores; i++) {
        // creating workers and pushing reference in an array
        // these references can be used to receive messages from workers
        workers.push(cluster.fork());
    }

    // process is clustered on a core and process id is assigned
    cluster.on('online', function (worker) {
        console.log('Worker ' + worker.process.pid + ' is listening');
    });

    // if any of the worker process dies then start a new one by simply forking another one
    cluster.on('exit', function (worker, code, signal) {
        console.log('Worker ' + worker.process.pid + ' died with code: ' + code + ', and signal: ' + signal);
        console.log('Starting a new worker');
        cluster.fork();
        workers.push(cluster.fork());
        // to receive messages from worker process
        workers[workers.length - 1].on('message', function (message) {
            console.log(message);
        });
    });
}

function isWorkerAvailable() {
    try {
        const totalCpus = os.cpus().length;
        let count = 0;
        for (let i in cluster.workers) {
            count++;
        }
        if (count <= totalCpus) return true;
        return false;
    }
    catch (error) {
        console.error(`[isWorkerAvailable]`, error);
    }
}

function clusterOnExit(worker) {
    try {
        /* unexpected worker disconnect. update job status to halt or abort by worker id */
        if (!worker.exitedAfterDisconnect)
            updateStatusOfInterruptedJob(worker.id)
                .catch(error => console.error(`[clusterOnExit]`, error));
    }
    catch (error) {
        console.error(`[clusterOnExit]`, error);
    }
}

async function clusterOnDisconnect() {
    try {
        if (isWorkerAvailable()) {
            let newJob = await getJobToProcess();
            if (!newJob) {
                await queueJob();
                newJob = await getJobToProcess();
            }
            if (newJob) forKWorker();
        }
    }
    catch (error) {
        console.error(`[clusterOnExit]`, error);
    }
}

function forKWorker() {
    try {
        if (isWorkerAvailable()) {
            cluster.fork();
            cluster.on('exit', clusterOnExit);
            cluster.on('disconnect', clusterOnDisconnect);
        }
    }
    catch (error) {
        console.error(`[forkWorker]`, error);
    }
}

function disconnectWorker() {
    try {
        cluster.worker.disconnect();
    }
    catch (error) {
        console.error(`[disconnectWorker]`, error);
    }
}

function getWorkerByProcessId() {
    // console.log(cluster.workers)
    for (let index in cluster.workers) {
        let worker = cluster.workers[index];
        if (process.pid === worker.process.pid)
            return worker;
    }
}

async function initializeWorker() {
    try {
        mongoose.connect(
            process.env.mongo,
            {
                useNewUrlParser: true,
                useCreateIndex: true,
                useUnifiedTopology: true
            }
        );
        var db = mongoose.connection;
        db.on('error', console.error.bind(console, 'connection error:'));
        db.once('open', async function () {
            let job = await getJobToProcess();
            if (!job) {
                await queueJob();
                job = await getJobToProcess();
            }
            const worker = cluster.worker;
            if (job) {
                await updateJobStatus(job, jobStatus.run, worker.id);
                performJobProcess()
                    .then(async isJobDone => {
                        if (isJobDone) {
                            updateJobStatus(job, jobStatus.success)
                                .then(doc => {
                                    mongoose.disconnect();
                                    worker.disconnect();
                                })
                                .catch(error => {
                                    console.error(`[initializeWorker]`, error)
                                });
                        } else if (!isJobDone)
                            haltJob(job)
                                .then(doc => {
                                    mongoose.disconnect();
                                    worker.process.kill(1);
                                })
                                .catch(error => {
                                    console.error(`[initializeWorker]`, error)
                                });
                    })
                    .catch(error => console.error(`[performJobProcess]`, error));
            } else worker.disconnect();
        })
        // let jobProcess = await getJobToProcess();
        // console.log(jobProcess)
    }
    catch (error) {
        console.error(`[initializeWorker]`, error);
    }
}

function abortWorker(workerId) {
    for (let i in cluster.workers) {
        const worker = cluster.workers[i];
        if (worker.id === workerId) {
            worker.process.kill(1);
            return true;
        }
    }
    return false;
}

module.exports = {
    setUpWorkers,
    isWorkerAvailable,
    forKWorker,
    disconnectWorker,
    initializeWorker,
    abortWorker
}

