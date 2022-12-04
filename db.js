//to use mongoDB
const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost/accounts", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

module.exports = mongoose;