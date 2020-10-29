const { setJobPriorityService } = require('../../services/job');

module.exports = async (req, res) => {
    try {
        const jobName = req.body.jobName;
        const newPriority = req.body.newPriority;
        const oldPriority = req.body.oldPriority;
        if (!jobName) throw new Error('Invalid job name');
        if (!newPriority) throw new Error('Invalid new Priority');
        if (!oldPriority) throw new Error('Invalid old Priority');

        const isPrioritySet = await setJobPriorityService(jobName, oldPriority, newPriority);
        if (isPrioritySet) {
            return res.json({ status: 1, message: 'Priority set.' })
        } else
            throw new Error('Something went wrong');
    }
    catch (err) {
        return res.json({ status: 0, error: err.message });
    }
}