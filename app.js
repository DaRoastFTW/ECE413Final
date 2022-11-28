var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var util= require('util');
var encoder = new util.TextEncoder('utf-8');

const bodyParser = require('body-parser');     // Parses JSON in body
// for mongDB
const Accounts = require("./models/account");

var argonRouter = require("./routes/argon.js");
var loginRouter = require("./routes/login.js");
var signupRouter = require("./routes/signup.js");
var accountRouter = require("./routes/account.js");
var particleAccountRouter = require("./routes/particleLogin.js");

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// This is to enable cross-origin access
app.use(function (req, res, next) {
  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', '*');
  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', true);
  // Pass to next layer of middleware
  next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/argon', argonRouter);
app.use('/login', loginRouter);
app.use('/signup', signupRouter);
app.use('/account', accountRouter);
app.use('/particleLogin', particleAccountRouter);
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


app.listen(3000);

module.exports = app;