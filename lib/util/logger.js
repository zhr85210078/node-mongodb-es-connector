/*
 * @Author: horan 
 * @Date: 2017-07-09 09:47:30 
 * @Last Modified by:   horan 
 * @Last Modified time: 2018-07-09 09:47:30 
 * @Creates and manages the log
 */

var winston = require('winston');
var RotateFile = require('winston-daily-rotate-file');
var moment = require('moment');
var path = require("path");
var appRoot = require('app-root-path');

winston.setLevels({
    error: 0,
    warn: 1,
    info: 2,
    verbose: 3,
    debug: 4,
    silly: 5
});

winston.addColors({
    error: 'red',
    warn: 'yellow',
    info: 'green',
    verbose: 'blue',
    debug: 'cyan',
    silly: 'pink'
});

var logger = new(winston.Logger)({
    transports: [
        new(winston.transports.Console)({
            level: 'debug',
            prettyPrint: true,
            colorize: true,
            silent: false,
            timestamp: function () {
                return moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
            }
        }),
        new(RotateFile)({
            level: 'info',
            prettyPrint: true,
            silent: false,
            colorize: false,
            name: 'info-file',
            filename: path.join(appRoot.path, "logs/info/logger"),
            timestamp: function () {
                return moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
            },
            json: false,
            maxFiles: '14d',
            datePattern: '-yyyy-MM-dd.log',
            formatter: function (options) {
                return options.timestamp() + ' ' + options.level.toUpperCase() + ' ' + (options.message ? options.message : '') +
                    (options.meta && Object.keys(options.meta).length ? '\n\t' + JSON.stringify(options.meta) : '');
            }
        }),
        new(RotateFile)({
            level: 'error',
            prettyPrint: true,
            silent: false,
            colorize: false,
            name: 'error-file',
            filename: path.join(appRoot.path, "logs/error/logger"),
            timestamp: function () {
                return moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
            },
            json: false,
            maxFiles: '14d',
            datePattern: '-yyyy-MM-dd.log',
            formatter: function (options) {
                return options.timestamp() + ' ' + options.level.toUpperCase() + ' ' + (options.message ? options.message : '') +
                    (options.meta && Object.keys(options.meta).length ? '\n\t' + JSON.stringify(options.meta) : '');
            },
            exitOnError: false
        }),
        new(RotateFile)({
            level: 'warn',
            prettyPrint: true,
            silent: false,
            colorize: false,
            name: 'warn-file',
            filename: path.join(appRoot.path, "logs/trace/trace"),
            timestamp: function () {
                return moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
            },
            json: false,
            maxFiles: '14d',
            datePattern: '-yyyy-MM-dd.txt',
            formatter: function (options) {
                return options.level === "warn" ? options.timestamp() + "," + options.message : "";
            }
        })
    ]
});

var logMethod = function (type, msg) {
    logger.log(type, msg);
};

var errMethod = function (cluster, index, msg) {
    var info = {};
    info.cluster = cluster;
    info.index = index;
    info.msg = msg;
    require('./util.js').updateInfoArray(info.cluster, info.index, info.msg, "S");
    logger.error(JSON.stringify(info));
};

module.exports = {
    logMethod: logMethod,
    errMethod: errMethod
};