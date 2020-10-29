const Jobs = require('../../models/job.model');
const { jobStatus } = require('../../utils/job/status.util');

module.exports = (req, res) => {
    try {
        Jobs.find({ status: { $ne: jobStatus.success } })
            .then(jobs => {
                return res.json({ status: 1, jobs });
            })
            .catch(err => {
                return res.json({ status: 0, err: err.message });
            });

    }
    catch (err) {
        return res.json({ status: 0, err: err.message });
    }
}