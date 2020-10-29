const Jobs = require('../../models/job.model');
const { queueJob } = require('../../services/job');
const { jobStatus } = require('../../utils/job/status.util');
const { isWorkerAvailable, forKWorker } = require('../../Worker');
module.exports = function (req, res) {
    try {
        const name = 'job_' + Date.now();
        const job = new Jobs({
            name,
            status: jobStatus.create
        });
        job.save((error) => {
            if (error) return res.json({ status: 0, error: error.message })
            if (isWorkerAvailable()) {
                queueJob()
                    .then(data => {
                        /* fork worker here */
                        forKWorker();
                    })
                    .catch(error => {
                        console.error(`[queueJob]`, error);
                    });
            }
            return res.json({ status: 1, message: 'Success.' });
        });
    }
    catch (err) {
        return res.json({ status: 0, error: err.message });
    }
}