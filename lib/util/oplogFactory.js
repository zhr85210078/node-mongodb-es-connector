/*
 * @Author: horan 
 * @Date: 2017-07-09 09:49:53 
 * @Last Modified by: horan
 * @Last Modified time: 2018-07-11 18:08:43
 * @Mongo-oplog Method
 */

var Promise = require("bluebird");
var Util = require('./util.js');
var mongoPromise = require('../promise/mongoPromise');
var elasticsearchPromise = require('../promise/elasticsearchPromise');
var logger = require('./logger.js');
var currentIndex = "";

var normalBulk = function (esServer, httpAuth, bulk, index, type, id, opType) {
    return new Promise(function (resolve, reject) {
        elasticsearchPromise.bulkData(esServer, httpAuth, bulk).then(function (result) {
            if (result) {
                logger.logMethod('info', opType + '-oplog index: ' + index + ', type: ' + type + ', Id: ' + id);
                return resolve(true);
            }
        }).catch(function (err) {
            logger.errMethod(esServer, index, opType + '-oplog error index: ' + index + ', type: ' + type + ', Id: ' + id + ", error:" + JSON.stringify(err));
            return reject(err);
        });
    });
};

var pipelineBulk = function (esServer, httpAuth, bulk, index, type, id, pipelineName, opType) {
    return new Promise(function (resolve, reject) {
        elasticsearchPromise.bulkDataAndPip(esServer, httpAuth, bulk, pipelineName).then(function (result) {
            if (result) {
                logger.logMethod('info', opType + '-oplog index: ' + index + ', type: ' + type + ', Id: ' + id);
                return resolve(true);
            }
        }).catch(function (err) {
            logger.errMethod(esServer, index, opType + '-oplog error index: ' + index + ', type: ' + type + ', Id: ' + id + ", error:" + JSON.stringify(err));
            return reject(err);
        });
    });
};

var pipelineAndAttachmentsBulk = function (mongodbUrl, esServer, httpAuth, bulk, index, type, id, pipelineName, opType) {
    return new Promise(function (resolve, reject) {
        mongoPromise.getGridFsArray(mongodbUrl, id).then(function (result) {
            if (result.length > 0) {
                bulk[1].attachments = result;
                return elasticsearchPromise.bulkDataAndPip(esServer, httpAuth, bulk, pipelineName);
            } else {
                return resolve(false);
            }
        }).then(function (result) {
            if (result) {
                logger.logMethod('info', opType + '-oplog index: ' + index + ', type: ' + type + ', Id: ' + id);
                return resolve(true);
            } else {
                logger.logMethod('info', opType + "-oplog not found attachements, mainId is  : " + id);
                return elasticsearchPromise.bulkDataAndPip(esServer, httpAuth, bulk, pipelineName);
            }
        }).catch(function (err) {
            logger.errMethod(esServer, index, opType + '-oplog error index: ' + index + ', type: ' + type + ', Id: ' + id + ", error:" + JSON.stringify(err));
            return reject(err);
        });
    });
};

