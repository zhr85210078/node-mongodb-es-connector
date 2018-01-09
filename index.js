var fs = require('fs');
var path = require("path");
var logger = require('./lib/util/logger.js');
var main = require('./lib/main');

var start = function (filePath) {
    var getFileList = require('./lib/util/util').readFileList(filePath, []);
    main.init(getFileList,filePath);
};

var addSingleWatcher = function (filePath, collectionName,filterQueryFilds, searchReturnFilds, defaultValueFilds,oplogUrl,dataUrl,documentsinBatch,index,type,esUrl) {
    var flag = false;
    try {
        var watcher = {};
        watcher.mongodb={};
        watcher.mongodb.mongodb_collectionName=collectionName;
        watcher.mongodb.mongodb_filterQueryFilds=filterQueryFilds;
        watcher.mongodb.mongodb_searchReturnFilds=searchReturnFilds;
        watcher.mongodb.mongodb_defaultValueFilds=defaultValueFilds;
        watcher.mongodb.mongodb_oplog_url=oplogUrl;
        watcher.mongodb.mongodb_data_url=dataUrl;
        watcher.mongodb.mongodb_documentsinBatch=documentsinBatch;
        watcher.elasticsearch={};
        watcher.elasticsearch.elasticsearch_index=index;
        watcher.elasticsearch.elasticsearch_type=type;
        watcher.elasticsearch.elasticsearch_url=esUrl;

        var file = path.join(filePath, collectionName+"_"+index + '.json');
        fs.writeFileSync(file, JSON.stringify(watcher, null, '\t'));
        flag = true;
    }
    catch (error) {
        logger.error(error);
    }
    return flag;
};

var updateSingleWatcher = function (filePath, collectionName,filterQueryFilds, searchReturnFilds, defaultValueFilds,oplogUrl,dataUrl,documentsinBatch,index,type,esUrl) {
    var flag = false;
    try {
        var watcher = {};
        watcher.mongodb={};
        watcher.mongodb.mongodb_collectionName=collectionName;
        watcher.mongodb.mongodb_filterQueryFilds=filterQueryFilds;
        watcher.mongodb.mongodb_searchReturnFilds=searchReturnFilds;
        watcher.mongodb.mongodb_defaultValueFilds=defaultValueFilds;
        watcher.mongodb.mongodb_oplog_url=oplogUrl;
        watcher.mongodb.mongodb_data_url=dataUrl;
        watcher.mongodb.mongodb_documentsinBatch=documentsinBatch;
        watcher.elasticsearch={};
        watcher.elasticsearch.elasticsearch_index=index;
        watcher.elasticsearch.elasticsearch_type=type;
        watcher.elasticsearch.elasticsearch_url=esUrl;

        var file = path.join(filePath, collectionName+"_"+index + '.json');
        fs.writeFileSync(file, JSON.stringify(watcher, null, '\t'));
        flag = true;
    }
    catch (error) {
        logger.error(error);
    }
    return flag;
};

var deleteSingleWatcher = function (filePath, collectionName,index) {
    var flag = false;
    try {
        var files = fs.readdirSync(filePath);
        files.forEach(function (filename) {
            if (filename == collectionName+"_"+index + '.json') {
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

var isExistWatcher = function (filePath, collectionName,index) {
    var flag = false;
    try {
        var files = fs.readdirSync(filePath);
        files.forEach(function (filename) {
            if (filename == collectionName+"_"+index + '.json') {
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
    start: start,
    addSingleWatcher: addSingleWatcher,
    updateSingleWatcher: updateSingleWatcher,
    deleteSingleWatcher: deleteSingleWatcher,
    isExistWatcher: isExistWatcher
};