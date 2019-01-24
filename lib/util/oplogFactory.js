/*
 * @Author: horan 
 * @Date: 2017-07-09 09:49:53 
 * @Last Modified by: horan
 * @Last Modified time: 2019-01-18 16:05:48
 * @Mongo-oplog Method
 */

var Promise = require("bluebird");
var Util = require('./util.js');
var mongoPromise = require('../promise/mongoPromise');
var elasticsearchPromise = require('../promise/elasticsearchPromise');
var logger = require('./logger.js');
var Queue = require('promise-queue-plus');

var queueAttachment = new Queue(1, {
    "retry": 4,
    "retryIsJump": true,
    "timeout": 600000
});

var normalBulk = function (esServer, httpAuth, bulk, index, type, id, opType) {
    return new Promise(function (resolve, reject) {
        var flag = false;
        elasticsearchPromise.bulkData(esServer, httpAuth, bulk).then(function (result) {
            if (result) {
                logger.logMethod('info', '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~' + opType + ' tailing~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
                logger.logMethod('info', opType + '-oplog Method: normalBulk, index: ' + index + ', type: ' + type + ', Id: ' + id);
                flag = true;
            }
            return resolve(flag);
        }).catch(function (err) {
            logger.errMethod(esServer, index, opType + '-oplog error Method: normalBulk, index: ' + index + ', type: ' + type + ', Id: ' + id + ", error:" + JSON.stringify(err));
            return resolve(flag);
        });
    });
};

var pipelineBulk = function (esServer, httpAuth, bulk, index, type, id, pipelineName, opType) {
    return new Promise(function (resolve, reject) {
        var flag = false;
        elasticsearchPromise.bulkDataAndPip(esServer, httpAuth, bulk, pipelineName).then(function (result) {
            if (result) {
                logger.logMethod('info', '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~' + opType + ' tailing~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
                logger.logMethod('info', opType + '-oplog Method: pipelineBulk, index: ' + index + ', type: ' + type + ', Id: ' + id);
                flag = true;
            }
            return resolve(flag);
        }).catch(function (err) {
            logger.errMethod(esServer, index, opType + '-oplog error Method: pipelineBulk, index: ' + index + ', type: ' + type + ', Id: ' + id + ", error:" + JSON.stringify(err));
            return resolve(flag);
        });
    });
};

var pipelineAndAttachmentsBulk = function (mongodbUrl, esServer, httpAuth, bulk, index, type, id, pipelineName, opType) {
    return new Promise(function (resolve, reject) {
        var flag = false;
        mongoPromise.getGridFsArray(mongodbUrl, id).then(function (result) {
            if (result.length > 0) {
                bulk[1].attachments = result;
                return elasticsearchPromise.bulkDataAndPip(esServer, httpAuth, bulk, pipelineName);
            } else {
                logger.logMethod('info', opType + "-oplog Method: pipelineAndAttachmentsBulk, not found attachements, mainId is  : " + id);
                return resolve(false);
            }
        }).then(function (result) {
            if (result) {
                logger.logMethod('info', opType + '-oplog Method: pipelineAndAttachmentsBulk, index: ' + index + ', type: ' + type + ', Id: ' + id);
                flag = true;
            }
            return resolve(flag);
        }).catch(function (err) {
            logger.errMethod(esServer, index, opType + '-oplog error Method: pipelineAndAttachmentsBulk, not found attachements, index: ' + index + ', type: ' + type + ', Id: ' + id + ", error:" + JSON.stringify(err));
            return resolve(flag);
        });
    });
};

var deleteDoc = function (esServer, httpAuth, obj, index, type, opType, id) {
    return new Promise(function (resolve, reject) {
        var flag = false;
        var st = new Date().getTime();
        logger.logMethod('info', '\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~Delete Tailing~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
        logger.logMethod('info', 'DELETE: ' + JSON.stringify(obj));
        return elasticsearchPromise.removeDoc(esServer, httpAuth, index, type, id).then(function (result) {
            if (global.isTrace) {
                var et = new Date().getTime();
                var timer = (et - st) / 1000;
                logger.logMethod('warn', '(1/1),' + index + "," + opType + "," + 1 + "," + timer);
            }
            if (result) {
                logger.logMethod('info', opType + '-oplog Method: normalBulk, index: ' + index + ', type: ' + type + ', Id: ' + id);
                flag = true;
            }
            return resolve(flag);
        }).catch(function (err) {
            logger.errMethod(esServer, index, opType + '-oplog error Method: normalBulk, index: ' + index + ', type: ' + type + ', Id: ' + id + ", error:" + JSON.stringify(err));
            return resolve(flag);
        });
    });
};

var insertTail = function (id, watcher, opDoc, opType, isSet) {
    return new Promise(function (resolve, reject) {
        var st = new Date().getTime();
        logger.logMethod('info', opType + ' Master Document');
        if (watcher.Content.elasticsearch.e_pipeline && watcher.Content.elasticsearch.e_iscontainattachment) {
            getInsertMasterDocBulk(id, watcher, opDoc).then(function (result) {
                var mongodbUrl = Util.returnMongodbDataUrl(watcher.Content.mongodb.m_url, watcher.Content.mongodb.m_connection, watcher.Content.mongodb.m_database);
                return pipelineBulk(watcher.Content.elasticsearch.e_connection.e_server,
                    watcher.Content.elasticsearch.e_connection.e_httpauth, result, watcher.Content.elasticsearch.e_index,
                    watcher.Content.elasticsearch.e_type, id, watcher.Content.elasticsearch.e_pipeline, opType).then(function (result) {
                    if (result) {
                        if (!isSet) {
                            logger.logMethod('info', opType + ' Attachments');
                            queueAttachment.go(attachementsTail, [id, watcher, opDoc, opType, mongodbUrl]);
                        }
                        if (opDoc.DocumentFile || opDoc.DocumentFile_Ids) {
                            logger.logMethod('info', opType + ' Attachments');
                            mongoPromise.getOneData(mongodbUrl, watcher.Content.mongodb.m_collectionname, id).then(function (result) {
                                if (result) {
                                    var obj = Util.returnJsonObject(result, watcher.Content.mongodb.m_returnfilds);
                                    queueAttachment.go(attachementsTail, [id, watcher, obj, opType, mongodbUrl]);
                                }
                            });
                        }
                    }
                    return resolve(result);
                }).catch(function (err) {
                    return reject(err);
                });
            });
        } else if (watcher.Content.elasticsearch.e_pipeline && !watcher.Content.elasticsearch.e_iscontainattachment) {
            getInsertMasterDocBulk(id, watcher, opDoc).then(function (result) {
                return pipelineBulk(watcher.Content.elasticsearch.e_connection.e_server,
                    watcher.Content.elasticsearch.e_connection.e_httpauth, result, watcher.Content.elasticsearch.e_index,
                    watcher.Content.elasticsearch.e_type, id, watcher.Content.elasticsearch.e_pipeline, opType).then(function (result) {
                    if (global.isTrace) {
                        var et = new Date().getTime();
                        var timer = (et - st) / 1000;
                        logger.logMethod('warn', '(1/1),' + watcher.Content.elasticsearch.e_index + "," + opType + "," + 1 + "," + timer);
                    }
                    return resolve(result);
                }).catch(function (err) {
                    return reject(err);
                });
            });
        } else {
            getInsertMasterDocBulk(id, watcher, opDoc).then(function (result) {
                return normalBulk(watcher.Content.elasticsearch.e_connection.e_server,
                    watcher.Content.elasticsearch.e_connection.e_httpauth, result, watcher.Content.elasticsearch.e_index,
                    watcher.Content.elasticsearch.e_type, id, opType).then(function (result) {
                    if (global.isTrace) {
                        var et = new Date().getTime();
                        var timer = (et - st) / 1000;
                        logger.logMethod('warn', '(1/1),' + watcher.Content.elasticsearch.e_index + "," + opType + "," + 1 + "," + timer);
                    }
                    return resolve(result);
                }).catch(function (err) {
                    return reject(err);
                });
            });
        }
    });
};

var updateTail = function (id, watcher, opDoc, opType, isSet) {
    return new Promise(function (resolve) {
        var st = new Date().getTime();
        logger.logMethod('info', opType + ' Master Document');
        if (watcher.Content.elasticsearch.e_pipeline && watcher.Content.elasticsearch.e_iscontainattachment) {
            getUpdateMasterDocBulk(id, watcher, opDoc).then(function (result) {
                var mongodbUrl = Util.returnMongodbDataUrl(watcher.Content.mongodb.m_url, watcher.Content.mongodb.m_connection, watcher.Content.mongodb.m_database);
                return pipelineBulk(watcher.Content.elasticsearch.e_connection.e_server,
                    watcher.Content.elasticsearch.e_connection.e_httpauth, result, watcher.Content.elasticsearch.e_index,
                    watcher.Content.elasticsearch.e_type, id, watcher.Content.elasticsearch.e_pipeline, opType).then(function (result) {
                    if (result) {
                        if (!isSet) {
                            logger.logMethod('info', opType + ' Attachments');
                            queueAttachment.go(attachementsTail, [id, watcher, opDoc, opType, mongodbUrl]);
                        }
                        if (opDoc.DocumentFile || opDoc.DocumentFile_Ids) {
                            logger.logMethod('info', opType + ' Attachments');
                            mongoPromise.getOneData(mongodbUrl, watcher.Content.mongodb.m_collectionname, id).then(function (result) {
                                if (result) {
                                    var obj = Util.returnJsonObject(result, watcher.Content.mongodb.m_returnfilds);
                                    queueAttachment.go(attachementsTail, [id, watcher, obj, opType, mongodbUrl]);
                                }
                            });
                        }
                    }
                    return resolve(result);
                }).catch(function (err) {
                    return reject(err);
                });
            });
        } else if (watcher.Content.elasticsearch.e_pipeline && !watcher.Content.elasticsearch.e_iscontainattachment) {
            getUpdateMasterDocBulk(id, watcher, opDoc).then(function (result) {
                return pipelineBulk(watcher.Content.elasticsearch.e_connection.e_server,
                    watcher.Content.elasticsearch.e_connection.e_httpauth, result, watcher.Content.elasticsearch.e_index,
                    watcher.Content.elasticsearch.e_type, id, watcher.Content.elasticsearch.e_pipeline, opType).then(function (result) {
                    if (global.isTrace) {
                        var et = new Date().getTime();
                        var timer = (et - st) / 1000;
                        logger.logMethod('warn', '(1/1),' + watcher.Content.elasticsearch.e_index + "," + opType + "," + 1 + "," + timer);
                    }
                    return resolve(result);
                }).catch(function (err) {
                    return reject(err);
                });
            });
        } else {
            getUpdateMasterDocBulk(id, watcher, opDoc).then(function (result) {
                return normalBulk(watcher.Content.elasticsearch.e_connection.e_server,
                    watcher.Content.elasticsearch.e_connection.e_httpauth, result, watcher.Content.elasticsearch.e_index,
                    watcher.Content.elasticsearch.e_type, id, opType).then(function (result) {
                    if (global.isTrace) {
                        var et = new Date().getTime();
                        var timer = (et - st) / 1000;
                        logger.logMethod('warn', '(1/1),' + watcher.Content.elasticsearch.e_index + "," + opType + "," + 1 + "," + timer);
                    }
                    return resolve(result);
                }).catch(function (err) {
                    return reject(err);
                });
            });
        }
    });
};

var attachementsTail = function (id, watcher, opDoc, opType, mongodbUrl) {
    return new Promise(function (resolve, reject) {
        var st = new Date().getTime();
        getAttachmentBulk(id, watcher, opDoc).then(function (result) {
            return pipelineAndAttachmentsBulk(mongodbUrl, watcher.Content.elasticsearch.e_connection.e_server,
                watcher.Content.elasticsearch.e_connection.e_httpauth, result, watcher.Content.elasticsearch.e_index,
                watcher.Content.elasticsearch.e_type, id, watcher.Content.elasticsearch.e_pipeline, opType).then(function (result) {
                if (global.isTrace) {
                    var et = new Date().getTime();
                    var timer = (et - st) / 1000;
                    logger.logMethod('warn', '(1/1),' + watcher.Content.elasticsearch.e_index + "," + opType + "," + 1 + "," + timer);
                }
                mongoPromise.getOneData(mongodbUrl, watcher.Content.mongodb.m_collectionname, id).then(function (result) {
                    if (result) {
                        var obj = Util.returnJsonObject(result, watcher.Content.mongodb.m_returnfilds);
                        return getUpdateMasterDocBulk(id, watcher, obj).then(function (result) {
                            return normalBulk(watcher.Content.elasticsearch.e_connection.e_server,
                                watcher.Content.elasticsearch.e_connection.e_httpauth, result, watcher.Content.elasticsearch.e_index,
                                watcher.Content.elasticsearch.e_type, id, opType);
                        });
                    }
                });
                return resolve(result);
            });
        });
    });
};

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

var getUpdateMasterDocBulk = function (id, watcher, opDoc) {
    return new Promise(function (resolve, reject) {
        var bulk = [];
        var item = {};
        item.doc = opDoc;
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

var getAttachmentBulk = function (id, watcher, opDoc) {
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

var dataFactory = function (filePath, mServer, database, collectionName, obj, ts, opType, id) {
    return new Promise(function (resolve) {
        var getFileList = Util.readFileList(filePath, [], ".json");
        var watchersArr = Util.getWatchers(getFileList, mServer, database, collectionName);
        if (watchersArr.length > 0) {
            Promise.reduce(watchersArr, function (total, watcher, index) {
                return new Promise(function (resolve, reject) {
                    if (Util.filterJson(watcher.Content.mongodb.m_filterfilds, obj)) {
                        if (opType == "delete") {
                            Util.updateTimestampFile(Util.returnTimestampStr(ts), watcher.Filename.split('.')[0], filePath);
                            return deleteDoc(watcher.Content.elasticsearch.e_connection.e_server, watcher.Content.elasticsearch.e_connection.e_httpauth,
                                obj, watcher.Content.elasticsearch.e_index, watcher.Content.elasticsearch.e_type, opType, id).then(function (result) {
                                return resolve(result);
                            });
                        } else {
                            var opDoc = {};
                            var isSet = false;
                            if (watcher.Content.mongodb.m_returnfilds) {
                                if (obj.$set) {
                                    isSet = true;
                                    opDoc = Util.returnJsonObject(obj.$set, watcher.Content.mongodb.m_returnfilds);
                                } else {
                                    opDoc = Util.returnJsonObject(obj, watcher.Content.mongodb.m_returnfilds);
                                }
                            } else {
                                opDoc = obj;
                            }
                            delete opDoc._id;
                            if (opType == "insert") {
                                Util.updateTimestampFile(Util.returnTimestampStr(ts), watcher.Filename.split('.')[0], filePath);
                                insertTail(id, watcher, opDoc, opType, isSet).then(function (result) {
                                    return resolve(result);
                                });
                            } else if (opType == "update") {
                                if (!isSet) {
                                    Util.updateTimestampFile(Util.returnTimestampStr(ts), watcher.Filename.split('.')[0], filePath);
                                }
                                elasticsearchPromise.existDoc(watcher.Content.elasticsearch.e_connection.e_server, watcher.Content.elasticsearch.e_connection.e_httpauth,
                                    watcher.Content.elasticsearch.e_index, watcher.Content.elasticsearch.e_type, id).then(function (result) {
                                    if (result) {
                                        updateTail(id, watcher, opDoc, opType, isSet).then(function (result) {
                                            return resolve(result);
                                        });
                                    } else {
                                        if (isSet) {
                                            updateTail(id, watcher, opDoc, opType, isSet).then(function (result) {
                                                return resolve(result);
                                            });
                                        } else {
                                            opType = "insert";
                                            insertTail(id, watcher, opDoc, opType, isSet).then(function (result) {
                                                return resolve(result);
                                            });
                                        }
                                    }
                                });
                            }
                        }
                    } else {
                        if (opType == "update") {
                            elasticsearchPromise.existDoc(watcher.Content.elasticsearch.e_connection.e_server, watcher.Content.elasticsearch.e_connection.e_httpauth,
                                watcher.Content.elasticsearch.e_index, watcher.Content.elasticsearch.e_type, id).then(function (result) {
                                if (result) {
                                    opType = "delete";
                                    deleteDoc(watcher.Content.elasticsearch.e_connection.e_server, watcher.Content.elasticsearch.e_connection.e_httpauth,
                                        obj, watcher.Content.elasticsearch.e_index, watcher.Content.elasticsearch.e_type, opType, id).then(function (result) {
                                        return resolve(result);
                                    });
                                }
                            });
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
    return new Promise(function (resolve, reject) {
        var id = "";
        if (doc.o && doc.o._id) {
            id = doc.o._id.toString();
        } else {
            if (doc.o2 && doc.o2._id) {
                id = doc.o2._id.toString();
            }
        }
        var mServer = currentWatcher.mongodb.m_connection.m_servers.toString();
        if (id !== "") {
            if (doc.ns) {
                var splitArray = doc.ns.split('.');
                var database = splitArray[0];
                var collectionName = splitArray[splitArray.length - 1];
                return dataFactory(filePath, mServer, database, collectionName, doc.o, doc.ts, opType, id).then(function (result) {
                    return resolve(result);
                });
            }
        } else {
            logger.errMethod(mServer, "", opType + '-oplog error: not find id. Detail: ' + JSON.stringify(doc));
        }
    });
};

module.exports = {
    oplogInit: oplogInit
};