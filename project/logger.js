var log4js = require('log4js');

log4js.configure("config/log4js.json"); //相对当前工程的的目录

module.exports = log4js;