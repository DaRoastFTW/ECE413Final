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
                console.log("User's LastAccess has been updated");
            });
            // Send back token
            res.status(201).json({ success: true, token: token, particleToken: particleToken, msg: "Login success" });
        }
        else {
            res.status(401).json({ success: false, msg: "Email or password invalid" });
        }
    })
});


module.exports = router;