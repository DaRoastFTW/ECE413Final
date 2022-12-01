var express = require('express');
const Accounts = require('../models/account');
var Particle = require('particle-api-js');
var particle = new Particle();
var router = express.Router();

router.post('/store', function (req, res, next) {
    var event = req.body.event;
    var data = req.body.data;
    console.log(event);
    console.log(data);
    res.status(200).json("got it");
});

router.post('/sendFrequency', async function (req, res) {
    console.log("Inside sendFrequency");
    var particleToken = req.body.particleToken;
    var particleDeviceName = req.body.particleDeviceName;
    var webToken = req.body.webToken;
    var newFrequency = req.body.frequency;
    //MongoDB schenagigans

    Accounts.findOne({ devices: { $elemMatch: { name: particleDeviceName } } }, function (err, account) {
        if (account != null) {
            account.frequency = newFrequency;
            account.save();
        }
    });



    //Particle schenagigans
    //NOTE: Looks like we might have to set some things up on the Particle code end to match device to frequency
    //Or we're using the wrong promise (I'd look at callFunction: https://docs.particle.io/reference/cloud-apis/javascript/#callfunction)
    //This method will require the deviceID which we can pull and input into the key field of the devices object
    //This will require modiifying the addDevices route in the account.js router file

    var publishEventPr = particle.publishEvent({ name: 'frequency', data: JSON.stringify({ frequency: newFrequency, deviceName: particleDeviceName, ok: true }), auth: particleToken });

    await publishEventPr.then(
        function (data) {
            if (data.body.ok) { console.log("Frequency Event published succcessfully"); }
        },
        function (err) {
            console.log("Failed to publish frequency event " + err);
        }
    );



});

router.post('/sendStartEnd', async function (req, res) {
    var particleToken = req.body.particleToken;
    var particleDeviceName = req.body.particleDeviceName;
    var hoursStart = req.body.start.hours;
    var minutesStart = req.body.start.minutes;
    var hoursEnd = req.body.end.hours;
    var minutesEnd = req.body.end.minutes;


    Accounts.findOne({ devices: { $elemMatch: { name: particleDeviceName } } }, function (err, account) {
        account.startTime.hours = hoursStart;
        account.startTime.minutes = minutesStart;
        account.endTime.hours = hoursEnd;
        account.endTime.minutes = minutesEnd;
        account.save();
    });

    //Particle schenagigans
    //NOTE: Looks like we might have to set some things up on the Particle code end to match device to frequency
    //Or we're using the wrong promise (I'd look at callFunction: https://docs.particle.io/reference/cloud-apis/javascript/#callfunction)
    //This method will require the deviceID which we can pull and input into the key field of the devices object
    //This will require modiifying the addDevices route in the account.js router file

    var publishEventPr = particle.publishEvent({ name: 'time range', data: JSON.stringify({ startHour: hoursStart, startMin: minutesStart, endHour: hoursEnd, endMin: minutesEnd, deviceName: particleDeviceName, ok: true }), auth: particleToken });

    await publishEventPr.then(
        function (data) {
            if (data.body.ok) { console.log("Time range Event published succcessfully"); }
        },
        function (err) {
            console.log("Failed to publish frequency event " + err);
        }
    );
});

module.exports = router;

// Check device ID to see if it even has an entry in our system. If not, toss data.
// If it does, match that account and put in the timestamp, 