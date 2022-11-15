var express = require('express');
var router = express.Router();

router.post('/store', function(req, res, next) {
    var event = req.body.event;
    var data = req.body.data;
    console.log(event);
    console.log(data);
    res.status(200).json("got it");
});


module.exports = router;

// Check device ID to see if it even has an entry in our system. If not, toss data.
// If it does, match that account and put in the timestamp, 