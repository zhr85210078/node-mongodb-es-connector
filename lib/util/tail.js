var MongoOplog = require('mongo-oplog'),
    Util = require('./util.js'),
    Crud = require('./crud.js'),
    _ = require('underscore'),
    logger = require('./logger.js'),
    chalk = require('chalk');

/**
* tail
* @summary tails mongo database for real-time events emission
*/
var tail = function (Options, EsClient) {
    logger.debug(chalk.bgBlue('Starting to tail oplog now...'));
    try {
        var Oplog = MongoOplog(process.env['MONGO_OPLOG_URL']);
        Oplog.tail();
        logger.debug(chalk.bgHex('#FF34B3').bold('Oplog tailing connection successful.'));

        Oplog.on('insert', function (doc) {
            var watcher = Util.getWatcher(Options.watchedCollections, Util.getCollectionName(doc.ns));
            if (watcher) {
                logger.info('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~Insert Tailing~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
                logger.info('INSERT: %s', JSON.stringify(doc).trunc(200));
                var opDoc = {};
                if (watcher.findFilds) {
                    opDoc = Util.filterJsonObject(doc.o, watcher.findFilds);
                }
                else {
                    opDoc = doc.o;
                }

                opDoc = Util.mergeJsonObject(opDoc, watcher.expandFilds);
                opDoc.id = doc.o._id.toString();
                Crud.insert(watcher, doc.o._id.toString(), opDoc, EsClient);
            } else {
                logger.error('No watcher found.');
            }
        });

        Oplog.on('update', function (doc) {
            var watcher = Util.getWatcher(Options.watchedCollections, Util.getCollectionName(doc.ns));
            if (watcher) {
                logger.info('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~Update Tailing~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
                logger.info('UPDATE: %s', JSON.stringify(doc).trunc(200));
                var opDoc = {};
                if (watcher.findFilds) {
                    opDoc = Util.filterJsonObject(doc.o, watcher.findFilds);
                }
                else {
                    opDoc = doc.o;
                }

                opDoc = Util.mergeJsonObject(opDoc, watcher.expandFilds);
                Crud.update(watcher, doc.o2._id, opDoc, EsClient);
            } else {
                logger.error('No watcher found.');
            }
        });

        Oplog.on('delete', function (doc) {
            var watcher = Util.getWatcher(Options.watchedCollections, Util.getCollectionName(doc.ns));
            if (watcher) {
                logger.info('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~Delete Tailing~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
                logger.info('DELETE: %s', JSON.stringify(doc).trunc(200));
                Crud.remove(watcher, doc.o._id, EsClient);
            } else {
                logger.error('No watcher found.');
            }
        });

        Oplog.on('error', function (error) {
            logger.error('oplog error: %s\nReconnecting...', error);
            reconnect(Options);
        });

        Oplog.on('end', function () {
            logger.warn('Stream ended, reconnecting ...');
            reconnect(Options);
        });

    } catch (error) {
        logger.error('Connection to Oplog failed!\nRetrying...');
        reconnect(Options);
    }
};

/**
* reconnect
* @summary try reconnecting to Mongo Oplog
*/
var reconnect = function (Options) {
    logger.debug(chalk.bgYellow('REconnecting to MongoDB...'));
    _.delay(tail(Options, EsClient), 5000);
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