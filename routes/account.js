var express = require('express');
var superagent = require('superagent');
const Accounts = require('../models/account');
var router = express.Router();
var jwt = require('jsonwebtoken');
const secret = "illegalpetes";
var Particle = require('particle-api-js');
const { start } = require('forever-monitor');
var particle = new Particle();

// The code utilizes the device name and converts to ASCII numbers to generate the key
function apiKeyGeneration(s) {
    let charCodeArr = [];
    let apikeyString = "";


    for (let index = 0; index < s.length; index++) {
        let code = s.charCodeAt(index);

        charCodeArr.push(code);
    }

    for (let index = 0; index < charCodeArr.length; index++) {
        apikeyString = apikeyString + charCodeArr[index];

    }
    console.log(apikeyString);
    return apikeyString;

}


router.post('/addDevice', function (req, res) {
    console.log(req.body.device);
    const token = req.body.token; // JWT token
    console.log(token);
    if (!req.body.token) {
        return res.status(401).json({ success: false, msg: "Missing token" });
    }

    try {
        const decoded = jwt.decode(token, secret);
        console.log(decoded);
        // Send back the array of devices associated with the account
        Accounts.findOne({ email: decoded.email }, async function (err, account) {
            if (err) {
                res.status(400).json({ success: false, message: "Error contacting DB. Please contact support." });
            }
            else {
                //Validates if device already exists
                if (account.devices.includes(req.body.device)) {
                    console.log("Yoyo");
                    res.status(201).json({ success: false, message: "This device already exists" });
                }
                else {
                    const nameToAdd = req.body.device;
                    const keyToAdd = jwt.sign(nameToAdd, secret);
                    const device = { name: nameToAdd, key: keyToAdd };
                    // Make sure not adding duplicate device
                    var canAdd = true;
                    for (var i = 0; i < account.devices.length; i++) {
                        var currDevice = account.devices[i];
                        if (currDevice.name == nameToAdd) {
                            var canAdd = false;
                        }
                    }
                    if (canAdd) {
                        account.devices.push(device);
                    }
                    await account.save();
                    const arrayToReturn = account.devices.map(({ name, key }) => name);
                    res.status(200).json(arrayToReturn);
                }
            }
        });
    }
    catch (ex) {
        res.status(401).json({ success: false, message: "Invalid JWT" });
    }
});

router.post('/removeDevice', function (req, res) {
    console.log(req.body.device);
    const token = req.body.token; //JWT token
    console.log(token);
    if (!req.body.token) {
        return res.status(401).json({ success: false, msg: "Missing token" });
    }

    try {
        const decoded = jwt.decode(token, secret);
        console.log(decoded);
        // Send back the array of devices associated with the account
        Accounts.findOne({ email: decoded.email }, async function (err, account) {
            console.log(req.body.device);
            if (err) {
                res.status(400).json({ success: false, message: "Error contacting DB. Please contact support." });
            }
            // Checks if device is not on account
            else if (!account.devices.map(({ name, key }) => name).includes(req.body.device)) {
                res.status().json({ success: false, message: "Uh, this device doesn't exist on the account" });
            }
            else {
                if (account.devices.length > 0) {
                    for (let index = 0; index < account.devices.length; index++) {
                        if (account.devices[index].name === req.body.device) {
                            account.devices.splice(index, 1);
                            await account.save();
                            break;
                        }
                    }
                    await account.save();
                    //Converts object dictionary to array
                    const arrayToReturn = account.devices.map(({ name, key }) => name);
                    res.status(200).json(arrayToReturn);
                }
                else {
                    res.status(200).json([]);
                }
            }
        });
    }
    catch (ex) {
        res.status(401).json({ success: false, message: "Invalid JWT" });
    }
});

router.get('/getDevices', async function (req, res) {
    const particleToken = req.query.particleToken;

    if (!req.query.webToken) {
        return res.status(400).json({ success: false, msg: "Missing token" });
    }

    if (!req.query.particleToken) {
        return res.status(400).json({ success: false, msg: "No Particle token is on the server" });
    }

    try {
        var devicesPr = particle.listDevices({ auth: particleToken });
        var particleExists = true;

        var deviceArray;

        await devicesPr.then( // Particle promise to log into the account
            function (devices) {
                deviceArray = devices;
            },

            function (err) {
                particleExists = false;
            }
        );

        if (!particleExists) {
            res.status(400).json({ msg: "You don't have a particle account" });
        }
        else {
            res.status(201).json({ devices: deviceArray });
        }


    }
    catch (ex) {
        res.status(401).json({ success: false, message: "Invalid JWT" });
    }
});

