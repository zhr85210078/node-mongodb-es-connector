var MongoOplog = require('mongo-oplog');
var Util = require('./util.js');
var Crud = require('./crud.js');
var _ = require('underscore');
var logger = require('./logger.js');
var chalk = require('chalk');
var path = require("path");
var filePath = path.join(__dirname, '../../crawlerDataConfig');
var getFileList = require('./util.js').readFileList(filePath, []);

/**
* tail
* @summary tails mongo database for real-time events emission
*/
var tail = function (watcher) {
    logger.debug(chalk.bgBlue('Starting to tail oplog now...'));
    try {
        var Oplog = MongoOplog(watcher.mongodb.mongodb_oplog_url);
        Oplog.tail();
        logger.debug(chalk.bgHex('#FF34B3').bold('Oplog tailing connection successful.'));

        Oplog.on('insert', function (doc) {
            var watchersArr = Util.getWatchers(getFileList, Util.getCollectionName(doc.ns));
            if (watchersArr.length > 0) {
                var promiseArr = [];
                _.each(watchersArr, function (watcher) {
                    promiseArr.push(new Promise(function (resolve, reject) {
                        logger.info('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~Insert Tailing~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
                        logger.info('INSERT: %s', JSON.stringify(doc));
                        var opDoc = {};
                        if (watcher.mongodb.mongodb_searchReturnFilds) {
                            opDoc = Util.returnJsonObject(doc.o, watcher.mongodb.mongodb_searchReturnFilds);
                        }
                        else {
                            opDoc = doc.o;
                        }
                        opDoc = Util.mergeJsonObject(opDoc, watcher.mongodb.mongodb_defaultValueFilds);
                        //opDoc.id = doc.o._id.toString();
                        return Crud.insert(watcher.elasticsearch.elasticsearch_index, watcher.elasticsearch.elasticsearch_type, doc.o._id.toString(), opDoc, watcher.elasticsearch.elasticsearch_url).then(function (result) {
                            return resolve(result);
                        }).catch(function (err) {
                            return reject(err);
                        });
                    }));
                });
                return Promise.all(promiseArr);
            }
        });

        Oplog.on('update', function (doc) {
            var watchersArr = Util.getWatchers(getFileList, Util.getCollectionName(doc.ns));
            if (watchersArr.length > 0) {
                var promiseArr = [];
                _.each(watchersArr, function (watcher) {
                    promiseArr.push(new Promise(function (resolve, reject) {
                        logger.info('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~Update Tailing~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
                        logger.info('UPDATE: %s', JSON.stringify(doc));
                        var opDoc = {};
                        if (watcher.mongodb.mongodb_searchReturnFilds) {
                            opDoc = Util.returnJsonObject(doc.o, watcher.mongodb.mongodb_searchReturnFilds);
                        }
                        else {
                            opDoc = doc.o;
                        }
                        opDoc = Util.mergeJsonObject(opDoc, watcher.mongodb.mongodb_defaultValueFilds);

                        if (Util.filterJson(watcher.mongodb.mongodb_filterQueryFilds, doc.o)) {
                            return Crud.update(watcher.elasticsearch.elasticsearch_index, watcher.elasticsearch.elasticsearch_type, doc.o2._id.toString(), opDoc, watcher.elasticsearch.elasticsearch_url).then(function (result) {
                                return resolve(result);
                            }).catch(function (err) {
                                return reject(err);
                            });
                        }
                        else {
                            return Crud.remove(watcher.elasticsearch.elasticsearch_index, watcher.elasticsearch.elasticsearch_type, doc.o._id.toString(), watcher.elasticsearch.elasticsearch_url).then(function (result) {
                                return resolve(result);
                            }).catch(function (err) {
                                return reject(err);
                            });
                        }
                    }));
                });
                return Promise.all(promiseArr);
            }
        });

        Oplog.on('delete', function (doc) {
            var watchersArr = Util.getWatchers(getFileList, Util.getCollectionName(doc.ns));
            if (watchersArr.length > 0) {
                var promiseArr = [];
                _.each(watchersArr, function (watcher) {
                    promiseArr.push(new Promise(function (resolve, reject) {
                        logger.info('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~Delete Tailing~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
                        logger.info('DELETE: %s', JSON.stringify(doc));
                        return Crud.remove(watcher.elasticsearch.elasticsearch_index, watcher.elasticsearch.elasticsearch_type, doc.o._id.toString(), watcher.elasticsearch.elasticsearch_url).then(function (result) {
                            return resolve(result);
                        }).catch(function (err) {
                            return reject(err);
                        });
                    }));
                });
                return Promise.all(promiseArr);
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
    logger.debug(chalk.bgYellow('REconnecting to MongoDB...'));
    _.delay(tail(watcher), 5000);
};

/**
* destroy
* @summary destroy mongoOplog
*/
var destroy = function () {
    Oplog.destroy(function () {
        logger.debug(chalk.bgCyan('Disconnected and Destroyed!'));
    });
};


/**
* disconnect
* @summary disconnect mongoOplog
*/
var disconnect = function () {
    Oplog.stop(function () {
        logger.debug(chalk.bgCyan('Tailing stopped!'));
    });
};

module.exports = {
    tail: tail,
    reconnect: reconnect,
    destroy: destroy,
    disconnect: disconnect
};