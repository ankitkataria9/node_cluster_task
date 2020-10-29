// var express = require('express');
// var router = express.Router();

// /* GET home page. */
// router.get('/', function(req, res, next) {
//   res.render('index', { title: 'Express' });
// });
const jobRoutes = require('./job.route');

module.exports = (app) => {
  const JobRouter = jobRoutes();
  app.use('/v1/protected/job', JobRouter);
};
