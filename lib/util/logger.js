/*
 * @Author: horan 
 * @Date: 2017-07-09 09:47:30 
 * @Last Modified by: horan
 * @Last Modified time: 2019-04-25 17:44:40
 * @Creates and manages the log
 */

var winston = require('winston');
require('winston-daily-rotate-file');
var moment = require('moment');
var path = require("path");
var appRoot = require('app-root-path');

var console_debug = new(winston.transports.Console)({
    level: 'debug'
});

var dailyRotateFile_info = new(winston.transports.DailyRotateFile)({
    level: 'info',
    filename: path.join(appRoot.path, "logs/info", 'logger-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxFiles: '14d'
});

var dailyRotateFile_error = new(winston.transports.DailyRotateFile)({
    level: 'error',
    filename: path.join(appRoot.path, "logs/error", 'logger-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxFiles: '14d'
});

var dailyRotateFile_warning = new(winston.transports.DailyRotateFile)({
    level: 'warning',
    filename: path.join(appRoot.path, "logs/trace", 'trace-%DATE%.txt'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxFiles: '14d'
});

var logger = winston.createLogger({
    levels: winston.config.syslog.levels,
    transports: [
        console_debug,
        dailyRotateFile_info,
        dailyRotateFile_error,
        dailyRotateFile_warning
    ],
    format: winston.format.combine(
        winston.format.simple()
    )
});

var logMethod = function (level, cluster, index, msg) {
    var meta = {};
    if (cluster)
        meta.cluster = cluster;
    if (index)
        meta.index = index;
    if (level === "error") {
        var info = {};
        info.cluster = cluster;
        info.index = index;
        info.msg = msg;
        require('./util.js').updateInfoArray(info.cluster, info.index, info.msg, "S");
    }
    var outputMsg = moment(new Date()).format('YYYY-MM-DD HH:mm:ss') + '\xa0|\xa0' +
        (level ? level : '') + '\xa0|\xa0' +
        (cluster ? cluster : '') + '\xa0|\xa0' +
        (index ? index : '') + '\xa0|\xa0' +
        (msg ? msg : '');
    logger.log(level, outputMsg);
};

module.exports = {
    logMethod: logMethod
};