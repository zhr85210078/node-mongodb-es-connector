var Promise = require("bluebird");
var Util = require('./util.js');
var mongoPromise = require('../promise/mongoPromise');
var elasticsearchPromise = require('../promise/elasticsearchPromise');
var logger = require('./logger.js');
var path = require("path");
var filePath = path.join(__dirname, '../../crawlerDataConfig');
var getFileList = require('./util.js').readFileList(filePath, []);

var normalBulk = function (esServer, httpAuth, bulk, index, type, id, opType) {
    return new Promise(function (resolve, reject) {
        elasticsearchPromise.bulkData(esServer, httpAuth, bulk).then(function (result) {
            if (result) {
                logger.info('%s document %s to %s/%s (index/type)', opType, id, index, type);
                return resolve(true);
            }
        }).catch(function (err) {
            logger.error('document %s NOT %s to %s/%s (index/type):\n%s', id, opType, index, type, JSON.stringify(err));
            return reject(err);
        });
    });
};

var pipelineBulk = function (mongodbUrl, esServer, httpAuth, bulk, index, type, id, pipelineName, opType) {
    return new Promise(function (resolve, reject) {
        mongoPromise.getGridFsArray(mongodbUrl, id).then(function (result) {
            if (result.length > 0) {
                bulk[1].attachments = result;
                return elasticsearchPromise.bulkDataAndPip(esServer, httpAuth, bulk, pipelineName);
            }
            else {
                return resolve(false);
            }
        }).then(function (result) {
            if (result) {
                logger.info('%s document %s to %s/%s (index/type)', opType, id, index, type);
                return resolve(true);
            }
            else {
                logger.error('not found attachements, documentId is %s', id);
                return resolve(false);
            }
        }).catch(function (err) {
            logger.error('document %s not insert to %s/%s (index/type):\n%s', id, opType, index, type, JSON.stringify(err));
            return reject(err);
        });
    });
};

var deleteDoc = function (esServer, httpAuth, obj, index, type, opType) {
    return new Promise(function (resolve, reject) {
        logger.info('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~Delete Tailing~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
        logger.info('DELETE: %s', JSON.stringify(obj));
        return elasticsearchPromise.removeDoc(esServer, httpAuth, index, type, obj._id.toString()).then(function (result) {
            if (result) {
                logger.info('%s document %s to %s/%s (index/type)', opType, obj._id.toString(), index, type);
                return resolve(true);
            }
            else {
                return resolve(false);
            }
        }).catch(function (result) {
            logger.error('document %s not %s to %s/%s (index/type):\n%s', obj._id.toString(), opType, index, type, JSON.stringify(err));
            return reject(err);
        });
    });
};

var dataFactory = function (mServer, database, collectionName, obj, opType) {
    return new Promise(function (resolve, reject) {
        var watchersArr = Util.getWatchers(getFileList, mServer, database, collectionName);
        if (watchersArr.length > 0) {
            Promise.reduce(watchersArr, function (total, watcher, index) {
                return new Promise(function (resolve, reject) {
                    if (opType == "delete") {
                        return deleteDoc(watcher.Content.elasticsearch.e_connection.e_server, watcher.Content.elasticsearch.e_connection.e_httpauth,
                            obj, watcher.Content.elasticsearch.e_index, watcher.Content.elasticsearch.e_type, opType);
                    }
                    var opDoc = {};
                    if (watcher.Content.mongodb.m_returnfilds) {
                        opDoc = Util.returnJsonObject(obj, watcher.Content.mongodb.m_returnfilds);
                    }
                    else {
                        opDoc = obj;
                    }
                    var id = obj._id.toString();
                    delete opDoc._id;
                    if (Util.filterJson(watcher.Content.mongodb.m_filterfilds, obj)) {
                        logger.info('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~%s tailing~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~', opType);
                        logger.info('%s: %s', opType, JSON.stringify(opDoc));
                        var bulk = [];
                        bulk.push({
                            index: {
                                _index: watcher.Content.elasticsearch.e_index,
                                _type: watcher.Content.elasticsearch.e_type,
                                _id: id
                            }
                        }, opDoc);
                        if (watcher.Content.elasticsearch.e_pipeline) {
                            var mongodbUrl = Util.returnMongodbDataUrl(watcher.Content.mongodb.m_connection, watcher.Content.mongodb.m_database);
                            return pipelineBulk(mongodbUrl, watcher.Content.elasticsearch.e_connection.e_server,
                                watcher.Content.elasticsearch.e_connection.e_httpauth, bulk, watcher.Content.elasticsearch.e_index,
                                watcher.Content.elasticsearch.e_type, id, watcher.Content.elasticsearch.e_pipeline, opType);
                        }
                        else {
                            return normalBulk(watcher.Content.elasticsearch.e_connection.e_server, watcher.Content.elasticsearch.e_connection.e_httpauth,
                                bulk, watcher.Content.elasticsearch.e_index, watcher.Content.elasticsearch.e_type, id, opType);
                        }
                    }
                    else {
                        if (opDoc == "update") {
                            return deleteDoc(watcher.Content.elasticsearch.e_connection.e_server, watcher.Content.elasticsearch.e_connection.e_httpauth,
                                obj, watcher.Content.elasticsearch.e_index, watcher.Content.elasticsearch.e_type, opType);
                        }
                    }
                });
            }, 0);
        }
    });
};

var oplogInit = function (currentWatcher, doc, opType) {
    return new Promise(function (resolve, reject) {
        var mServer = currentWatcher.mongodb.m_connection.m_servers.toString();
        var database = currentWatcher.mongodb.m_database;
        var collectionName = Util.getCollectionName(doc.ns);
        if (collectionName == "files") {
            opType = "update";
            if (doc.o.metadata) {
                var mongoDataUrl = Util.returnMongodbDataUrl(currentWatcher.mongodb.m_connection,
                    currentWatcher.mongodb.m_database);
                return mongoPromise.getOneData(mongoDataUrl, currentWatcher.mongodb.m_collectionname, doc.o.metadata.MainId).then(function (result) {
                    return dataFactory(mServer, database, currentWatcher.mongodb.m_collectionname, result, opType);
                });
            }
        }
        else {
            return dataFactory(mServer, database, collectionName, doc.o, opType);
        }
    });
};

module.exports = {
    oplogInit: oplogInit
};