var express = require('express');
const Accounts = require('../models/account');
var Particle = require('particle-api-js');
const { randomString } = require('forever/lib/util/utils');
var particle = new Particle();
var router = express.Router();

router.post('/store', function (req, res, next) { // Connects to a webhook from the Particle cloud
    var event = req.body.event;
    var data = req.body.deviceData;
    console.log(JSON.stringify(data))
    // apikey mm/dd/yyyy hh:mm pulse spo2
    // Above is the string sent from the device
    var initial = data.split(" ");
    var date = initial[1].split("/"); // Date array
    var time = initial[2].split(":"); //Time array
    var timestamp = new Date(date[2], date[0] - 1, date[1], time[0], time[1]); // Creating the timestamp for the data point

    Accounts.findOne({ apikey: initial[0] }, function (err, account) {
        if (err) {
            res.status(400).json({ msg: "Yeah, doesn't exist" });
        }

        var recordedValue = { timestamp: timestamp, pulse: initial[3], saturation: initial[4] }; // Packaging the values into one objecct
        account.recordedValues.push(recordedValue);
        account.save();
        res.status(200).json("got it");
    });

});

router.post('/sendFrequency', async function (req, res) {
    var particleToken = req.body.particleToken;
    var particleDeviceName = req.body.particleDeviceName;
    var webToken = req.body.webToken;
    var newFrequency = req.body.frequency;
    //MongoDB schenagigans
    //Send updated frequency to the server
    Accounts.findOne({ devices: { $elemMatch: { name: particleDeviceName } } }, function (err, account) {
        if (account != null) {
            account.frequency = newFrequency;
            account.save();
        }
    });



    //Particle schenagigans

    var publishEventPr = particle.publishEvent({ name: 'frequency', data: JSON.stringify({ frequency: newFrequency, deviceName: particleDeviceName, ok: true }), auth: particleToken });
    // Particle promise to send the updated frequency to the device
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

    // Store new time range into the server, looks up by the device
    Accounts.findOne({ devices: { $elemMatch: { name: particleDeviceName } } }, async function (err, account) {
        account.startTime.hours = hoursStart;
        account.startTime.minutes = minutesStart;
        account.endTime.hours = hoursEnd;
        account.endTime.minutes = minutesEnd;
        account.save();

        var publishEventPr = particle.publishEvent({ name: 'time range', data: JSON.stringify({ startHour: hoursStart, startMin: minutesStart, endHour: hoursEnd, endMin: minutesEnd, deviceName: particleDeviceName, ok: true }), auth: particleToken });

        //Particle schenagigans
        //Sends updated time range to the device
        await publishEventPr.then(
            function (data) {
                if (data.body.ok) { console.log("Time range Event published succcessfully"); }
            },
            function (err) {
                console.log("Failed to publish frequency event " + err);
            }
        );
    });



});

module.exports = router;

