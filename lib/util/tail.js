var Promise = require("bluebird");
var MongoOplog = require('mongo-oplog');
var Util = require('./util.js');
var Crud = require('./crud.js');
var _ = require('underscore');
var logger = require('./logger.js');
var path = require("path");
var filePath = path.join(__dirname, '../../crawlerDataConfig');
var getFileList = require('./util.js').readFileList(filePath, []);

/**
* tail
* @summary tails mongo database for real-time events emission
*/
var tail = function (watcher) {
    logger.debug('Starting to tail oplog now...');
    try {
        var Oplog = MongoOplog(Util.returnMongodbOplogUrl(watcher.mongodb.mongodb_connection));
        Oplog.tail();
        logger.debug('Oplog tailing connection successful.');

        Oplog.on('insert', function (doc) {
            var watchersArr = Util.getWatchers(getFileList, Util.getCollectionName(doc.ns));
            if (watchersArr.length > 0) {
                Promise.reduce(watchersArr, (total, watcher, index) => {
                    return new Promise(function (resolve, reject) {
                        var opDoc = {};
                        if (watcher.Content.mongodb.mongodb_searchReturnFilds) {
                            opDoc = Util.returnJsonObject(doc.o, watcher.Content.mongodb.mongodb_searchReturnFilds);
                        }
                        else {
                            opDoc = doc.o;
                        }
                        opDoc = Util.mergeJsonObject(opDoc, watcher.Content.mongodb.mongodb_defaultValueFilds);
                        logger.info('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~Insert Tailing~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
                        logger.info('INSERT: %s', JSON.stringify(doc));

                        return Crud.insert(watcher.Content.elasticsearch.elasticsearch_index,
                            watcher.Content.elasticsearch.elasticsearch_type, doc.o._id.toString(), opDoc,
                            watcher.Content.elasticsearch.esConnection.elasticsearch_server,
                            watcher.Content.elasticsearch.esConnection.elasticsearch_httpAuth).then(function (result) {
                                if (result) {
                                    return resolve(index);
                                }
                                else {
                                    return resolve(false);
                                }
                            }).catch(function (result) {
                                return resolve(false);
                            });
                    });
                }, 0).then(res => {
                    logger.info('All documents Insert have finished!');
                });
            }
        });

        Oplog.on('update', function (doc) {
            var watchersArr = Util.getWatchers(getFileList, Util.getCollectionName(doc.ns));
            if (watchersArr.length > 0) {
                Promise.reduce(watchersArr, (total, watcher, index) => {
                    return new Promise(function (resolve, reject) {
                        var opDoc = {};
                        if (watcher.Content.mongodb.mongodb_searchReturnFilds) {
                            opDoc = Util.returnJsonObject(doc.o, watcher.Content.mongodb.mongodb_searchReturnFilds);
                        }
                        else {
                            opDoc = doc.o;
                        }
                        opDoc = Util.mergeJsonObject(opDoc, watcher.Content.mongodb.mongodb_defaultValueFilds);
                        if (Util.filterJson(watcher.Content.mongodb.mongodb_filterQueryFilds, doc.o)) {
                            logger.info('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~Update Tailing~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
                            logger.info('UPDATE: %s', JSON.stringify(doc));

                            return Crud.exists(watcher.Content.elasticsearch.elasticsearch_index,
                                doc.o2._id.toString(), watcher.Content.elasticsearch.esConnection.elasticsearch_server,
                                watcher.Content.elasticsearch.esConnection.elasticsearch_httpAuth).then(function (result) {
                                    if (result) {
                                        return Crud.update(watcher.Content.elasticsearch.elasticsearch_index,
                                            watcher.Content.elasticsearch.elasticsearch_type, doc.o2._id.toString(), opDoc,
                                            watcher.Content.elasticsearch.esConnection.elasticsearch_server,
                                            watcher.Content.elasticsearch.esConnection.elasticsearch_httpAuth).then(function (result) {
                                                if (result) {
                                                    return resolve(index);
                                                }
                                                else {
                                                    return resolve(false);
                                                }
                                            }).catch(function (result) {
                                                return resolve(false);
                                            });
                                    }
                                    else {
                                        return Crud.insert(watcher.Content.elasticsearch.elasticsearch_index,
                                            watcher.Content.elasticsearch.elasticsearch_type, doc.o._id.toString(), opDoc,
                                            watcher.Content.elasticsearch.esConnection.elasticsearch_server,
                                            watcher.Content.elasticsearch.esConnection.elasticsearch_httpAuth).then(function (result) {
                                                if (result) {
                                                    return resolve(index);
                                                }
                                                else {
                                                    return resolve(false);
                                                }
                                            }).catch(function (result) {
                                                return resolve(false);
                                            });
                                    }
                                });
                        }
                        else {
                            return Crud.remove(watcher.Content.elasticsearch.elasticsearch_index,
                                watcher.Content.elasticsearch.elasticsearch_type,
                                doc.o._id.toString(), watcher.Content.elasticsearch.esConnection.elasticsearch_server,
                                watcher.Content.elasticsearch.esConnection.elasticsearch_httpAuth).then(function (result) {
                                    if (result) {
                                        return resolve(index);
                                    }
                                    else {
                                        return resolve(false);
                                    }
                                }).catch(function (result) {
                                    return resolve(false);
                                });
                        }
                    });
                }, 0).then(res => {
                    logger.info('All documents Update have finished!');
                });
            }
        });

        Oplog.on('delete', function (doc) {
            var watchersArr = Util.getWatchers(getFileList, Util.getCollectionName(doc.ns));
            if (watchersArr.length > 0) {
                var promiseArr = [];
                Promise.reduce(watchersArr, (total, watcher, index) => {
                    return new Promise(function (resolve, reject) {
                        logger.info('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~Delete Tailing~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
                        logger.info('DELETE: %s', JSON.stringify(doc));

                        return Crud.remove(watcher.Content.elasticsearch.elasticsearch_index,
                            watcher.Content.elasticsearch.elasticsearch_type, doc.o._id.toString(),
                            watcher.Content.elasticsearch.esConnection.elasticsearch_server,
                            watcher.Content.elasticsearch.esConnection.elasticsearch_httpAuth).then(function (result) {
                                if (result) {
                                    return resolve(index);
                                }
                                else {
                                    return resolve(false);
                                }
                            }).catch(function (result) {
                                return resolve(false);
                            });
                    });
                }, 0).then(res => {
                    logger.info('All documents Delete have finished!');
                });
            }
        });

        Oplog.on('error', function (error) {
            logger.error('oplog error: %s\nReconnecting...', error);
            reconnect(watcher);
        });

        Oplog.on('end', function () {
            logger.warn('Stream ended, reconnecting ...');
            reconnect(watcher);
        });

    } catch (error) {
        logger.error('Connection to Oplog failed!\nRetrying...');
        reconnect(watcher);
    }
};

/**
* reconnect
* @summary try reconnecting to Mongo Oplog
*/
var reconnect = function (watcher) {
    logger.debug('REconnecting to MongoDB...');
    _.delay(tail(watcher), 5000);
};

/**
* destroy
* @summary destroy mongoOplog
*/
var destroy = function () {
    Oplog.destroy(function () {
        logger.debug('Disconnected and Destroyed!');
    });
};


/**
* disconnect
* @summary disconnect mongoOplog
*/
var disconnect = function () {
    Oplog.stop(function () {
        logger.debug('Tailing stopped!');
    });
};

module.exports = {
    tail: tail,
    reconnect: reconnect,
    destroy: destroy,
    disconnect: disconnect
};