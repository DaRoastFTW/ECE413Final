var express = require('express');
const Accounts = require('../models/account');
var router = express.Router();
var bcrypt = require('bcrypt');


router.post("/signUp", function (req, res)
{
    Accounts.findOne({email: req.body.email}, function (err, account) {
        if (err) res.status(401).json({success: false, err: err});
        else if (account) {
            res.status(401).json({success: false, msg: "This email already used"});
        }
        else {
            const passwordHash = bcrypt.hashSync(req.body.password, 10);
            const newAccount = new Accounts({
                email: req.body.email,
                password: passwordHash    
            });
            
            newAccount.save(function (err, account) {
                if (err) {
                    res.status(400).json({success: false, err: err});
                }
                else {
                    let msgStr = `Customer (${req.body.email}) account has been created`;
                    res.status(201).json({success: true, message: msgStr});
                    console.log(msgStr);
                }
            })
        }
    })
});

module.exports = router;