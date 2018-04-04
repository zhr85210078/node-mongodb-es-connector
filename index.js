var fs = require('fs');
var path = require("path");
var logger = require('./lib/util/logger.js');
var main = require('./lib/main');
var util = require('./lib/util/util');
var currentFilePath = "";

var start = function (filePath) {
    currentFilePath = filePath;
    var getFileList = require('./lib/util/util').readFileList(filePath, []);
    main.init(getFileList, filePath);
};

var addWatcher = function (fileName, obj) {
    var flag = false;
    try {
        var files = fs.readdirSync(currentFilePath);
        files.forEach(function (name) {
            var item = JSON.parse(fs.readFileSync(path.join(currentFilePath, name)));
            if ((fileName + '.json') !== name) {
                if ((item.elasticsearch.e_connection.e_server == obj.elasticsearch.e_connection.e_server &&
                    item.elasticsearch.e_index != obj.elasticsearch.e_index) ||
                    (item.elasticsearch.e_connection.e_server != obj.elasticsearch.e_connection.e_server &&
                        item.elasticsearch.e_index == obj.elasticsearch.e_index)) {
                    var file = path.join(currentFilePath, fileName + '.json');
                    fs.writeFileSync(file, JSON.stringify(obj));
                    flag = true;
                }
            }
        });
        return flag;
    }
    catch (error) {
        logger.error(error);
    }
};

var updateWatcher = function (fileName, obj) {
    var flag = false;
    try {
        var files = fs.readdirSync(currentFilePath);
        files.forEach(function (name) {
            if ((fileName + '.json') === name) {
                var file = path.join(currentFilePath, fileName + '.json');
                fs.writeFileSync(file, JSON.stringify(obj));
                flag = true;
            }
        });
        return flag;
    }
    catch (error) {
        logger.error(error);
    }
};

var deleteWatcher = function (fileName) {
    var flag = false;
    try {
        var files = fs.readdirSync(currentFilePath);
        files.forEach(function (name) {
            if (fileName == name) {
                fs.unlinkSync(path.join(currentFilePath, fileName));
                flag = true;
            }
        });
        return flag;
    }
    catch (error) {
        logger.error(error);
    }
};

var isExistWatcher = function (fileName) {
    var flag = false;
    try {
        var files = fs.readdirSync(currentFilePath);
        files.forEach(function (name) {
            if (fileName == name) {
                flag = true;
            }
        });
        return flag;
    }
    catch (error) {
        logger.error(error);
    }
};

module.exports = {
    start: start,
    addWatcher: addWatcher,
    updateWatcher: updateWatcher,
    deleteWatcher: deleteWatcher,
    isExistWatcher: isExistWatcher
};