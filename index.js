/*
 * @Author: horan 
 * @Date: 2017-07-09 10:24:53 
 * @Last Modified by: horan
 * @Last Modified time: 2019-03-13 10:28:17
 * @Api
 */

var _ = require('underscore');
var fs = require('fs');
var path = require("path");
var moment = require('moment');
var appRoot = require('app-root-path');
var logger = require('./lib/util/logger.js');
var main = require('./lib/main');
var ase = require("./lib/util/ase");
var filePath = path.join(appRoot.path, "crawlerData");

var start = function () {
    var getFileList = require('./lib/util/util').readFileList(filePath, [], ".json");
    require('./lib/util/util').createInfoArray(getFileList);
    main.init(getFileList, filePath);
};

var addWatcher = function (fileName, obj, isAse) {
    var flag = false;
    try {
        var objStr = "";
        if (isAse) {
            objStr = ase.aesEncrypt(JSON.stringify(obj), "pwd");
        } else {
            objStr = JSON.stringify(obj);
        }
        fs.writeFileSync(path.join(filePath, fileName + '.json'), objStr);
        if (fs.existsSync(path.join(filePath, fileName + '.timestamp'))) {
            fs.unlinkSync(path.join(filePath, fileName + '.timestamp'));
        }
        var existInfo = false;
        if (global.infoArray && global.infoArray.length > 0) {
            _.find(global.infoArray, function (file) {
                if (file.cluster === obj.elasticsearch.e_connection.e_server &&
                    file.index === obj.elasticsearch.e_index) {
                    existInfo = true;
                    return;
                }
            });
        } else {
            global.infoArray = [];
        }
        if (!existInfo) {
            var item = {};
            item.cluster = obj.elasticsearch.e_connection.e_server;
            item.index = obj.elasticsearch.e_index;
            item.msg = "";
            item.status = "w";
            global.infoArray.push(item);
        }
        flag = true;
        return flag;
    } catch (error) {
        logger.logMethod('error',
            obj.elasticsearch.e_connection.e_server,
            obj.elasticsearch.e_index,
            'AddWatcher error: ' + error);
    }
};

var updateWatcher = function (fileName, obj, isAse) {
    var flag = false;
    try {
        if (isAse) {
            objStr = ase.aesEncrypt(JSON.stringify(obj), "pwd");
        } else {
            objStr = JSON.stringify(obj);
        }
        fs.writeFileSync(path.join(filePath, fileName + '.json'), objStr);
        if (fs.existsSync(path.join(filePath, fileName + '.timestamp'))) {
            fs.unlinkSync(path.join(filePath, fileName + '.timestamp'));
        }
        var existInfo = false;
        if (global.infoArray && global.infoArray.length > 0) {
            _.find(global.infoArray, function (file) {
                if (file.cluster === obj.elasticsearch.e_connection.e_server &&
                    file.index === obj.elasticsearch.e_index) {
                    existInfo = true;
                    return;
                }
            });
        } else {
            global.infoArray = [];
        }
        if (!existInfo) {
            var item = {};
            item.cluster = obj.elasticsearch.e_connection.e_server;
            item.index = obj.elasticsearch.e_index;
            item.msg = "";
            item.status = "w";
            global.infoArray.push(item);
        }
        flag = true;
        return flag;
    } catch (error) {
        logger.logMethod('error',
            obj.elasticsearch.e_connection.e_server,
            obj.elasticsearch.e_index,
            'UpdateWatcher error: ' + error);
    }
};

var deleteWatcher = function (fileName) {
    var flag = false;
    var newArray = [];
    try {
        if (isExistWatcher(fileName)) {
            var currentFileContent = require(path.join(filePath, fileName + '.json'));
            if (global.infoArray && global.infoArray.length > 0) {
                _.find(global.infoArray, function (file) {
                    if (file.cluster === currentFileContent.elasticsearch.e_connection.e_server &&
                        file.index === currentFileContent.elasticsearch.e_index) {
                        return;
                    } else {
                        newArray.push(file);
                    }
                });
            }
            global.infoArray = newArray;
            fs.unlinkSync(path.join(filePath, fileName + '.json'));
            if (fs.existsSync(path.join(filePath, fileName + '.timestamp'))) {
                fs.unlinkSync(path.join(filePath, fileName + '.timestamp'));
            }
            flag = true;
            return flag;
        }
        return flag;
    } catch (error) {
        logger.logMethod('error',
            '',
            '',
            'DeleteWatcher error: ' + error);
    }
};

var isExistWatcher = function (fileName) {
    var flag = false;
    try {
        if (fs.existsSync(path.join(filePath, fileName + '.json'))) {
            flag = true;
        }
        return flag;
    } catch (error) {
        logger.logMethod('error',
            '',
            '',
            'IsExistWatcher error: ' + error);
    }
};

var getInfoArray = function () {
    if (global.infoArray) {
        var newDate = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
        var filePath = path.join(appRoot.path, "logs/status.log");
        var jsonData = newDate + " " + JSON.stringify(global.infoArray);
        fs.writeFileSync(filePath, jsonData);
        return global.infoArray;
    } else {
        return null;
    }
};

var startTrace = function () {
    return global.isTrace = true;
}

var stropTrace = function () {
    return global.isTrace = false;
}

var readLog = function (type, date, e_server, e_index) {
    return require('./lib/util/util').readLog(type, date, e_server, e_index);
}

module.exports = {
    start: start,
    addWatcher: addWatcher,
    updateWatcher: updateWatcher,
    deleteWatcher: deleteWatcher,
    isExistWatcher: isExistWatcher,
    getInfoArray: getInfoArray,
    startTrace: startTrace,
    stropTrace: stropTrace,
    readLog: readLog
};