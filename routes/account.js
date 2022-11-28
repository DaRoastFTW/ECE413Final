var express = require('express');
var superagent = require('superagent');
const Accounts = require('../models/account');
var router = express.Router();
var jwt = require('jsonwebtoken');
const secret = "illegalpetes";

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
                    account.devices.push(device);
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
            else if (!account.devices.map(({name, key}) => name).includes(req.body.device)) {
                res.status().json({ success: false, message: "Uh, this device doesn't exist on the account" });
            }
            else {
                for (let index = 0; index < account.devices.length; index++) {
                    if (account.devices[index].name === req.body.device) {
                        account.devices.splice(index, 1);
                        break;
                    }
                }
                await account.save();
                const arrayToReturn = account.devices.map(({ name, key }) => name);
                res.status(200).json(arrayToReturn);
            }
        });
    }
    catch (ex) {
        res.status(401).json({ success: false, message: "Invalid JWT" });
    }
});

router.get('/getDevices', function (req, res) {
    const token = req.query.token;

    if (!req.query.token) {
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
                const arrayToReturn = account.devices.map(({ name, key }) => name);
                res.status(200).json(arrayToReturn);
            }
        });
    }
    catch (ex) {
        res.status(401).json({ success: false, message: "Invalid JWT" });
    }
});

module.exports = router;