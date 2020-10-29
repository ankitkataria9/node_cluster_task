const { abortJob } = require('../../services/job')
module.exports = async (req, res) => {
    try {
        const jobName = req.body.jobName;
        if (!jobName) throw new Error('Invalid Job Name');
        const abortMessage = await abortJob(jobName);
        if (abortMessage)
            return res.json({ status: 1, message: abortMessage })
        else
            return res.json({ status: 0, error: 'Failed To Abort Job.' })
    }
    catch (err) {
        console.error(err);
        return res.json({ status: 0, error: err.message });
    }
}