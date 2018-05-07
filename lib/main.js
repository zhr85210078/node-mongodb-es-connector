var Promise = require("bluebird");
var _ = require('underscore');
var logger = require('./util/logger.js');
var mongoPromise = require('./promise/mongoPromise');
var elasticsearchPromise = require('./promise/elasticsearchPromise');
var util = require('./util/util');
var tail = require('./util/tail');
var fsWatcher = require('./util/fsWatcher');
var tailArray = [];

var getDataArrayAsnyc = function (results, file) {
    return new Promise(function (resolve, reject) {
        var mongoResults = [];
        if (results.length > 0) {
            Promise.reduce(results, function (total, item) {
                return new Promise(function (resolve, reject) {
                    var id = item._id.toString();
                    delete item._id;
                    if (file.Content.elasticsearch.e_pipeline && file.Content.elasticsearch.e_iscontainattachment) {
                        mongoPromise.getGridFsArray(util.returnMongodbDataUrl(file.Content.mongodb.m_connection,
                            file.Content.mongodb.m_database), id).then(function (result) {
                            logger.info('Transforming document: %s', JSON.stringify(item));
                            item.attachments = result;
                            mongoResults.push({
                                index: {
                                    _index: file.Content.elasticsearch.e_index,
                                    _type: file.Content.elasticsearch.e_type,
                                    _id: id
                                }
                            }, item);
                            return resolve(mongoResults);
                        });
                    } else {
                        logger.info('Transforming document: %s', JSON.stringify(item));
                        mongoResults.push({
                            index: {
                                _index: file.Content.elasticsearch.e_index,
                                _type: file.Content.elasticsearch.e_type,
                                _id: id
                            }
                        }, item);
                        return resolve(mongoResults);
                    }
                });
            }, 0).then(function (res) {
                return resolve(res);
            });
        } else {
            return reject('the data must be more than 1');
        }
    });
};

var insertDataToEs = function (currentNum, file) {
    return new Promise(function (resolve, reject) {
        var delayTime = 0;
        if (file.Content.mongodb.m_delaytime) {
            delayTime = file.Content.mongodb.m_delaytime;
        }
        setTimeout(function () {
            //logger.info('currentNum: %s', currentNum);
            return mongoPromise.getPageDataResult(util.returnMongodbDataUrl(file.Content.mongodb.m_connection,
                        file.Content.mongodb.m_database), file.Content.mongodb.m_collectionname, file.Content.mongodb.m_filterfilds,
                    file.Content.mongodb.m_returnfilds, file.Content.mongodb.m_documentsinbatch, currentNum)
                .then(function (results) {
                    return getDataArrayAsnyc(results, file);
                }).then(function (results) {
                    if (results.length > 0) {
                        if (file.Content.elasticsearch.e_pipeline) {
                            return elasticsearchPromise.bulkDataAndPip(file.Content.elasticsearch.e_connection.e_server,
                                file.Content.elasticsearch.e_connection.e_httpauth, results, file.Content.elasticsearch.e_pipeline);
                        } else {
                            return elasticsearchPromise.bulkData(file.Content.elasticsearch.e_connection.e_server,
                                file.Content.elasticsearch.e_connection.e_httpauth, results);
                        }
                    } else {
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
        }, delayTime);
    });
};

var singlePipe = function (file) {
    return new Promise(function (resolve, reject) {
        elasticsearchPromise.existEsServer(file.Content.elasticsearch.e_connection.e_server,
            file.Content.elasticsearch.e_connection.e_httpauth).then(function (result) {
            if (result) {
                return mongoPromise.getDataCount(util.returnMongodbDataUrl(file.Content.mongodb.m_connection,
                    file.Content.mongodb.m_database), file.Content.mongodb.m_collectionname, file.Content.mongodb.m_filterfilds);
            } else {
                logger.error('Unable to recieve connection: %s', file.Content.elasticsearch.e_connection.e_server);
                return 0;
            }
        }).then(function (result) {
            if (result > 0) {
                logger.info('Mongodata counts is ' + result);
                var currentNumArray = [];
                if (file.Content.mongodb.m_documentsinbatch > 0) {
                    var totalNum = Math.ceil(result / file.Content.mongodb.m_documentsinbatch);
                    for (var i = 0; i < totalNum; i++) {
                        currentNumArray.push(i);
                    }
                } else {
                    currentNumArray.push(0);
                }
                return Promise.each(currentNumArray, function (currentNum) {
                    return insertDataToEs(currentNum, file);
                });
            } else {
                return false;
            }
        }).then(function (result) {
            var flag = false;
            if (result) {
                flag = true;
                if (!util.contains(tailArray, util.returnMongodbOplogUrl(file.Content.mongodb.m_connection))) {
                    tailArray.push(util.returnMongodbOplogUrl(file.Content.mongodb.m_connection));
                    tail.tail(file.Content);
                }
                logger.info('DataConfig : %s have finished crawl!', file.Filename);
            }
            return resolve(flag);
        });
    }).catch(function (err) {
        return reject(err);
    });
};

var init = function (getFileList, filePath) {
    logger.info('<-----------------------------Starting initialization----------------------------->');
    Promise.reduce(getFileList, function (total, item, index) {
        return new Promise(function (resolve, reject) {
            singlePipe(item).then(function (result) {
                if (result) {
                    return resolve(index);
                } else {
                    logger.error("DataConfig is error! FileName is : %s ", item.Filename);
                    return reject("DataConfig is error! FileName is : %s ", item.Filename);
                }
            });
        });
    }, 0).then(function () {
        logger.info('All documents transform have finished!');
        fsWatcher.fsWatcher(filePath);
    });
};

module.exports = {
    init: init,
    singlePipe: singlePipe
};