router.get('/getLocalDevices', function (req, res) {
    const webToken = req.query.webToken; //JWT token
    if (!req.query.webToken) {
        return res.status(400).json({ success: false, msg: "Missing token" });
    }
    try {
        const decoded = jwt.decode(webToken, secret);
        //Send back the array of devices associated with the account
        Accounts.findOne({ email: decoded.email }, async function (err, account) {
            if (err) {
                res.status(400).json({ success: false, message: "Error contacting DB. Please contact support." });
            }
            else {
                const arrayToReturn = account.devices.map(({ name, key }) => name);
                res.status(200).json(arrayToReturn);
            }
        });

    }
    catch (ex) {
        res.status(401).json({ success: false, message: "Invalid JWT" });

    }
});

router.post('/getFrequencyAndTimes', async function (req, res) {
    var webToken = req.body.webToken; //JWT token
    var particleToken = req.body.particleToken;
    var deviceName = req.body.deviceName;

    var frequency, startHour, startMinutes, endHour, endMinutes; //Variables to return
    //start refers to beginning time, ie, startHour:startMinutes
    //end refers to ending time, ie, endHour:endMinutes


    if (!req.body.webToken) {
        return res.status(400).json({ success: false, msg: "Missing token" });
    }
    try {
        const decoded = jwt.decode(webToken, secret);
        Accounts.findOne({ email: decoded.email }, async function (err, account) {
            if (err) {
                res.status(400).json({ success: false, msg: "Error contacting DB. Please contact support" });
            }
            else if (account == null) {
                res.status(400).json({ success: false, msg: "Account doesn't exist" });
            }
            else {
                if (account.frequency != null) {
                    frequency = account.frequency;
                }
                else {
                    account.frequency = 30; // Default value is 30 minutes
                    frequency = account.frequency;
                }


                if (account.startTime != null) {
                    const startTime = account.startTime;
                }
                else {
                    account.startTime.hours = 6;
                    account.startTime.minutes = 0;
                    //Default value is 6:00 AM
                }


                if (account.endTime != null) {
                    const endTime = account.endTime;
                }
                else {
                    account.endTime.hours = 22;
                    account.endTime.minutes = 0;
                    //Defualt value is 10:00 PM
                }

                frequency = account.frequency;
                startHour = account.startTime.hours;
                startMinutes = account.startTime.minutes;
                endHour = account.endTime.hours;
                endMinutes = account.endTime.minutes;

                startTime = { hours: startHour, minutes: startMinutes }; // Packaging the times into more convienent objects
                endTime = { hours: endHour, minutes: endMinutes };

                res.status(200).json({ frequency: frequency, startTime: startTime, endTime: endTime });

            }

            var publishEventPr = particle.publishEvent({ // Particle promise to send time and frequency data to device
                name: 'initial sync', data: JSON.stringify({
                    frequency: frequency,
                    startHour: startHour,
                    startMin: startMinutes,
                    endHour: endHour,
                    endMin: endMinutes,
                    deviceName: deviceName,
                    ok: true
                }), auth: particleToken
            });

            await publishEventPr.then(
                function (data) {
                    if (data.body.ok) { console.log("Initial send through successful"); }
                },
                function (err) {
                    console.log("Failed to send inital data " + err);
                }
            );


            var apikey = apiKeyGeneration(deviceName); // Making the api key for the device to exchange

            Accounts.findOne({ email: decoded.email }, async function (err, account) {
                if (err) {
                    res.status(400).json({ success: false, msg: "Error contacting DB. Please contact support" });
                }

                account.apikey = apikey;
                account.save();
            });

            var publishEventPr2 = particle.publishEvent({ // Sending the token to the device separately via particle promise
                name: 'token delivery', data: JSON.stringify({
                    apikey: apikey, ok: true
                }), auth: particleToken
            });

            await publishEventPr2.then(
                function (data) {
                    if (data.body.ok) { console.log("Token delivered"); }
                },
                function (err) {
                    console.log("Failed to send token. Iss too big");
                }
            );
        });

    }
    catch (ex) {
        res.status(401).json({ success: false, message: "Invalid JWT" });
    }
});

