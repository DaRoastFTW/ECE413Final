var express = require('express');
const Accounts = require('../models/account');
var router = express.Router();
var Particle = require('particle-api-js');
var particle = new Particle();
var jwt = require('jsonwebtoken');
const { json } = require('express');
const secret = "illegalpetes";

router.post("/login", async function (req, res) {
    var tempParticleToken = "";
    var particleFail = false;
    await particle.login({ username: req.body.email, password: req.body.password }).then( // Logs in using the Particle Cloud and login
        function (data) {
            console.log("Particle Success");
            tempParticleToken = data.body.access_token;
        },
        function (err) {
            particleFail = true;
        }
    );
    if (particleFail) {
        return res.status(400).json({ msg: "This ain't it chief" });
    }

    var accountInfo = jwt.decode(req.body.webtoken, secret);
    var accountEmail = accountInfo.email;

    // Stores particle token from promise above into the database
    Accounts.findOne({ email: accountEmail }, async function (err, account) {
        if (err) {
            return res.status(400).json({ msg: "Account doesn't exist locally: " + accountEmail });
        }

        account.particleToken = tempParticleToken;
        account.save((err, account) => {
            console.log("User's particle token has been updated");
        });
        res.status(200).json({ msg: "Particle token updated for local acccount", particleToken: tempParticleToken });

    });
});



module.exports = router;
