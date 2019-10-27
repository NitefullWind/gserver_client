var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');

// var logger = require('morgan');
var log4js = require('./project/logger');
var logger = log4js.getLogger("app");

var session = require('express-session')
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var flash = require('./project/flash')
var config = require('./project/config')
var gameserver = require('./project/socket_server')(config.get('gameserver.port'), config.get('gameserver.tsPort'), config.get('gameserver.tsHost'))
var chatserver = require('./project/socket_server')(config.get('chatserver.port'), config.get('chatserver.tsPort'), config.get('chatserver.tsHost'))

var app = express();

// session 必须在路由之前，否则路由中无法使用session
app.use(session({
    secret: "gserver_client",
    saveUninitialized: false,
    resave: false,
    cookie: {
        maxAge: config.get('session.maxAge')
    }
}))

// 使用消息闪现
app.use(flash())

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// app.use(logger('dev'));
app.use(log4js.connectLogger(log4js.getLogger("http"), {level: "auto"}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(secret="gserver_client"));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    logger.error("Something went wrong:", err);
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
