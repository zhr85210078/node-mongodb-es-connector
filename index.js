/*
 * @Author: horan 
 * @Date: 2017-07-09 10:24:53 
 * @Last Modified by: horan
 * @Last Modified time: 2018-07-31 18:03:07
 * @Api
 */

var _ = require('underscore');
var fs = require('fs');
var path = require("path");
var logger = require('./lib/util/logger.js');
var main = require('./lib/main');
var currentFilePath = "";

var start = function (filePath) {
    currentFilePath = filePath;
    var getFileList = require('./lib/util/util').readFileList(filePath, []);
    require('./lib/util/util').createInfoArray(getFileList);
    main.init(getFileList, filePath);
};

var modifyCurrentFilePath = function (path) {
    currentFilePath = path;
}

var addWatcher = function (fileName, obj) {
    var flag = false;
    try {
        var files = fs.readdirSync(currentFilePath);
        if (files && files.length > 0) {
            files.forEach(function (name) {
                var item = JSON.parse(fs.readFileSync(path.join(currentFilePath, name)));
                if ((fileName + '.json') !== name) {
                    if ((item.elasticsearch.e_connection.e_server == obj.elasticsearch.e_connection.e_server &&
                            item.elasticsearch.e_index != obj.elasticsearch.e_index) ||
                        (item.elasticsearch.e_connection.e_server != obj.elasticsearch.e_connection.e_server &&
                            item.elasticsearch.e_index == obj.elasticsearch.e_index) ||
                        (item.elasticsearch.e_connection.e_server != obj.elasticsearch.e_connection.e_server &&
                            item.elasticsearch.e_index != obj.elasticsearch.e_index)) {
                        var file = path.join(currentFilePath, fileName + '.json');
                        fs.writeFileSync(file, JSON.stringify(obj));
                        flag = true;
                        var existInfo = false;
                        if (global.infoArray && global.infoArray.length > 0) {
                            _.find(global.infoArray, function (file) {
                                if (file.cluster === obj.elasticsearch.e_connection.e_server &&
                                    file.index === obj.elasticsearch.e_index) {
                                    existInfo = true;
                                    return;
                                }
                            });
                        }
                        else{
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
                    }
                }
            });
        } else {
            var file = path.join(currentFilePath, fileName + '.json');
            fs.writeFileSync(file, JSON.stringify(obj));
            flag = true;
        }
        return flag;
    } catch (error) {
        logger.errMethod(obj.elasticsearch.e_connection.e_server, obj.elasticsearch.e_index, "addWatcher error: " + error);
    }
};

var updateWatcher = function (fileName, obj) {
    var flag = false;
    try {
        var files = fs.readdirSync(currentFilePath);
        if (files && files.length > 0) {
            files.forEach(function (name) {
                if ((fileName + '.json') === name) {
                    var file = path.join(currentFilePath, fileName + '.json');
                    fs.writeFileSync(file, JSON.stringify(obj));
                    flag = true;
                    var existInfo = false;
                    if (global.infoArray && global.infoArray.length > 0) {
                        _.find(global.infoArray, function (file) {
                            if (file.cluster === obj.elasticsearch.e_connection.e_server &&
                                file.index === obj.elasticsearch.e_index) {
                                existInfo = true;
                                return;
                            }
                        });
                    }
                    else{
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
                }
            });
        } else {
            var file = path.join(currentFilePath, fileName + '.json');
            fs.writeFileSync(file, JSON.stringify(obj));
            flag = true;
        }
        return flag;
    } catch (error) {
        logger.errMethod(obj.elasticsearch.e_connection.e_server, obj.elasticsearch.e_index, "updateWatcher error: " + error);
    }
};

var deleteWatcher = function (fileName) {
    var flag = false;
    var fileNameTotal = fileName + '.json';
    try {
        var files = fs.readdirSync(currentFilePath);
        if (files && files.length > 0) {
            var newArray = [];
            files.forEach(function (name) {
                if (fileNameTotal === name) {
                    var currentFileContent = require(path.join(currentFilePath, name));
                    fs.unlinkSync(path.join(currentFilePath, name));
                    flag = true;
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
                }
            });
            global.infoArray = newArray;
        }
        return flag;
    } catch (error) {
        logger.errMethod("", "", "deleteWatcher error: " + error);
    }
};

var isExistWatcher = function (fileName) {
    var flag = false;
    var fileNameTotal = fileName + '.json';
    try {
        var files = fs.readdirSync(currentFilePath);
        if (files && files.length > 0) {
            files.forEach(function (name) {
                if (fileNameTotal === name) {
                    flag = true;
                }
            });
        }
        return flag;
    } catch (error) {
        logger.errMethod("", "", "isExistWatcher error: " + error);
    }
};

var getInfoArray = function () {
    if (global.infoArray) {
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

module.exports = {
    start: start,
    modifyCurrentFilePath: modifyCurrentFilePath,
    addWatcher: addWatcher,
    updateWatcher: updateWatcher,
    deleteWatcher: deleteWatcher,
    isExistWatcher: isExistWatcher,
    getInfoArray: getInfoArray,
    startTrace: startTrace,
    stropTrace: stropTrace
};