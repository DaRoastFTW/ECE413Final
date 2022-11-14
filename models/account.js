const { Schema } = require("mongoose");
const db = require("../db");

const timeSchema = new db.Schema({
    hours: Number,
    minutes: Number

});

const accountSchema = new db.Schema({
    //email, hashed password, start time, end time, 
    //frequency, Recorded values (Timestamp as Key,
    //Pulse and Saturation as values)
    email: String,
    password: String, 
    startTime: timeSchema,
    endTime: timeSchema,
    frequency: Number,
    recordedValues: [{
        timestamp: Date,
        pulse: Number,
        saturation: Number
    }]

});