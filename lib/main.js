var Promise = require('es6-promise').Promise;
var _ = require('underscore');
var chalk = require('chalk');
var logger = require('./util/logger.js');
var mongoPromise = require('./promise/mongoPromise');
var elasticsearchPromise = require('./promise/elasticsearchPromise');
var util = require('./util/util');
var tail = require('./util/tail');
var fsWatcher = require('./util/fsWatcher');
var tailArray = [];

var startProcess = function (mongoUrl, mongodbOplogUrl, collectionName, filterQueryFilds, searchReturnFilds, defaultValueFilds, documentsinBatch, esIndex, esType, esUrl) {
    return new Promise(function (resolve, reject) {
        mongoPromise.getDataCount(mongoUrl, collectionName, filterQueryFilds).then(function (result) {
            return result;
        }).then(function (result) {
            if (result > 0) {
                logger.info('Mongodata counts is ' + chalk.red(result));
                var totalNum = 0;
                var promiseArray = [];
                if (documentsinBatch > 0) {
                    totalNum = Math.ceil(result / documentsinBatch);
                    for (var i = 0; i < totalNum; i++) {
                        promiseArray.push(insertDataToEs(i, mongoUrl, collectionName, filterQueryFilds, searchReturnFilds, defaultValueFilds, documentsinBatch, esIndex, esType, esUrl));
                    }
                }
                else{
                    promiseArray.push(insertDataToEs(0, mongoUrl, collectionName, filterQueryFilds, searchReturnFilds, defaultValueFilds, documentsinBatch, esIndex, esType, esUrl));
                }
                return this.Promise.all(promiseArray);
            }
            else{
                return false;
            }
        }).then(function (result) {
            return resolve(result); 
        }).catch(function (err) {
            return reject(err);
        });
    });
};

var insertDataToEs = function (currentNum, mongoUrl, collectionName, filterQueryFilds, searchReturnFilds, defaultValueFilds, documentsinBatch, esIndex, esType, esUrl) {
    return new Promise(function (resolve, reject) {
        mongoPromise.getPageDataResult(mongoUrl, collectionName, filterQueryFilds, searchReturnFilds,documentsinBatch,currentNum)
            .then(function (results) {
                var mongoResults = [];
                if (results.length > 0) {
                    _.each(results, function (result) {
                        logger.info('Transforming document: %s', JSON.stringify(result));
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
                    return elasticsearchPromise.insertEsData(esUrl, results);
                }
                else{
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

var initialize = function (jsonFileObj) {
    /*mongodb*/
    var mongodbDataUrl = jsonFileObj.mongodb.mongodb_data_url;
    var mongodbOplogUrl = jsonFileObj.mongodb.mongodb_oplog_url;
    var collectionName = jsonFileObj.mongodb.mongodb_collectionName;
    var filterQueryFilds = jsonFileObj.mongodb.mongodb_filterQueryFilds;
    var searchReturnFilds = jsonFileObj.mongodb.mongodb_searchReturnFilds;
    var defaultValueFilds = jsonFileObj.mongodb.mongodb_defaultValueFilds;
    var documentsinBatch = jsonFileObj.mongodb.mongodb_documentsinBatch;
    /*elasticsearch*/
    var esIndex = jsonFileObj.elasticsearch.elasticsearch_index;
    var esType = jsonFileObj.elasticsearch.elasticsearch_type;
    var esUrl = jsonFileObj.elasticsearch.elasticsearch_url;
    return new Promise(function (resolve, reject) {
        startProcess(mongodbDataUrl, mongodbOplogUrl, collectionName, filterQueryFilds, searchReturnFilds, defaultValueFilds, documentsinBatch, esIndex, esType, esUrl).then(function (result) {
            return result;
        }).then(function (result) {
            var flag = false;
            if (result) {
                if (!util.contains(tailArray, jsonFileObj.mongodb.mongodb_oplog_url)) {
                    tailArray.push(jsonFileObj.mongodb.mongodb_oplog_url);
                    tail.tail(jsonFileObj);
                    flag = true;
                }
                logger.info('DataConfig : %s have finished crawl!', collectionName + "_" + esIndex);
            }
            return resolve(flag);
        });
    });
};

var init = function (getFileList, filePath) {
    var promiseArray = [];
    logger.info(chalk.bgCyan('<-----------------------------Starting initialization----------------------------->'));
    _.each(getFileList, function (jsonFileObj) {
        promiseArray.push(initialize(jsonFileObj));
    });

    Promise.all(promiseArray)
        .then(function (results) {
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