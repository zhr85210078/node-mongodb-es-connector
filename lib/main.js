/*
 * @Author: horan 
 * @Date: 2017-07-09 10:26:27 
 * @Last Modified by: horan
 * @Last Modified time: 2021-03-25 14:18:00
 * @Init Method
 */

var Promise = require("bluebird");
var _ = require('underscore');
var Queue = require('promise-queue-plus');
var logger = require('./util/logger.js');
var mongoDBPool = require('./pool/mongoDBPool');
var mongoPromise = require('./promise/mongoPromise');
var elasticsearchPromise = require('./promise/elasticsearchPromise');
var util = require('./util/util');
var tail = require('./util/tail');
var tailArray = [];
var attachmentsList = [];

var initQueueAttachment = new Queue(1, {
    "retry": 2,
    "retryIsJump": true,
    "timeout": 600000
});

var getMasterDocArrayAsnyc = function (mongodataCount, currentNum, results, file) {
    return new Promise(function (resolve, reject) {
        var mongoResults = [];
        if (results.length > 0) {
            Promise.reduce(results, function (total, item, index) {
                return new Promise(function (resolve, reject) {
                    var id = item._id.toString();
                    delete item._id;
                    var currentData = (index + 1) + currentNum * file.Content.mongodb.m_documentsinbatch;
                    logger.logMethod('info',
                        file.Content.elasticsearch.e_connection.e_server,
                        file.Content.elasticsearch.e_index,
                        'Transforming master document (' + currentData + '/' + mongodataCount + '), DocId: ' + id);
                    if (file.Content.elasticsearch.e_pipeline && file.Content.elasticsearch.e_iscontainattachment) {
                        item.attachments = [];
                    }
                    var defaultValueFilds = {};
                    if (file.Content.mongodb.m_extendfilds) {
                        defaultValueFilds = file.Content.mongodb.m_extendfilds;
                    }
                    mongoResults.push({
                        index: {
                            _index: file.Content.elasticsearch.e_index,
                            _type: file.Content.elasticsearch.e_type,
                            _id: id
                        }
                    }, util.mergeJsonObject(item, defaultValueFilds));
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

var getAttachmentArrayAsnyc = function (mongodataCount, currentNum, results, file) {
    return new Promise(function (resolve, reject) {
        var mongoResults = [];
        if (results.length > 0) {
            Promise.reduce(results, function (total, item, index) {
                return new Promise(function (resolve, reject) {
                    var id = item._id.toString();
                    delete item._id;
                    var currentData = currentNum + 1;
                    logger.logMethod('info',
                        file.Content.elasticsearch.e_connection.e_server,
                        file.Content.elasticsearch.e_index,
                        'Start read attachment, (' + currentData + '/' + mongodataCount + '), DocId: ' + id);
                    mongoPromise.getGridFsArray(util.returnMongodbDataUrl(file.Content.mongodb.m_url, file.Content.mongodb.m_connection,
                        file.Content.mongodb.m_database), id, file.Content.mongodb.max_attachment_size, currentData, mongodataCount).then(function (result) {
                        if (result.length > 1) {
                            logger.logMethod('info',
                                file.Content.elasticsearch.e_connection.e_server,
                                file.Content.elasticsearch.e_index,
                                'Transforming attachment document (length: ' + result[1].data.length + ') (' + currentData + '/' + mongodataCount + '), DocId: ' + id);
                        } else {
                            logger.logMethod('info',
                                file.Content.elasticsearch.e_connection.e_server,
                                file.Content.elasticsearch.e_index,
                                result[0]);
                            return resolve(mongoResults);
                        }
                        result.shift();
                        item.attachments = result;
                        var defaultValueFilds = {};
                        if (file.Content.mongodb.m_extendfilds) {
                            defaultValueFilds = file.Content.mongodb.m_extendfilds;
                        }
                        mongoResults.push({
                            index: {
                                _index: file.Content.elasticsearch.e_index,
                                _type: file.Content.elasticsearch.e_type,
                                _id: id
                            }
                        }, util.mergeJsonObject(item, defaultValueFilds));
                        return resolve(mongoResults);
                    }).catch(function (err) {
                        logger.logMethod('error',
                            file.Content.elasticsearch.e_connection.e_server,
                            file.Content.elasticsearch.e_index,
                            'Get attachment document error, (' + currentData + '/' + mongodataCount + '), DocId: ' + id);
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

var insertMasterDocDataToEs = function (mongodataCount, currentNum, file) {
    return new Promise(function (resolve, reject) {
        var delayTime = 0;
        var bulkSize = 0;
        if (file.Content.mongodb.m_delaytime) {
            delayTime = file.Content.mongodb.m_delaytime;
        }
        setTimeout(function () {
            var st = new Date().getTime();
            var filterfilds = {};
            if (file.Content.mongodb.m_filterfilds) {
                filterfilds = file.Content.mongodb.m_filterfilds;
            }
            var returnfilds = {};
            if (file.Content.mongodb.m_returnfilds) {
                returnfilds = file.Content.mongodb.m_returnfilds;
            }
            return mongoPromise.getPageDataResult(util.returnMongodbDataUrl(file.Content.mongodb.m_url, file.Content.mongodb.m_connection,
                        file.Content.mongodb.m_database), file.Content.mongodb.m_collectionname, filterfilds, returnfilds,
                    file.Content.mongodb.m_documentsinbatch, currentNum)
                .then(function (results) {
                    return getMasterDocArrayAsnyc(mongodataCount, currentNum, results, file);
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
                        var currentData = (currentNum + 1) * file.Content.mongodb.m_documentsinbatch;
                        if (currentData > mongodataCount) {
                            currentData = mongodataCount
                        }
                        logger.logMethod('warning',
                            file.Content.elasticsearch.e_connection.e_server,
                            file.Content.elasticsearch.e_index,
                            '(' + currentData + '/' + mongodataCount + '),' + 'bulkMasterDoc' + ',' + bulkSize + ',' + timer);
                    }
                    return resolve(flag);
                }).catch(function (err) {
                    return reject(err);
                });
        }, delayTime);
    }).catch(function (err) {
        logger.logMethod('error',
            file.Content.elasticsearch.e_connection.e_server,
            file.Content.elasticsearch.e_index,
            'Insert master doc error: ' + err);
        return false;
    });
}

var insertAttachmentDataToEs = function (mongodataCount, totalNum, currentNum, file, totalSync, indexSync) {
    return new Promise(function (resolve, reject) {
        var st = new Date().getTime();
        var filterfilds = {};
        if (file.Content.mongodb.m_filterfilds) {
            filterfilds = file.Content.mongodb.m_filterfilds;
        }
        var returnfilds = {};
        if (file.Content.mongodb.m_returnfilds) {
            returnfilds = file.Content.mongodb.m_returnfilds;
        }
        return mongoPromise.getPageDataResult(util.returnMongodbDataUrl(file.Content.mongodb.m_url, file.Content.mongodb.m_connection,
                file.Content.mongodb.m_database), file.Content.mongodb.m_collectionname, filterfilds, returnfilds, 1, currentNum)
            .then(function (results) {
                return getAttachmentArrayAsnyc(mongodataCount, currentNum, results, file);
            }).then(function (results) {
                if (results.length > 0) {
                    bulkSize = results.length / 2;
                    return elasticsearchPromise.bulkDataAndPip(file.Content.elasticsearch.e_connection.e_server,
                        file.Content.elasticsearch.e_connection.e_httpauth, results, file.Content.elasticsearch.e_pipeline);
                } else {
                    return false;
                }
            }).then(function (result) {
                if (totalNum === currentNum + 1) {
                    util.updateInfoArray(file.Content.elasticsearch.e_connection.e_server, file.Content.elasticsearch.e_index, '', 'R');
                    logger.logMethod('info',
                        file.Content.elasticsearch.e_connection.e_server,
                        file.Content.elasticsearch.e_index,
                        'DataConfig Attachment : ' + file.Filename + ' have finished crawl!');
                    if (totalSync === indexSync + 1) {
                        logger.logMethod('info',
                            '',
                            '',
                            '<-----------------------------end syncAttachment----------------------------->');
                    }
                }
                var flag = false;
                if (result) {
                    flag = true;
                }
                if (global.isTrace) {
                    var et = new Date().getTime();
                    var timer = (et - st) / 1000;
                    var currentData = currentNum + 1;
                    if (currentData > mongodataCount) {
                        currentData = mongodataCount
                    }
                    logger.logMethod('warning',
                        file.Content.elasticsearch.e_connection.e_server,
                        file.Content.elasticsearch.e_index,
                        '(' + currentData + '/' + mongodataCount + '),' + 'bulkAttachment' + ',' + bulkSize + ',' + timer);
                }
                return resolve(flag);
            }).catch(function (err) {
                return reject(err);
            });
    }).catch(function (err) {
        logger.logMethod('error',
            file.Content.elasticsearch.e_connection.e_server,
            file.Content.elasticsearch.e_index,
            'Insert attachment error: ' + JSON.stringify(err).substring(0, 200));
        return false;
    });
};

var creatTail = function (file, filePath) {
    return new Promise(function (resolve, reject) {
        var filterfilds = {};
        if (file.Content.mongodb.m_extendinit) {
            filterfilds = util.mergeJsonObject(file.Content.mongodb.m_filterfilds, util.extendinit(file.Content.mongodb.m_extendinit, file.Filename));
        } else {
            if (file.Content.mongodb.m_filterfilds) {
                filterfilds = file.Content.mongodb.m_filterfilds;
            }
        }
        return mongoPromise.getDataCount(util.returnMongodbDataUrl(file.Content.mongodb.m_url, file.Content.mongodb.m_connection,
                file.Content.mongodb.m_database), file.Content.mongodb.m_collectionname, filterfilds)
            .then(function (result) {
                if (!util.contains(tailArray, util.returnMongodbOplogUrl(file.Content.mongodb.m_url, file.Content.mongodb.m_connection))) {
                    tailArray.push(util.returnMongodbOplogUrl(file.Content.mongodb.m_url, file.Content.mongodb.m_connection));
                    tail.tail(file.Content, filePath, 0);
                }
                return resolve(result);
            }).catch(function (err) {
                logger.logMethod('error',
                    file.Content.elasticsearch.e_connection.e_server,
                    file.Content.elasticsearch.e_index,
                    err);
                return reject(err);
            });
    });
};

var singleMasterDoc = function (file, filePath) {
    return new Promise(function (resolve, reject) {
        util.updateInfoArray(file.Content.elasticsearch.e_connection.e_server, file.Content.elasticsearch.e_index, '', 'I');
        creatTail(file, filePath).then(function (result) {
            if (result > 0) {
                var mongodataCount = result;
                logger.logMethod('info',
                    file.Content.elasticsearch.e_connection.e_server,
                    file.Content.elasticsearch.e_index,
                    'Mongodata counts is ' + mongodataCount);
                var currentNumArray = [];
                if (file.Content.mongodb.m_documentsinbatch > 0) {
                    var totalNum = Math.ceil(mongodataCount / file.Content.mongodb.m_documentsinbatch);
                    for (var i = 0; i < totalNum; i++) {
                        currentNumArray.push(i);
                    }
                } else {
                    currentNumArray.push(0);
                }

                return Promise.each(currentNumArray, function (currentNum) {
                    if (currentNum === 0) {
                        return elasticsearchPromise.getSettings(file.Content.elasticsearch.e_connection.e_server, file.Content.elasticsearch.e_connection.e_httpauth, file.Content.elasticsearch.e_index).then(function (result) {
                            if (result) {
                                file.Content.elasticsearch.number_of_replicas = result[file.Content.elasticsearch.e_index].settings.index.number_of_replicas;
                                file.Content.elasticsearch.refresh_interval = result[file.Content.elasticsearch.e_index].settings.index.refresh_interval ? result[file.Content.elasticsearch.e_index].settings.index.refresh_interval : "1s";
                                var putSettingsObj = {
                                    "refresh_interval": "-1",
                                    "number_of_replicas": 0
                                };
                                return elasticsearchPromise.putSettings(file.Content.elasticsearch.e_connection.e_server, file.Content.elasticsearch.e_connection.e_httpauth, file.Content.elasticsearch.e_index, putSettingsObj).then(function (result) {
                                    if (result) {
                                        return insertMasterDocDataToEs(mongodataCount, currentNum, file);
                                    }
                                })
                            } else {
                                return insertMasterDocDataToEs(mongodataCount, currentNum, file);
                            }
                        })
                    }
                    return insertMasterDocDataToEs(mongodataCount, currentNum, file);
                }).then(function (result) {
                    if (file.Content.elasticsearch.refresh_interval && file.Content.elasticsearch.number_of_replicas) {
                        var putSettingsObj = {
                            "refresh_interval": file.Content.elasticsearch.refresh_interval,
                            "number_of_replicas": file.Content.elasticsearch.number_of_replicas
                        };
                        return elasticsearchPromise.putSettings(file.Content.elasticsearch.e_connection.e_server, file.Content.elasticsearch.e_connection.e_httpauth, file.Content.elasticsearch.e_index, putSettingsObj).then(function (result) {
                            return resolve(result);
                        })
                    }
                    if (result) {
                        util.updateInfoArray(file.Content.elasticsearch.e_connection.e_server, file.Content.elasticsearch.e_index, '', 'R');
                    }
                    return resolve(false);
                }).catch(function (err) {
                    return reject(err);
                });
            }
            return resolve(false);
        }).then(function (result) {
            if (result) {
                mongoDBPool.clientClose(util.returnMongodbDataUrl(file.Content.mongodb.m_url, file.Content.mongodb.m_connection, file.Content.mongodb.m_database));
            }
            return resolve(result);
        }).catch(function (err) {
            logger.logMethod('error',
                file.Content.elasticsearch.e_connection.e_server,
                file.Content.elasticsearch.e_index,
                'File error: ' + JSON.stringify(err).substring(0, 200));
            return resolve(false);
        });
    });
};

var singleAttachment = function (file, filePath, totalSync, indexSync) {
    return new Promise(function (resolve, reject) {
        var filterfilds = {};
        if (file.Content.mongodb.m_extendinit) {
            filterfilds = util.mergeJsonObject(file.Content.mongodb.m_filterfilds, util.extendinit(file.Content.mongodb.m_extendinit, file.Filename));
        } else {
            if (file.Content.mongodb.m_filterfilds) {
                filterfilds = file.Content.mongodb.m_filterfilds;
            }
        }
        mongoPromise.getDataCount(util.returnMongodbDataUrl(file.Content.mongodb.m_url, file.Content.mongodb.m_connection,
                file.Content.mongodb.m_database), file.Content.mongodb.m_collectionname, filterfilds)
            .then(function (result) {
                if (result > 0) {
                    var mongodataCount = result;
                    var currentNumArray = [];
                    for (var i = 0; i < mongodataCount; i++) {
                        currentNumArray.push(i);
                    }
                    return Promise.each(currentNumArray, function (currentNum) {
                        if (currentNum === 0) {
                            return initQueueAttachment.go(insertAttachmentDataToEs, [mongodataCount, mongodataCount, currentNum, file, totalSync, indexSync]).then(function (result) {
                                return resolve(result);
                            });
                        }
                        return initQueueAttachment.go(insertAttachmentDataToEs, [mongodataCount, mongodataCount, currentNum, file, totalSync, indexSync]).then(function (result) {
                            return resolve(result);
                        });
                    }).then(function (result) {
                        if (result) {
                            util.updateInfoArray(file.Content.elasticsearch.e_connection.e_server, file.Content.elasticsearch.e_index, '', 'R');
                            return resolve(result);
                        }
                    }).catch(function (err) {
                        logger.logMethod('error',
                            file.Content.elasticsearch.e_connection.e_server,
                            file.Content.elasticsearch.e_index,
                            'File error: ' + JSON.stringify(err).substring(0, 200));
                        return reject(err);
                    });
                } else {
                    logger.logMethod('error',
                        file.Content.elasticsearch.e_connection.e_server,
                        file.Content.elasticsearch.e_index,
                        'There is no dataResults in mongodb, FileName is : ' + file.Filename);
                    return resolve(false);
                }
            }).then(function (result) {
                if (result) {
                    mongoDBPool.clientClose(util.returnMongodbDataUrl(file.Content.mongodb.m_url, file.Content.mongodb.m_connection, file.Content.mongodb.m_database));
                }
                return resolve(result);
            }).catch(function (err) {
                logger.logMethod('error',
                    file.Content.elasticsearch.e_connection.e_server,
                    file.Content.elasticsearch.e_index,
                    'File error: ' + JSON.stringify(err).substring(0, 200));
                return resolve(false);
            });
    });
};

var syncMasterDocs = function (getFileList, filePath) {
    logger.logMethod('info',
        '',
        '',
        '<-----------------------------Starting syncMasterDoc----------------------------->');
    return new Promise(function (resolve, reject) {
        Promise.reduce(getFileList, function (total, item, index) {
            return new Promise(function (resolve, reject) {
                var existInfo = false;
                if (global.infoArray && global.infoArray.length > 0) {
                    _.find(global.infoArray, function (file) {
                        if (file.cluster === item.Content.elasticsearch.e_connection.e_server && file.index === item.Content.elasticsearch.e_index) {
                            existInfo = true;
                            return;
                        }
                    });
                } else {
                    global.infoArray = [];
                }

                if (item.Content.elasticsearch.e_iscontainattachment && !existInfo) {
                    attachmentsList.push(item);
                }

                if (!existInfo) {
                    singleMasterDoc(item, filePath).then(function (result) {
                        if (result) {
                            util.updateInfoArray(item.Content.elasticsearch.e_connection.e_server, item.Content.elasticsearch.e_index, '', 'R');
                            logger.logMethod('info',
                                item.Content.elasticsearch.e_connection.e_server,
                                item.Content.elasticsearch.e_index,
                                'DataConfig Master document : ' + item.Filename + ' have finished crawl!');
                            return resolve(result);
                        } else {
                            return resolve(false);
                        }
                    });
                } else {
                    return resolve(true);
                }
            });
        }, 0).then(function (result) {
            logger.logMethod('info',
                '',
                '',
                '<-----------------------------end syncMasterDoc----------------------------->');
            return resolve(result);
        });
    });
};

var syncAttachments = function (filePath) {
    logger.logMethod('info',
        '',
        '',
        '<-----------------------------Starting syncAttachment----------------------------->');
    return new Promise(function (resolve, reject) {
        Promise.reduce(attachmentsList, function (total, item, index) {
            return new Promise(function (resolve, reject) {
                singleAttachment(item, filePath, attachmentsList.length, index).then(function (result) {
                    return resolve(result);
                });
            });
        }, 0).then(function (result) {
            return resolve(result);
        });
    });
}

var singlePipe = function (file, filePath) {
    return new Promise(function (resolve, reject) {
        singleMasterDoc(file, filePath).then(function (result) {
            if (result) {
                logger.logMethod('info',
                    file.Content.elasticsearch.e_connection.e_server,
                    file.Content.elasticsearch.e_index,
                    'DataConfig Master document : ' + file.Filename + ' have finished crawl!');
                if (file.Content.elasticsearch.e_pipeline && file.Content.elasticsearch.e_iscontainattachment) {
                    singleAttachment(file, filePath, 0, 0).then(function (result) {
                        if (result) {
                            return resolve(result);
                        } else {
                            logger.logMethod('error',
                                file.Content.elasticsearch.e_connection.e_server,
                                file.Content.elasticsearch.e_index,
                                'DataConfig Attachment has some problems, FileName is : ' + file.Filename);
                            return resolve(false);
                        }
                    });
                }
            } else {
                logger.logMethod('error',
                    file.Content.elasticsearch.e_connection.e_server,
                    file.Content.elasticsearch.e_index,
                    'DataConfig Master document has some problems, FileName is : ' + file.Filename);
                return resolve(false);
            }
        });
    });
};

var init = function (getFileList, filePath) {
    global.infoArray = [];
    syncMasterDocs(getFileList, filePath).then(function (result) {
        if (attachmentsList.length > 0) {
            return syncAttachments(filePath);
        } else {
            return result;
        }
    }).then(function (result) {
        if (result) {
            logger.logMethod('info',
                '',
                '',
                'All documents transform have finished!');
        } else {}
    });
};

module.exports = {
    init: init,
    singlePipe: singlePipe
};