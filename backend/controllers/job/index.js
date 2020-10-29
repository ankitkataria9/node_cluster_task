const getJobs = require('./getJobs.controller');
const createJob = require('./createJob.controller');
const abortJob = require('./abortJob.controller');
const forceStartJob = require('./forceStart.controller');
const setJobPriority = require('./setJobPriority.controller');

module.exports = {
    getJobs,
    createJob,
    abortJob,
    forceStartJob,
    setJobPriority
}