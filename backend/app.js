var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const mongoose = require('mongoose');
require('dotenv').config();
const cluster = require('cluster');
const { isAnyJobRunning, queueAllRunningJobs } = require('./services/job');
const { isWorkerAvailable, forKWorker } = require('./Worker');
// var indexRouter = require('./routes/index');
// var usersRouter = require('./routes/users');
const cors = require('cors');

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
db.once('open', function () {
    console.log('we are connected to database!');
})

var app = express();

var corsOptions = {
    "origin": "*",
    "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
    "preflightContinue": false,
    "optionsSuccessStatus": 204
}

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors(corsOptions));
require('./routes/v1/protected/index')(app);
// setUpWorkers();
if (cluster.isMaster) {

    /* queuing all perviously running jobs in case of server restart */
    setTimeout(async () => {
        try {
            const status = await isAnyJobRunning()
            if (status) {
                await queueAllRunningJobs();
            }
            if (isWorkerAvailable()) {
                forKWorker();
            }
        }
        catch (error) {
            console.error(`[master thread initializer]`, error);
        }
    }, 2000);

}


// app.use('/', indexRouter);
// app.use('/users', usersRouter);

module.exports = app;