router.post('/getDailyData', function (req, res) {
    var date = req.body.date;
    var day = new Date(date);
    var webToken = req.body.webToken; // JWT token
    var heartData;
    var arrayToSend = [];


    if (!req.body.webToken) {
        return res.status(400).json({ success: false, msg: "Missing token" });
    }

    try {
        const decoded = jwt.decode(webToken, secret);
        Accounts.findOne({ email: decoded.email }, function (err, account) {
            heartData = account.recordedValues;


            heartData.forEach(element => { // Filters data by the day being looked for
                if ((day.getFullYear() == element.timestamp.getFullYear())
                    && (day.getMonth() == element.timestamp.getMonth())
                    && (day.getDate() == element.timestamp.getDate())) {
                    arrayToSend.push(element);
                }
            });

            var timestamp = [], pulse = [], spo2 = [];

            arrayToSend.forEach(element => {
                //Splits the datapoint object into 3 separate arrays with manipulation to get 12-hour time out of date objects
                var hour = ("0" + element.timestamp.getHours()).slice(-2);
                var minute = ("0" + element.timestamp.getMinutes()).slice(-2);
                var meridian = "AM";
                if (hour >= 12) {
                    meridian = "PM";
                }
                hour %= 12;
                if (hour == 0) {
                    hour = 12;
                }
                timestamp.push(hour + ":" + minute + " " + meridian);
                pulse.push(element.pulse);
                spo2.push(element.saturation);
            });

            res.status(200).json({ success: true, timestamps: timestamp, pulses: pulse, spo2s: spo2 });
        });
    }
    catch (ex) {
        res.status(401).json({ success: false, message: "Invalid JWT" });
    }

});

router.post('/getWeeklyData', function (req, res) {
    var webToken = req.body.webToken; //JWT token
    var now = new Date();
    var lastWeek = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));; // Getting last 7 days using JS time methods
    var heartData;
    var arrayToSend = [];

    if (!req.body.webToken) {
        return res.status(400).json({ success: false, msg: "Missing token" });
    }

    try {
        const decoded = jwt.decode(webToken, secret);
        Accounts.findOne({ email: decoded.email }, function (err, account) {
            heartData = account.recordedValues;

            heartData.forEach(element => { //Filtering by the last 7 days
                if (element.timestamp.getTime() >= lastWeek.getTime()) {
                    arrayToSend.push(element);
                }
            });

            var timestamp = [], pulse = [], spo2 = [];

            arrayToSend.forEach(element => {
                //Splits the datapoint object into 3 separate arrays with manipulation to get 12-hour time out of date objects
                var hour = ("0" + element.timestamp.getHours()).slice(-2);
                var minute = ("0" + element.timestamp.getMinutes()).slice(-2);
                var meridian = "AM";
                if (hour >= 12) {
                    meridian = "PM";
                }
                hour %= 12;
                if (hour == 0) {
                    hour = 12;
                }
                var day = element.timestamp.getDate();
                var month = element.timestamp.getMonth() + 1;
                var year = element.timestamp.getYear() + 1900;
                timestamp.push(month + "/" + day + "/" + year + " @ " + hour + ":" + minute + " " + meridian);
                pulse.push(element.pulse);
                spo2.push(element.saturation);
            });
            var heartSum = 0;
            var minHeart = 1000;
            var minHeartIndex = -1;
            var maxHeart = -1;
            var maxHeartIndex = -1;
            // Finding the minimums and maximums of the data provided and the corresponding indexes
            for (var i = 0; i < pulse.length; i++) {
                heartSum += pulse[i];
                if (pulse[i] < minHeart) {
                    minHeart = pulse[i];
                    minHeartIndex = i;
                }
                if (pulse[i] > maxHeart) {
                    maxHeart = pulse[i];
                    maxHeartIndex = i;
                }
            }
            var avgHeartRate = (heartSum / pulse.length).toFixed(2);
            var maxHeartTime = timestamp[maxHeartIndex];
            var minHeartTime = timestamp[minHeartIndex];

            var spo2Sum = 0;
            var minSPO2 = 1000;
            var minSPO2Index = -1;
            var maxSPO2 = -1;
            var maxSPO2Index = -1;
            for (var i = 0; i < spo2.length; i++) {
                spo2Sum += spo2[i];
                if (spo2[i] < minSPO2) {
                    minSPO2 = spo2[i];
                    minSPO2Index = i;
                }
                if (spo2[i] > maxSPO2) {
                    maxSPO2 = spo2[i];
                    maxSPO2Index = i;
                }
            }
            var avgSPO2 = (spo2Sum / spo2.length).toFixed(2);
            var maxSPO2Time = timestamp[maxSPO2Index];
            var minSPO2Time = timestamp[minSPO2Index];


            res.status(200).json({ success: true, avgHeartRate: avgHeartRate, maxHeart: maxHeart, maxHeartTime: maxHeartTime, minHeart: minHeart, minHeartTime: minHeartTime, avgSPO2: avgSPO2, maxSPO2: maxSPO2, maxSPO2Time: maxSPO2Time, minSPO2: minSPO2, minSPO2Time: minSPO2Time });
        });
    }
    catch (ex) {
        res.status(401).json({ success: false, message: "Invalid JWT" });
    }




});

module.exports = router;