var deleteDoc = function (esServer, httpAuth, obj, index, type, opType, id) {
    return new Promise(function (resolve, reject) {
        logger.logMethod('info', '\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~Delete Tailing~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
        logger.logMethod('info', 'DELETE: ' + JSON.stringify(obj));
        return elasticsearchPromise.removeDoc(esServer, httpAuth, index, type, id).then(function (result) {
            if (result) {
                logger.logMethod('info', opType + '-oplog index: ' + index + ', type: ' + type + ', Id: ' + id);
                return resolve(true);
            } else {
                return resolve(false);
            }
        }).catch(function (err) {
            logger.errMethod(esServer, index, opType + '-oplog error index: ' + index + ', type: ' + type + ', Id: ' + id + ", error:" + JSON.stringify(err));
            return reject(err);
        });
    });
};

var insertTail = function (id, watcher, opDoc, opType) {
    return new Promise(function (resolve) {
        logger.logMethod('info', opType + ' Master Document');
        if (watcher.Content.elasticsearch.e_pipeline && watcher.Content.elasticsearch.e_iscontainattachment) {
            getInsertMasterDocBulk(id, watcher, opDoc).then(function (result) {
                var mongodbUrl = Util.returnMongodbDataUrl(watcher.Content.mongodb.m_url, watcher.Content.mongodb.m_connection, watcher.Content.mongodb.m_database);
                return pipelineAndAttachmentsBulk(mongodbUrl, watcher.Content.elasticsearch.e_connection.e_server,
                    watcher.Content.elasticsearch.e_connection.e_httpauth, result, watcher.Content.elasticsearch.e_index,
                    watcher.Content.elasticsearch.e_type, id, watcher.Content.elasticsearch.e_pipeline, opType).then(function (result) {
                    if (result) {
                        logger.logMethod('info', opType + ' Attachments');
                        getInsertAttachmentBulk(id, watcher, opDoc).then(function (result) {
                            return pipelineAndAttachmentsBulk(mongodbUrl, watcher.Content.elasticsearch.e_connection.e_server,
                                watcher.Content.elasticsearch.e_connection.e_httpauth, result, watcher.Content.elasticsearch.e_index,
                                watcher.Content.elasticsearch.e_type, id, watcher.Content.elasticsearch.e_pipeline, opType).then(function (result) {
                                return resolve(result);
                            });
                        })
                    }
                });
            });
        } else if (watcher.Content.elasticsearch.e_pipeline && !watcher.Content.elasticsearch.e_iscontainattachment) {
            getInsertMasterDocBulk(id, watcher, opDoc).then(function (result) {
                return pipelineBulk(watcher.Content.elasticsearch.e_connection.e_server,
                    watcher.Content.elasticsearch.e_connection.e_httpauth, result, watcher.Content.elasticsearch.e_index,
                    watcher.Content.elasticsearch.e_type, id, watcher.Content.elasticsearch.e_pipeline, opType).then(function (result) {
                    return resolve(result);
                })
            });
        } else {
            getInsertMasterDocBulk(id, watcher, opDoc).then(function (result) {
                return normalBulk(watcher.Content.elasticsearch.e_connection.e_server,
                    watcher.Content.elasticsearch.e_connection.e_httpauth, result, watcher.Content.elasticsearch.e_index,
                    watcher.Content.elasticsearch.e_type, id, opType).then(function (result) {
                    return resolve(result);
                })
            });
        }
    });
};

var updateTail = function (id, watcher, opDoc, opType) {
    return new Promise(function (resolve) {
        logger.logMethod('info', opType + ' Master Document');
        if (watcher.Content.elasticsearch.e_pipeline && watcher.Content.elasticsearch.e_iscontainattachment) {
            getInsertMasterDocBulk(id, watcher, opDoc).then(function (result) {
                var mongodbUrl = Util.returnMongodbDataUrl(watcher.Content.mongodb.m_url, watcher.Content.mongodb.m_connection, watcher.Content.mongodb.m_database);
                return pipelineAndAttachmentsBulk(mongodbUrl, watcher.Content.elasticsearch.e_connection.e_server,
                    watcher.Content.elasticsearch.e_connection.e_httpauth, result, watcher.Content.elasticsearch.e_index,
                    watcher.Content.elasticsearch.e_type, id, watcher.Content.elasticsearch.e_pipeline, opType).then(function (result) {
                    if (result) {
                        logger.logMethod('info', opType + ' Attachments');
                        getInsertAttachmentBulk(id, watcher, opDoc).then(function (result) {
                            return pipelineAndAttachmentsBulk(mongodbUrl, watcher.Content.elasticsearch.e_connection.e_server,
                                watcher.Content.elasticsearch.e_connection.e_httpauth, result, watcher.Content.elasticsearch.e_index,
                                watcher.Content.elasticsearch.e_type, id, watcher.Content.elasticsearch.e_pipeline, opType).then(function (result) {
                                return resolve(result);
                            });
                        })
                    }
                });
            });
        } else if (watcher.Content.elasticsearch.e_pipeline && !watcher.Content.elasticsearch.e_iscontainattachment) {
            getUpdateMasterDocBulk(id, watcher, opDoc).then(function (result) {
                return pipelineBulk(watcher.Content.elasticsearch.e_connection.e_server,
                    watcher.Content.elasticsearch.e_connection.e_httpauth, result, watcher.Content.elasticsearch.e_index,
                    watcher.Content.elasticsearch.e_type, id, watcher.Content.elasticsearch.e_pipeline, opType).then(function (result) {
                    return resolve(result);
                })
            });
        } else {
            getUpdateMasterDocBulk(id, watcher, opDoc).then(function (result) {
                return normalBulk(watcher.Content.elasticsearch.e_connection.e_server,
                    watcher.Content.elasticsearch.e_connection.e_httpauth, result, watcher.Content.elasticsearch.e_index,
                    watcher.Content.elasticsearch.e_type, id, opType).then(function (result) {
                    return resolve(result);
                })
            });
        }
    });
}

var getInsertMasterDocBulk = function (id, watcher, opDoc) {
    return new Promise(function (resolve, reject) {
        var bulk = [];
        if (watcher.Content.elasticsearch.e_pipeline && watcher.Content.elasticsearch.e_iscontainattachment) {
            opDoc.attachments = [];
        }
        bulk.push({
            index: {
                _index: watcher.Content.elasticsearch.e_index,
                _type: watcher.Content.elasticsearch.e_type,
                _id: id
            }
        }, opDoc);
        return resolve(bulk);
    });
};

var getInsertAttachmentBulk = function (id, watcher, opDoc) {
    return new Promise(function (resolve, reject) {
        var bulk = [];
        mongoPromise.getGridFsArray(Util.returnMongodbDataUrl(watcher.Content.mongodb.m_url, watcher.Content.mongodb.m_connection,
            watcher.Content.mongodb.m_database), id).then(function (result) {
            opDoc.attachments = result;
            bulk.push({
                index: {
                    _index: watcher.Content.elasticsearch.e_index,
                    _type: watcher.Content.elasticsearch.e_type,
                    _id: id
                }
            }, opDoc);
            return resolve(bulk);
        }).catch(function (err) {
            return reject(err);
        });
    });
};

var getUpdateMasterDocBulk = function (id, watcher, opDoc) {
    return new Promise(function (resolve, reject) {
        var bulk = [];
        var item = {};
        item.doc = opDoc
        bulk.push({
            update: {
                _index: watcher.Content.elasticsearch.e_index,
                _type: watcher.Content.elasticsearch.e_type,
                _id: id
            }
        }, item);
        return resolve(bulk);
    });
};

var dataFactory = function (filePath, mServer, database, collectionName, obj, opType, id) {
    return new Promise(function (resolve) {
        var getFileList = Util.readFileList(filePath, []);
        var watchersArr = Util.getWatchers(getFileList, mServer, database, collectionName);
        if (watchersArr.length > 0) {
            Promise.reduce(watchersArr, function (total, watcher, index) {
                currentIndex = watcher.Content.elasticsearch.e_index;
                return new Promise(function (resolve, reject) {
                    if (opType == "delete") {
                        return deleteDoc(watcher.Content.elasticsearch.e_connection.e_server, watcher.Content.elasticsearch.e_connection.e_httpauth,
                            obj, watcher.Content.elasticsearch.e_index, watcher.Content.elasticsearch.e_type, opType, id).then(function (result) {
                            return resolve(result);
                        });
                    } else {
                        var opDoc = {};
                        if (watcher.Content.mongodb.m_returnfilds) {
                            if (obj.$set) {
                                opDoc = Util.returnJsonObject(obj.$set, watcher.Content.mongodb.m_returnfilds);
                            } else {
                                opDoc = Util.returnJsonObject(obj, watcher.Content.mongodb.m_returnfilds);
                            }
                        } else {
                            opDoc = obj;
                        }
                        delete opDoc._id;
                        if (Util.filterJson(watcher.Content.mongodb.m_filterfilds, obj)) {
                            logger.logMethod('info', '\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~' + opType + ' tailing~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
                            if (opType == "insert") {
                                insertTail(id, watcher, opDoc, opType).then(function (result) {
                                    return resolve(result);
                                });
                            } else if (opType == "update") {
                                updateTail(id, watcher, opDoc, opType).then(function (result) {
                                    return resolve(result);
                                });
                            }
                        } else {
                            if (opType == "update") {
                                deleteDoc(watcher.Content.elasticsearch.e_connection.e_server, watcher.Content.elasticsearch.e_connection.e_httpauth,
                                    obj, watcher.Content.elasticsearch.e_index, watcher.Content.elasticsearch.e_type, opType).then(function (result) {
                                    return resolve(result);
                                });
                            }
                        }
                    }
                });
            }, 0).then(function (result) {
                return resolve(result);
            });
        }
    });
};

var oplogInit = function (filePath, currentWatcher, doc, opType) {
    var st = new Date().getTime();
    return new Promise(function (resolve, reject) {
        var id = "";
        if (doc.o._id) {
            id = doc.o._id.toString();
        } else {
            if (doc.o2._id) {
                id = doc.o2._id.toString();
            }
        }
        if (id !== "") {
            var mServer = currentWatcher.mongodb.m_connection.m_servers.toString();
            if (doc.ns) {
                var splitArray = doc.ns.split('.');
                var database = splitArray[0];
                var collectionName = splitArray[splitArray.length - 1];
                return dataFactory(filePath, mServer, database, collectionName, doc.o, opType, id).then(function (result) {
                    return resolve(result);
                });
            }
        }
    }).then(function () {
        if (global.isTrace) {
            var et = new Date().getTime();
            var timer = (et - st) / 1000;
            logger.logMethod('warn', currentIndex + "," + opType + "," + 1 + "," + timer);
        }
    });
};

module.exports = {
    oplogInit: oplogInit
};