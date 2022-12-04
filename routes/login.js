var express = require('express');
const Accounts = require('../models/account');
var router = express.Router();
var bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');
const { decode } = require('jsonwebtoken');
const secret = "illegalpetes";
//buncha stuff

router.post("/login", function (req, res) {
    Accounts.findOne({ email: req.body.email }, function (err, account) {
        if (err) {
            res.status(400).send(err);
        }
        else if (!account) {
            // Email not in database
            res.status(401).json({ msg: "Login failure!!" });
        }
        else if (bcrypt.compareSync(req.body.password, account.password)) {
            const token = jwt.sign({ email: account.email }, secret);
            const particleToken = account.particleToken;
            account.lastAccess = new Date();
            account.save((err, account) => {
                console.log("User's LastAccess has been update");
            });
            // Send back token
            res.status(201).json({success: true, token: token, particleToken: particleToken, msg: "Login success"});
        }
        else {
            res.status(401).json({success: false, msg: "Email or password invalid"});
        }
    })
});

router.get("/status", function (req, res) {
    //See if the X-Auth header is set
    if (!req.body.token) {
        return res.status(401).json({success: false, msg: "Missing token"});
    }

    // X-Auth should contain the token
    const token = req.body.token;
    try {
        const decoded = jwt.decode(token, secret);
        // Send back email and last access
        Accounts.find({email: decoded.email}, "email lastAccess", function (err, account) {
            if (err) {
                res.status(400).json({success: false, message: "Error contacting DB. Please contact support."});
            }
            else {
                res.status(200).json(account);
            }
        });
    }
    catch (ex) {
        res.status(401).json({success: false, message: "Invalid JWT"});
    }
});

module.exports = router;