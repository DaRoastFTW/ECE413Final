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
     await particle.login({username: req.body.email, password: req.body.password}).then(
        function(data) {
            console.log("Particle Success");
            tempParticleToken = data.body.access_token;
            

        },
        function(err) {
            particleFail = true;
        }
    );
    console.log(tempParticleToken);
    if (particleFail) {
        return res.status(400).json({msg: "This ain't it chief"});
    }

    var accountInfo = jwt.decode(req.body.webtoken, secret);    
    var accountEmail = accountInfo.email;

    Accounts.findOne({email: accountEmail}, async function (err, account) {
        console.log("Hello Ary");
        if (err) {
            return res.status(400).json({msg: "L moment" + accountEmail});
        }

        console.log("Chris");
        account.particleToken = tempParticleToken;
        account.save((err, account) => {
            console.log("User's particle token has been update");
        });
        console.log("Rusty");
        console.log(account.particleToken);
        console.log("Ary");
        res.status(200).json({msg: "Subarashii!", particleToken: tempParticleToken});

    });
});



module.exports = router;
