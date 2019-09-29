/*
 * @Author: horan 
 * @Date: 2017-07-09 10:22:28 
 * @Last Modified by: horan
 * @Last Modified time: 2019-09-26 15:13:50
 * @Mongo-oplog Method
 */

var _ = require('underscore');
var cron = require('node-cron');
var MongoOplog = require('mongo-oplog');
var Util = require('./util.js');
var oplogFactory = require('./oplogFactory.js');
var logger = require('./logger.js');
var maxReconnect = 5;

/**
 * reconnect
 * @summary try reconnecting to Mongo Oplog
 */
var reconnect = function (watcher, filePath, currentReconnect) {
    currentReconnect++;
    logger.logMethod('debug',
        watcher.elasticsearch.e_connection.e_server,
        watcher.elasticsearch.e_index,
        'REconnecting ' + currentReconnect + '/times to MongoDB...');
    tail(watcher, filePath, currentReconnect);
};

/**
 * disconnect
 * @summary disconnect mongoOplog
 */
var disconnect = function (watcher, filePath, Oplog) {
    var getFileList = Util.readFileList(filePath, [], ".json");
    _.find(getFileList, function (item) {
        logger.logMethod('error',
            watcher.elasticsearch.e_connection.e_server,
            watcher.elasticsearch.e_connection.e_index,
            "mongoOplog error: file is " + JSON.stringify(item.Content));
        logger.logMethod('debug',
            watcher.elasticsearch.e_connection.e_server,
            watcher.elasticsearch.e_index,
            ' tailing stopped!');
    });

    Oplog.destroy();

    var task = cron.schedule('0 59 * * * *', () => {
        tail(watcher, filePath, 0);
    });
    task.destroy();
};

/**
 * tail
 * @summary tails mongo database for real-time events emission
 */
var tail = function (watcher, filePath, currentReconnect) {
    logger.logMethod('debug',
        watcher.elasticsearch.e_connection.e_server,
        watcher.elasticsearch.e_index,
        'Start to tail oplog now...');

    var Oplog = MongoOplog(Util.returnMongodbOplogUrl(watcher.mongodb.m_url, watcher.mongodb.m_connection));
    Oplog.currentWatcher = watcher;
    Oplog.filePath = filePath;
    Oplog.tail();

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
        logger.logMethod('debug',
            watcher.elasticsearch.e_connection.e_server,
            watcher.elasticsearch.e_index,
            'oplog errors: ' + error + ' Reconnecting...');
        if (watcher && Object.keys(watcher).length > 0 && currentReconnect < maxReconnect) {
            reconnect(watcher, filePath, currentReconnect);
        } else {
            disconnect(watcher, filePath, Oplog);
        }
    });

    Oplog.on('end', function () {
        logger.logMethod('info',
            watcher.elasticsearch.e_connection.e_server,
            watcher.elasticsearch.e_index,
            'Stream ended');
    });
};

module.exports = {
    tail: tail,
    reconnect: reconnect,
    disconnect: disconnect
};