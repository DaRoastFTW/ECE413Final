var express = require('express');
var router = express.Router();

router.get('/store', function(req, res, next) {
    var event = req.query.event;
    var data = req.query.data;
    console.log(event);
    console.log(data);
    res.status(200).json("got it");
});


module.exports = router;