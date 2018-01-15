var fs = require('fs');
var path = require("path");
var logger = require('./lib/util/logger.js');
var main = require('./lib/main');
var util = require('./lib/util/util');

var start = function (filePath) {
    var getFileList = require('./lib/util/util').readFileList(filePath, []);
    main.init(getFileList, filePath);
};

var addSingleWatcher = function (filePath, mongodbDataBase, collectionName, filterQueryFilds, searchReturnFilds,
    defaultValueFilds, mongodbConection, documentsinBatch, index, type, esConnection) {
    var flag = false;
    try {
        var watcher = {};
        watcher.mongodb = {};
        watcher.mongodb.mongodb_dataBase = mongodbDataBase;
        watcher.mongodb.mongodb_collectionName = collectionName;
        watcher.mongodb.mongodb_filterQueryFilds = filterQueryFilds;
        watcher.mongodb.mongodb_searchReturnFilds = searchReturnFilds;
        watcher.mongodb.mongodb_defaultValueFilds = defaultValueFilds;
        watcher.mongodb.mongodb_connection = mongodbConection;
        watcher.mongodb.mongodb_documentsinBatch = documentsinBatch;
        watcher.elasticsearch = {};
        watcher.elasticsearch.elasticsearch_index = index;
        watcher.elasticsearch.elasticsearch_type = type;
        watcher.elasticsearch.esConnection = esConnection;

        var mongdbServerFolder = util.arrayto_String(mongodbConection.mongodb_servers);
        var esServerFolder = esConnection.elasticsearch_server.replace("http://", "").replace(":", "_");

        var fileFolder = path.join(filePath, mongdbServerFolder, esServerFolder);
        util.mkdir(fileFolder);
        var file = path.join(filePath, mongdbServerFolder, esServerFolder, mongodbDataBase + "_" + collectionName + "_" + index + '.json');
        fs.writeFileSync(file, JSON.stringify(watcher, null, '\t'));
        flag = true;
    }
    catch (error) {
        logger.error(error);
    }
    return flag;
};

var updateSingleWatcher = function (filePath, mongodbDataBase, collectionName, filterQueryFilds, searchReturnFilds,
    defaultValueFilds, mongodbConection, documentsinBatch, index, type, esConnection) {
    var flag = false;
    try {
        var watcher = {};
        watcher.mongodb = {};
        watcher.mongodb.mongodb_dataBase = mongodbDataBase;
        watcher.mongodb.mongodb_collectionName = collectionName;
        watcher.mongodb.mongodb_filterQueryFilds = filterQueryFilds;
        watcher.mongodb.mongodb_searchReturnFilds = searchReturnFilds;
        watcher.mongodb.mongodb_defaultValueFilds = defaultValueFilds;
        watcher.mongodb.mongodb_connection = mongodbConection;
        watcher.mongodb.mongodb_documentsinBatch = documentsinBatch;
        watcher.elasticsearch = {};
        watcher.elasticsearch.elasticsearch_index = index;
        watcher.elasticsearch.elasticsearch_type = type;
        watcher.elasticsearch.esConnection = esConnection;

        var mongdbServerFolder = util.arrayto_String(mongodbConection.mongodb_servers);
        var esServerFolder = esConnection.elasticsearch_server.replace("http://", "").replace(":", "_");

        var fileFolder = path.join(filePath, mongdbServerFolder, esServerFolder);
        util.mkdir(fileFolder);
        var file = path.join(filePath, mongdbServerFolder, esServerFolder, mongodbDataBase + "_" + collectionName + "_" + index + '.json');
        fs.writeFileSync(file, JSON.stringify(watcher, null, '\t'));
        flag = true;
    }
    catch (error) {
        logger.error(error);
    }
    return flag;
};

var deleteSingleWatcher = function (filePath, mongodbDataBase, collectionName, mongodbConection, index, esConnection) {
    var flag = false;
    try {
        var mongdbServerFolder = util.arrayto_String(mongodbConection.mongodb_servers);
        var esServerFolder = esConnection.elasticsearch_server.replace("http://", "").replace(":", "_");
        var fileFolder = path.join(filePath, mongdbServerFolder, esServerFolder);

        var files = fs.readdirSync(fileFolder);
        files.forEach(function (filename) {
            if (filename == mongodbDataBase + "_" + collectionName + "_" + index + '.json') {
                fs.unlinkSync(path.join(fileFolder, filename));
                flag = true;
            }
        });
    }
    catch (error) {
        logger.error(error);
    }
    return flag;
};

var isExistWatcher = function (filePath, mongodbDataBase, collectionName, mongodbConection, index, esConnection) {
    var flag = false;
    try {
        var mongdbServerFolder = util.arrayto_String(mongodbConection.mongodb_servers);
        var esServerFolder = esConnection.elasticsearch_server.replace("http://", "").replace(":", "_");
        var fileFolder = path.join(filePath, mongdbServerFolder, esServerFolder);

        var files = fs.readdirSync(fileFolder);
        files.forEach(function (filename) {
            if (filename == mongodbDataBase + "_" + collectionName + "_" + index + '.json') {
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