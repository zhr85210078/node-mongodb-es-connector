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
    logger.logMethod('debug', 'REconnecting to MongoDB...');
    _.delay(tail(watcher), 5000);
};

/**
 * destroy
 * @summary destroy mongoOplog
 */
var destroy = function () {
    Oplog.destroy(function () {
        logger.logMethod('debug', 'Disconnected and Destroyed!');
    });
};


/**
 * disconnect
 * @summary disconnect mongoOplog
 */
var disconnect = function () {
    Oplog.stop(function () {
        logger.logMethod('debug', 'Tailing stopped!');
    });
};

/**
 * tail
 * @summary tails mongo database for real-time events emission
 */
var tail = function (watcher, filePath) {
    logger.logMethod('debug', 'Starting to tail oplog now...');
    try {
        var Oplog = MongoOplog(Util.returnMongodbOplogUrl(watcher.mongodb.m_url, watcher.mongodb.m_connection));
        Oplog.currentWatcher = watcher;
        Oplog.filePath = filePath;
        Oplog.tail();
        logger.logMethod('debug', 'Oplog tailing connection successful.');

        Oplog.on('insert', function (doc) {
            return oplogFactory.oplogInit(this.filePath, this.currentWatcher, doc, "insert");
        });

        Oplog.on('update', function (doc) {
            return oplogFactory.oplogInit(this.filePath, this.currentWatcher, doc, "update");
        });

        Oplog.on('delete', function (doc) {
            return oplogFactory.oplogInit(this.filePath, this.currentWatcher, doc, "delete");
        });

        Oplog.on('error', function (error) {
            logger.errMethod(this.currentWatcher.elasticsearch.e_connection.e_server, this.currentWatcher.elasticsearch.e_index, "oplog errors: " + error + "\nReconnecting...");
            reconnect(watcher);
        });

        Oplog.on('end', function () {
            logger.logMethod('warn', 'Stream ended, reconnecting ...');
            reconnect(watcher);
        });

    } catch (error) {
        logger.errMethod(this.currentWatcher.elasticsearch.e_connection.e_server, this.currentWatcher.elasticsearch.e_index, "Connection to Oplog failed!errors: " + error + "\nRetrying...");
        reconnect(watcher);
    }
};

module.exports = {
    tail: tail,
    reconnect: reconnect,
    destroy: destroy,
    disconnect: disconnect
};