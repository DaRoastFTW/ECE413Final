const { Schema } = require("mongoose");
const db = require("../db");

const accountSchema = new db.Schema({
    //email, hashed password, start time, end time, 
    //frequency, Recorded values (Timestamp as Key,
    //Pulse and Saturation as values)
    email: String,
    password: String,
    startTime: {
        hours: Number,
        minutes: Number

    },
    endTime: {
        hours: Number,
        minutes: Number

    },
    frequency: Number,
    recordedValues: [{
        timestamp: Date,
        pulse: Number,
        saturation: Number
    }],
    lastAccess: Date,
    devices: [{
        name: String,
        key: String
    }],
    particleToken: String,
    apikey: String
});

const Accounts = db.model("Accounts", accountSchema);

module.exports = Accounts;