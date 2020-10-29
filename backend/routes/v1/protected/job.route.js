const express = require('express');
const router = express.Router();
const JobControllers = require('../../../controllers/job');
// const cluster = require('cluster');

module.exports = () => {
    try {
        /* get routes */
        router.get('/get-jobs', JobControllers.getJobs);

        /* post routes */
        router.post('/create-job', JobControllers.createJob);

        /* put routes */
        router.put('/force-start-job', JobControllers.forceStartJob);
        router.put('/set-job-priority', JobControllers.setJobPriority);

        /* delete routes */
        router.delete('/abort-job', JobControllers.abortJob);
        return router;
    }
    catch (err) {
        console.error(err);
    }
}