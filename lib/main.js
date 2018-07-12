/*
 * @Author: horan 
 * @Date: 2017-07-09 10:26:27 
 * @Last Modified by: horan
 * @Last Modified time: 2018-07-11 17:43:13
 * @Init Method
 */

var Promise = require("bluebird");
var _ = require('underscore');
var logger = require('./util/logger.js');
var mongoPromise = require('./promise/mongoPromise');
var elasticsearchPromise = require('./promise/elasticsearchPromise');
var util = require('./util/util');
var tail = require('./util/tail');
var fsWatcher = require('./util/fsWatcher');
var tailArray = [];
var attachmentsList = [];

var getMasterDocArrayAsnyc = function (results, file) {
    return new Promise(function (resolve, reject) {
        var mongoResults = [];
        if (results.length > 0) {
            Promise.reduce(results, function (total, item) {
                return new Promise(function (resolve, reject) {
                    var id = item._id.toString();
                    delete item._id;
                    logger.logMethod('info', 'Transforming master document, Id: ' + id);
                    if (file.Content.elasticsearch.e_pipeline && file.Content.elasticsearch.e_iscontainattachment) {
                        item.attachments = [];
                    }
                    mongoResults.push({
                        index: {
                            _index: file.Content.elasticsearch.e_index,
                            _type: file.Content.elasticsearch.e_type,
                            _id: id
                        }
                    }, item);
                    return resolve(mongoResults);

                });
            }, 0).then(function (res) {
                return resolve(res);
            }).catch(function (err) {
                return reject(err);
            });
        } else {
            return resolve(mongoResults);
        }
    });
}

var getAttachmentArrayAsnyc = function (results, file) {
    return new Promise(function (resolve, reject) {
        var mongoResults = [];
        if (results.length > 0) {
            Promise.reduce(results, function (total, item) {
                return new Promise(function (resolve, reject) {
                    var id = item._id.toString();
                    delete item._id;
                    mongoPromise.getGridFsArray(util.returnMongodbDataUrl(file.Content.mongodb.m_url, file.Content.mongodb.m_connection,
                        file.Content.mongodb.m_database), id).then(function (result) {
                        item.attachments = result;
                        logger.logMethod('info', 'Transforming attachment document, mainId: ' + id);
                        mongoResults.push({
                            index: {
                                _index: file.Content.elasticsearch.e_index,
                                _type: file.Content.elasticsearch.e_type,
                                _id: id
                            }
                        }, item);
                        return resolve(mongoResults);
                    }).catch(function (err) {
                        logger.errMethod(file.Content.elasticsearch.e_connection.e_server, file.Content.elasticsearch.e_index,
                            "get Attachment error, mainId: " + id);
                        return reject(err);
                    });
                });
            }, 0).then(function (res) {
                return resolve(res);
            }).catch(function (err) {
                return reject(err);
            });
        } else {
            return resolve(mongoResults);
        }
    });
};

