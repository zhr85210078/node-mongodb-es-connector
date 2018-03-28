var _ = require('underscore');
var Promise = require("bluebird");
var MongoOplog = require('mongo-oplog');
var Util = require('./util.js');
var oplogFactory = require('./oplogFactory.js');
var logger = require('./logger.js');

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

/**
* tail
* @summary tails mongo database for real-time events emission
*/
var tail = function (watcher) {
    logger.debug('Starting to tail oplog now...');
    try {
        var Oplog = MongoOplog(Util.returnMongodbOplogUrl(watcher.mongodb.m_connection));
        Oplog.currentWatcher = watcher;
        Oplog.tail();
        logger.debug('Oplog tailing connection successful.');

        Oplog.on('insert', function (doc) {
            return oplogFactory.oplogInit(this.currentWatcher,doc,"insert");
        });

        Oplog.on('update', function (doc) {
            return oplogFactory.oplogInit(this.currentWatcher,doc,"update");
        });

        Oplog.on('delete', function (doc) {
            return oplogFactory.oplogInit(this.currentWatcher,doc,"delete");
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

module.exports = {
    tail: tail,
    reconnect: reconnect,
    destroy: destroy,
    disconnect: disconnect
};