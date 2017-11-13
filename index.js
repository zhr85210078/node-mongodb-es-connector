var fs = require('fs');
var path = require("path");
var logger = require('./lib/util/logger.js');
var ESMongoSync = require('./lib/main');
var setConfig = function (MONGO_OPLOG_URL, MONGO_DATA_URL, ELASTIC_SEARCH_URL, BATCH_COUNT) {
    process.env.DEBUG = '*';
    process.env.MONGO_OPLOG_URL = MONGO_OPLOG_URL;
    process.env.MONGO_DATA_URL = MONGO_DATA_URL;
    process.env.ELASTIC_SEARCH_URL = ELASTIC_SEARCH_URL;
    process.env.BATCH_COUNT = BATCH_COUNT;
};

var start = function (filePath) {
    var getFileList = require('./lib/util/getFileList').readFileList(filePath, []);
    ESMongoSync.init(getFileList, null, null);
    require('./lib/util/fsWatcher').fsWatcher(filePath, ESMongoSync, require('./lib/util/getFileList'));
};

var addSingleWatcher = function (filePath, collectionName, index, type,filter, findFilds, expandFilds) {
    var flag = false;
    try {
        var watcher = {};
        watcher.collectionName = collectionName;
        watcher.index = index;
        watcher.type = type;
        watcher.transformFunction = null;
        watcher.fetchExistingDocuments = true;
        watcher.priority = 0;
        watcher.filter=filter;
        watcher.findFilds = findFilds;
        watcher.expandFilds = expandFilds;

        var file = path.join(filePath, collectionName + '.json');
        fs.writeFileSync(file, JSON.stringify(watcher, null, '\t'));
        flag = true;
    }
    catch (error) {
        logger.error(error);
    }
    return flag;
};

var updateSingleWatcher = function (filePath, collectionName, index, type,filter, findFilds, expandFilds) {
    var flag = false;
    try {
        var watcher = {};
        watcher.collectionName = collectionName;
        watcher.index = index;
        watcher.type = type;
        watcher.transformFunction = null;
        watcher.fetchExistingDocuments = true;
        watcher.priority = 0;
        watcher.filter=filter;
        watcher.findFilds = findFilds;
        watcher.expandFilds = expandFilds;

        var file = path.join(filePath, collectionName + '.json');
        fs.writeFileSync(file, JSON.stringify(watcher, null, '\t'));
        flag = true;
    }
    catch (error) {
        logger.error(error);
    }
    return flag;
};

var deleteSingleWatcher = function (filePath, collectionName) {
    var flag = false;
    try {
        var files = fs.readdirSync(filePath);
        files.forEach(function (filename) {
            if (filename == collectionName + '.json') {
                fs.unlinkSync(path.join(filePath, filename));
                flag = true;
            }
        });
    }
    catch (error) {
        logger.error(error);
    }
    return flag;
};

var isExistWatcher = function (filePath, collectionName) {
    var flag = false;
    try {
        var files = fs.readdirSync(filePath);
        files.forEach(function (filename) {
            if (filename == collectionName + '.json') {
                flag = true;
            }
        });
    }
    catch (error) {
        logger.error(error);
    }
    return flag;
};

module.exports = {
    setConfig: setConfig,
    start: start,
    addSingleWatcher: addSingleWatcher,
    updateSingleWatcher: updateSingleWatcher,
    deleteSingleWatcher: deleteSingleWatcher,
    isExistWatcher: isExistWatcher
};