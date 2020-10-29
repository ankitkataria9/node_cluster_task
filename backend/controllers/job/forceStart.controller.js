const { forceStartJob } = require("../../services/job");
const { isWorkerAvailable, forKWorker } = require("../../Worker");

module.exports = async (req, res) => {
    try {
        const jobName = req.body.jobName;
        if (!jobName) throw new Error('Invalid Job Name');

        const isJobForceStarted = await forceStartJob(jobName);
        if (isJobForceStarted) {
            if (isWorkerAvailable()) {
                forKWorker();
            }
            return res.json({ status: 1, message: 'Job Force Started Successfully.' });
        }
        else return res.json({ status: 0, error: 'something went wrong.' });
    }
    catch (err) {
        return res.json({ status: 0, error: err.message });

    }
}