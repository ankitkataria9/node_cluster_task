const mongoose = require("mongoose");
const Schema  = mongoose.Schema;

const jobSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },

    status: {
        type: String,
        required: true
    },
    totalHalts: {
        type: Number
    },
    workerId: Number,
    forceStart: Boolean,
    priority: {
        type: Number,
        required: true,
        default: 1
    }
}, {
    timeStamps: true
});

module.exports = mongoose.model('Jobs', jobSchema);