var insertMasterDocDataToEs = function (currentNum, file) {
    return new Promise(function (resolve, reject) {
        var delayTime = 0;
        var bulkSize = 0;
        if (file.Content.mongodb.m_masterdocdelay) {
            delayTime = file.Content.mongodb.m_masterdocdelay;
        }
        setTimeout(function () {
            var st = new Date().getTime();
            return mongoPromise.getPageDataResult(util.returnMongodbDataUrl(file.Content.mongodb.m_url, file.Content.mongodb.m_connection,
                        file.Content.mongodb.m_database), file.Content.mongodb.m_collectionname, file.Content.mongodb.m_filterfilds,
                    file.Content.mongodb.m_returnfilds, file.Content.mongodb.m_masterdocbatch, currentNum)
                .then(function (results) {
                    return getMasterDocArrayAsnyc(results, file);
                }).then(function (results) {
                    if (results.length > 0) {
                        bulkSize = results.length / 2;
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
                    if (global.isTrace) {
                        var et = new Date().getTime();
                        var timer = (et - st) / 1000;
                        logger.logMethod('warn', file.Content.elasticsearch.e_index + "," + "bulkMasterDoc" + "," + bulkSize + "," + timer);
                    }
                    return resolve(flag);
                }).catch(function (err) {
                    return reject(err);
                });
        }, delayTime);
    }).catch(function (err) {
        logger.errMethod(file.Content.elasticsearch.e_connection.e_server, file.Content.elasticsearch.e_index,
            "insert master doc error: " + err);
        return false;
    });
}

var insertAttachmentDataToEs = function (currentNum, file) {
    return new Promise(function (resolve, reject) {
        var delayTime = 0;
        var bulkSize = 0;
        if (file.Content.mongodb.m_attachmentdelay) {
            delayTime = file.Content.mongodb.m_attachmentdelay;
        }
        setTimeout(function () {
            var st = new Date().getTime();
            return mongoPromise.getPageDataResult(util.returnMongodbDataUrl(file.Content.mongodb.m_url, file.Content.mongodb.m_connection,
                        file.Content.mongodb.m_database), file.Content.mongodb.m_collectionname, file.Content.mongodb.m_filterfilds,
                    file.Content.mongodb.m_returnfilds, file.Content.mongodb.m_attachmentbatch, currentNum)
                .then(function (results) {
                    return getAttachmentArrayAsnyc(results, file);
                }).then(function (results) {
                    if (results.length > 0) {
                        bulkSize = results.length / 2;
                        return elasticsearchPromise.bulkDataAndPip(file.Content.elasticsearch.e_connection.e_server,
                            file.Content.elasticsearch.e_connection.e_httpauth, results, file.Content.elasticsearch.e_pipeline);
                    } else {
                        return false;
                    }
                }).then(function (result) {
                    var flag = false;
                    if (result) {
                        flag = true;
                    }
                    if (global.isTrace) {
                        var et = new Date().getTime();
                        var timer = (et - st) / 1000;
                        logger.logMethod('warn', file.Content.elasticsearch.e_index + "," + "bulkAttachment" + "," + bulkSize + "," + timer);
                    }
                    return resolve(flag);
                }).catch(function (err) {
                    return reject(err);
                });
        }, delayTime);
    }).catch(function (err) {
        logger.errMethod(file.Content.elasticsearch.e_connection.e_server, file.Content.elasticsearch.e_index,
            "insert attachment error: " + err);
        return false;
    });
};

var creatTail = function (file, filePath) {
    return new Promise(function (resolve, reject) {
        elasticsearchPromise.existEsServer(file.Content.elasticsearch.e_connection.e_server,
                file.Content.elasticsearch.e_connection.e_httpauth)
            .then(function (result) {
                if (result) {
                    return mongoPromise.getDataCount(util.returnMongodbDataUrl(file.Content.mongodb.m_url, file.Content.mongodb.m_connection,
                        file.Content.mongodb.m_database), file.Content.mongodb.m_collectionname, file.Content.mongodb.m_filterfilds);
                }
            }).then(function (result) {
                if (result > 0) {
                    if (!util.contains(tailArray, util.returnMongodbOplogUrl(file.Content.mongodb.m_url, file.Content.mongodb.m_connection))) {
                        tailArray.push(util.returnMongodbOplogUrl(file.Content.mongodb.m_url, file.Content.mongodb.m_connection));
                        tail.tail(file.Content, filePath);
                    }
                }
                return resolve(result);
            }).catch(function (err) {
                logger.errMethod(file.Content.elasticsearch.e_server, file.Content.elasticsearch.e_index, err);
                return reject(err);
            });
    });
};

var singleMasterDoc = function (file, filePath) {
    return new Promise(function (resolve, reject) {
        util.updateInfoArray(file.Content.elasticsearch.e_connection.e_server, file.Content.elasticsearch.e_index, "", "I");
        creatTail(file, filePath).then(function (result) {
            if (result > 0) {
                logger.logMethod('info', 'Mongodata counts is ' + result);
                var currentNumArray = [];
                if (file.Content.mongodb.m_masterdocbatch > 0) {
                    var totalNum = Math.ceil(result / file.Content.mongodb.m_masterdocbatch);
                    for (var i = 0; i < totalNum; i++) {
                        currentNumArray.push(i);
                    }
                } else {
                    currentNumArray.push(0);
                }
                Promise.each(currentNumArray, function (currentNum) {
                    return insertMasterDocDataToEs(currentNum, file);
                }).then(function (result) {
                    return resolve(result);
                }).catch(function (err) {
                    return reject(err);
                });
            }
        }).catch(function (err) {
            logger.errMethod(file.Content.elasticsearch.e_connection.e_server, file.Content.elasticsearch.e_index,
                "file error: " + JSON.stringify(file));
            return resolve(false);
        });
    });
};

var singleAttachment = function (file, filePath) {
    return new Promise(function (resolve, reject) {
        mongoPromise.getDataCount(util.returnMongodbDataUrl(file.Content.mongodb.m_url, file.Content.mongodb.m_connection,
                file.Content.mongodb.m_database), file.Content.mongodb.m_collectionname, file.Content.mongodb.m_filterfilds)
            .then(function (result) {
                if (result > 0) {
                    var currentNumArray = [];
                    if (file.Content.mongodb.m_attachmentbatch > 0) {
                        var totalNum = Math.ceil(result / file.Content.mongodb.m_attachmentbatch);
                        for (var i = 0; i < totalNum; i++) {
                            currentNumArray.push(i);
                        }
                    } else {
                        currentNumArray.push(0);
                    }
                    Promise.each(currentNumArray, function (currentNum) {
                        return insertAttachmentDataToEs(currentNum, file);
                    }).then(function (result) {
                        return resolve(result);
                    }).catch(function (err) {
                        return reject(err);
                    });
                } else {
                    return resolve(false);
                }
            }).catch(function (err) {
                logger.errMethod(file.Content.elasticsearch.e_connection.e_server, file.Content.elasticsearch.e_index,
                    "file error: " + JSON.stringify(file));
                return resolve(false);
            });
    });
};

var syncMasterDocs = function (getFileList, filePath) {
    logger.logMethod('info', '<-----------------------------Starting syncMasterDoc----------------------------->');
    return new Promise(function (resolve, reject) {
        Promise.reduce(getFileList, function (total, item, index) {
            return new Promise(function (resolve, reject) {
                if (item.Content.elasticsearch.e_iscontainattachment) {
                    attachmentsList.push(item);
                }
                singleMasterDoc(item, filePath).then(function (result) {
                    if (result) {
                        util.updateInfoArray(item.Content.elasticsearch.e_connection.e_server, item.Content.elasticsearch.e_index, "", "R");
                        logger.logMethod('info', 'DataConfig Master document : ' + item.Filename + ' have finished crawl!');
                        return resolve(result);
                    } else {
                        logger.errMethod(item.Content.elasticsearch.e_connection.e_server, item.Content.elasticsearch.e_index,
                            "DataConfig Master document is error! FileName is : " + item.Filename);
                        return resolve("DataConfig Master document is error! FileName is : " + item.Filename);
                    }
                });
            });
        }, 0).then(function (result) {
            logger.logMethod('info', '<-----------------------------end syncMasterDoc----------------------------->');
            return resolve(result);
        });
    });
};

var syncAttachments = function (filePath) {
    logger.logMethod('info', '<-----------------------------Starting syncAttachment----------------------------->');
    return new Promise(function (resolve, reject) {
        Promise.reduce(attachmentsList, function (total, item, index) {
            return new Promise(function (resolve, reject) {
                singleAttachment(item, filePath).then(function (result) {
                    if (result) {
                        util.updateInfoArray(item.Content.elasticsearch.e_connection.e_server, item.Content.elasticsearch.e_index, "", "R");
                        logger.logMethod('info', 'DataConfig Attachment : ' + item.Filename + ' have finished crawl!');
                        return resolve(result);
                    } else {
                        logger.errMethod(item.Content.elasticsearch.e_connection.e_server, item.Content.elasticsearch.e_index,
                            "DataConfig Attachment is error! FileName is : " + item.Filename);
                        return resolve("DataConfig Attachment is error! FileName is : " + item.Filename);
                    }
                });
            });
        }, 0).then(function (result) {
            logger.logMethod('info', '<-----------------------------end syncAttachment----------------------------->');
            return resolve(result);
        });
    });
}

var singlePipe = function (file, filePath) {
    return new Promise(function (resolve, reject) {
        singleMasterDoc(file, filePath).then(function (result) {
            if (result) {
                util.updateInfoArray(file.Content.elasticsearch.e_connection.e_server, file.Content.elasticsearch.e_index, "", "R");
                logger.logMethod('info', 'DataConfig Master document : ' + file.Filename + ' have finished crawl!');
                if (file.Content.elasticsearch.e_pipeline && file.Content.elasticsearch.e_iscontainattachment) {
                    singleAttachment(file, filePath).then(function (result) {
                        if (result) {
                            util.updateInfoArray(file.Content.elasticsearch.e_connection.e_server, file.Content.elasticsearch.e_index, "", "R");
                            logger.logMethod('info', 'DataConfig Attachment : ' + file.Filename + ' have finished crawl!');
                            return resolve(result);
                        } else {
                            logger.errMethod(file.Content.elasticsearch.e_connection.e_server, file.Content.elasticsearch.e_index,
                                "DataConfig Attachment is error! FileName is : " + file.Filename);
                            return resolve("DataConfig Attachment is error! FileName is : " + file.Filename);
                        }
                    });
                }
            } else {
                logger.errMethod(file.Content.elasticsearch.e_connection.e_server, file.Content.elasticsearch.e_index,
                    "DataConfig Master document is error! FileName is : " + file.Filename);
                return resolve("DataConfig Master document is error! FileName is : " + file.Filename);
            }
        });
    });
};

var init = function (getFileList, filePath) {
    syncMasterDocs(getFileList, filePath).then(function (result) {
        if (attachmentsList.length > 0) {
            return syncAttachments(filePath);
        }
        return result;
    }).then(function (result) {
        if (result) {
            logger.logMethod('info', 'All documents transform have finished!');
            fsWatcher.fsWatcher(filePath);
        }
    });
};

module.exports = {
    init: init,
    singlePipe: singlePipe
};