var Promise = require("bluebird");
var _ = require('underscore');
var logger = require('./util/logger.js');
var mongoPromise = require('./promise/mongoPromise');
var elasticsearchPromise = require('./promise/elasticsearchPromise');
var util = require('./util/util');
var tail = require('./util/tail');
var fsWatcher = require('./util/fsWatcher');
var tailArray = [];

var startProcess = function (mongoUrl, mongodbOplogUrl, collectionName, filterQueryFilds, searchReturnFilds, defaultValueFilds, documentsinBatch, esIndex, esType, esUrl, esHttpAuth) {
    return new Promise(function (resolve, reject) {
        elasticsearchPromise.isExistEsServer(esUrl, esHttpAuth).then(function (result) {
            if (result) {
                return mongoPromise.getDataCount(mongoUrl, collectionName, filterQueryFilds);
            }
            else {
                logger.error('Unable to revive connection: %s', esUrl);
                return 0;
            }
        }).then(function (result) {
            if (result > 0) {
                logger.info('Mongodata counts is ' + result);
                var totalNum = 0;
                var promiseArray = [];
                if (documentsinBatch > 0) {
                    totalNum = Math.ceil(result / documentsinBatch);
                    for (var i = 0; i < totalNum; i++) {
                        promiseArray.push(insertDataToEs(i, mongoUrl, collectionName, filterQueryFilds, searchReturnFilds, defaultValueFilds, documentsinBatch, esIndex, esType, esUrl, esHttpAuth));
                    }
                }
                else {
                    promiseArray.push(insertDataToEs(0, mongoUrl, collectionName, filterQueryFilds, searchReturnFilds, defaultValueFilds, documentsinBatch, esIndex, esType, esUrl, esHttpAuth));
                }
                return Promise.all(promiseArray);
            }
            else {
                return false;
            }
        }).then(function (result) {
            return resolve(result);
        }).catch(function (err) {
            return reject(err);
        });
    });
};

var insertDataToEs = function (currentNum, mongoUrl, collectionName, filterQueryFilds, searchReturnFilds, defaultValueFilds, documentsinBatch, esIndex, esType, esUrl, esHttpAuth) {
    return new Promise(function (resolve, reject) {
        mongoPromise.getPageDataResult(mongoUrl, collectionName, filterQueryFilds, searchReturnFilds, documentsinBatch, currentNum)
            .then(function (results) {
                var mongoResults = [];
                if (results.length > 0) {
                    _.each(results, function (result) {
                        //logger.info('Transforming document: %s', JSON.stringify(result));
                        var id = result._id.toString();
                        delete result._id;
                        mongoResults.push({
                            index: {
                                _index: esIndex,
                                _type: esType,
                                _id: id
                            }
                        }, util.mergeJsonObject(result, defaultValueFilds));
                    });
                }
                return mongoResults;
            }).then(function (results) {
                if (results.length > 0) {
                    return elasticsearchPromise.insertEsData(esUrl, esHttpAuth, results);
                }
                else {
                    return false;
                }
            }).then(function (result) {
                var flag = false;
                if (result) {
                    flag = true;
                }
                return resolve(flag);
            }).catch(function (err) {
                return reject(err);
            });
    });
};

var initialize = function (file) {
    var fileName = file.Filename;
    var jsonFileObj = file.Content;
    /*mongodb*/
    var mongodbDataUrl = util.returnMongodbDataUrl(jsonFileObj.mongodb.mongodb_connection, jsonFileObj.mongodb.mongodb_dataBase);
    var mongodbOplogUrl = util.returnMongodbOplogUrl(jsonFileObj.mongodb.mongodb_connection);
    var collectionName = jsonFileObj.mongodb.mongodb_collectionName;
    var filterQueryFilds = {};
    var searchReturnFilds = {};
    var defaultValueFilds = {};
    var documentsinBatch = 1000;
    if (jsonFileObj.mongodb.mongodb_filterQueryFilds) {
        filterQueryFilds = jsonFileObj.mongodb.mongodb_filterQueryFilds;
    }
    if (jsonFileObj.mongodb.mongodb_searchReturnFilds) {
        searchReturnFilds = jsonFileObj.mongodb.mongodb_searchReturnFilds;
    }
    if (jsonFileObj.mongodb.mongodb_defaultValueFilds) {
        defaultValueFilds = jsonFileObj.mongodb.mongodb_defaultValueFilds;
    }
    if (util.isInteger(jsonFileObj.mongodb.mongodb_documentsinBatch)) {
        documentsinBatch = jsonFileObj.mongodb.mongodb_documentsinBatch;
    }
    /*elasticsearch*/
    var esIndex = jsonFileObj.elasticsearch.elasticsearch_index;
    var esType = jsonFileObj.elasticsearch.elasticsearch_type;
    var esUrl = jsonFileObj.elasticsearch.esConnection.elasticsearch_server;
    var esHttpAuth = jsonFileObj.elasticsearch.esConnection.elasticsearch_httpAuth;
    return new Promise(function (resolve, reject) {
        if (mongodbDataUrl && mongodbOplogUrl && collectionName && esIndex && esType && esUrl) {
            startProcess(mongodbDataUrl, mongodbOplogUrl, collectionName, filterQueryFilds, searchReturnFilds, defaultValueFilds, documentsinBatch, esIndex, esType, esUrl, esHttpAuth).then(function (result) {
                return result;
            }).then(function (result) {
                var flag = false;
                if (result) {
                    flag = true;
                    if (!util.contains(tailArray, mongodbOplogUrl)) {
                        tailArray.push(mongodbOplogUrl);
                        tail.tail(jsonFileObj);
                    }
                    logger.info('DataConfig : %s have finished crawl!', fileName);
                }
                return resolve(flag);
            });
        }
        else {
            logger.error("DataConfig is error! FileName is : %s ", fileName);
            return resolve(false);
        }
    });
};

var init = function (getFileList, filePath) {
    var promiseArray = [];
    logger.info('<-----------------------------Starting initialization----------------------------->');
    Promise.reduce(getFileList, (total, item, index) => {
        return new Promise(function (resolve, reject) {
            initialize(item).then(function (result) {
                if (result) {
                    return resolve(index);
                }
                else {
                    logger.error("DataConfig is error! FileName is : %s ", jsonFileObj.Filename);
                    return resolve(false);
                }
            });
        });
    }, 0).then(res => {
        logger.info('All documents transform have finished!');
        fsWatcher.fsWatcher(filePath);
    });
};

var addSingleDataConfig = function (jsonFileObj) {
    initialize(jsonFileObj);
};

var updateSingleDataConfig = function (jsonFileObj) {
    initialize(jsonFileObj);
};


module.exports = {
    init: init,
    initialize: initialize,
    startProcess: startProcess,
    updateSingleDataConfig: updateSingleDataConfig
};