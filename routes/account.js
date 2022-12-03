var express = require('express');
var superagent = require('superagent');
const Accounts = require('../models/account');
var router = express.Router();
var jwt = require('jsonwebtoken');
const secret = "illegalpetes";
var Particle = require('particle-api-js');
const { start } = require('forever-monitor');
var particle = new Particle();

router.post('/addDevice', function (req, res) {
    console.log(req.body.device);
    const token = req.body.token;
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
                    //FIXME: Send the keyToAdd to the right Particle device
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
    const token = req.body.token;
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
        return res.status(400).json({ success: false, msg: "No hablo ingles" });
    }

    try {
        var devicesPr = particle.listDevices({ auth: particleToken });
        console.log("Particle token: " + particleToken);
        var particleExists = true;

        var deviceArray;

        await devicesPr.then(
            function (devices) {
                deviceArray = devices;
            },

            function (err) {
                //console.log("Yea, failed ", err);
                particleExists = false;
                console.log("particleExists: " + particleExists);
            }
        );

        if (!particleExists) {
            console.log("Bye bye");
            res.status(400).json({ msg: "invalid_token" });
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
    const webToken = req.query.webToken;
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

router.get('/getFrequencyAndTimes', async function (req, res) {
    var webToken = req.query.webToken;
    var particleToken = req.query.particleToken;
    var deviceName = req.query.deviceName;
    console.log("Web token: " + webToken);
    console.log("Dump:" + JSON.stringify(req.query));
    if (!req.query.webToken) {
        return res.status(400).json({ success: false, msg: "Missing token" });
    }
    try {
        const decoded = jwt.decode(webToken, secret);

        Accounts.findOne({ email: decoded.email }, async function (err, account) {
            if (err) {
                res.status(400).json({ success: false, message: "Error contacting DB. Please contact support" });
            }
            else if (account == null) {
                res.status(400).json({ success: false, message: "Account doesn't exist" });
            }
            else {
                var frequency;
                if (account.frequency != null) {
                    frequency = account.frequency;
                }
                else {
                    account.frequency = 30;
                    frequency = account.frequency;
                }


                if (account.startTime != null) {
                    const startTime = account.startTime;
                }
                else {
                    account.startTime.hours = 9;
                    account.startTime.minutes = 0;
                }


                if (account.endTime != null) {
                    const endTime = account.endTime;
                }
                else {
                    account.endTime.hours = 5;
                    account.endTime.minutes = 0;
                }

                var publishEventPr = particle.publishEvent({ name: 'initial send', data: JSON.stringify({
                    frequency: account.frequency, 
                    startHour: account.startTime.hours,
                    startMinutes: account.startTime.minutes,
                    endHour: account.endTime.hours,
                    endMinutes: account.endTime.minutes,
                    deviceName: deviceName, 
                    ok: true}), auth: particleToken });

                await publishEventPr.then(
                    function (data) {
                        if (data.body.ok) {console.log("Initial send through successful");}
                    },
                    function (err) {
                        console.log("Failed to send inital data " + err);
                    }
                );

                res.status(200).json({ frequency: frequency, startTime: startTime, endTime: endTime });
            }
        });


    }
    catch (ex) {
        res.status(401).json({ success: false, message: "Invalid JWT" });
    }
});

module.exports = router;