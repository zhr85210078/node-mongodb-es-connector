
/*
 *  Dependencies....
 *
 */
var MongoOplog = require('mongo-oplog'),
  ElasticSearch = require('elasticsearch'),
  MongoDriver = require('mongodb').MongoClient,
  _ = require('underscore'),
  Validation = require('./util/validation'),
  Util = require('./util/util'),
  Crud = require('./util/crud'),
  logger = require('./util/logger.js'),
  chalk = require('chalk');

/*
* add trunc function to String to easily truncate log output
*/
String.prototype.trunc = String.prototype.trunc ||
  function (n) {
    return (this.length > n) ? this.substr(0, n - 1) + '&hellip;' : this;
  };

/*
* private variables used for internal processes only
*/
var Oplog = {};
var EsClient = null;
var DBConnection = {
  db: {},
  connected: false
};
var Options = {
  watchedCollections: [],
  batches: [],
  documentsInBatch: 100
};


/**
* processSingleBatch
* @summary process batch request
* @param {Array} currentBatch - array of documents to index (including meta-data for each document)
* @param {Function} callBack - callBack invoked after indexing operation is complete
* @return {null} return null
*/
var processSingleBatch = function (currentBatch, callBack) {
  var currentDocuments = currentBatch.splice(0, Options.documentsInBatch * 2);
  if (currentDocuments.length > 0) {
    logger.info('Processing %s documents, %s remaining', currentDocuments.length, currentBatch.length);

    var bulk = [];
    var currentCollectionName = '';
    _.each(currentDocuments, function (document) {
      if (document.index) {
        currentCollectionName = document.index._type;
      }
      Util.transform(Util.getWatcherByCollection(Options.watchedCollections, currentCollectionName), document, function (doc) {
        bulk.push(doc);
        if (bulk.length === currentDocuments.length) {
          logger.info('Sending batch with %s docs to Elasticsearch', bulk.length / 2);
          EsClient.bulk({
            body: bulk
          }, function (error, response) {
            if (!error && !response.errors) {
              logger.info('%s documents indexed in batch', bulk.length / 2);
              processSingleBatch(currentBatch, callBack);
            } else {
              logger.error('ERROR: %s', error);
            }
          });
        }
      });
    });
  } else {
    callBack();
  }
};


/**
* processBatches
* @summary process batches
* @param {Number} currentBatchLevel - optional level of watcher to batch process, level defaults to 0 if not provided
* @return {null} return null
*/
var processBatches = function (currentBatchLevel) {
  var batchLevel = currentBatchLevel || 0;
  if (batchLevel === 0) {
    logger.info('%s documents in batch', Options.documentsInBatch);
  }
  var currentBatch = Options.batches[batchLevel];
  if (currentBatch) {
    processSingleBatch(currentBatch, function () {
      processBatches(batchLevel + 1);
    });
  } else {
    logger.info('Batch processing complete!');
    logger.info('\n-----------------------------------Batch End------------------------------------------------');
  }
};


/**
* createBatches
* @summary pull documents from mongoDB and send to elastic search in batches provided by user
* @param {Number} currentPriorityLevel - optional level of watcher to pull data from, level defaults to 0 if not provided
* @return {null} return null
*/
var createBatches = function (currentPriorityLevel) {
  var priorityLevel = currentPriorityLevel || 0;
  if (priorityLevel === 0) {
    logger.info('\n++++++++++++++++++++++++++++++++++++++Batch Start++++++++++++++++++++++++++++++++++++++++++++++');
    logger.info('Beginning batch creation');
  }
  var newWatchers = Util.getWatcherAtLevel(Options.watchedCollections, priorityLevel);
  if (newWatchers.length > 0) {
    logger.info('Processing watchers on priority level %s', priorityLevel);
    var checker = [];
    var mainDocuments = [];
    _.each(newWatchers, function (watcher) {
      logger.info('Processing %s collection', watcher.collectionName);
      var documents = [];
      var collection = DBConnection.db.collection(watcher.collectionName);
      collection.count(function (e, count) {
        if (count > 0) {
          collection.find({}).project(watcher.findFilds).forEach(function (document) {
            var expandFilds=watcher.expandFilds;
            if(expandFilds){
              document=mergeJsonObject(document,expandFilds);
            }
            documents.push(document);
            if (documents.length === count) {
              _.each(documents, function (doc, docIndex) {
                mainDocuments.push({
                  index: {
                    _index: watcher.index,
                    _type: watcher.type,
                    _id: doc._id
                  }
                }, doc);
                if (docIndex === documents.length - 1) {
                  checker.push(watcher.collectionName);
                  if (checker.length === newWatchers.length) {
                    Options.batches.push(mainDocuments);
                    createBatches(priorityLevel + 1);
                  }
                }
              });
            }
          });
        } else {
          checker.push(watcher.collectionName);
          if (checker.length === newWatchers.length) {
            Options.batches.push(mainDocuments);
            createBatches(priorityLevel + 1);
          }
        }
      });
    });
  } else {
    if (Util.getWatchersAtLevelSize(Options.watchedCollections, priorityLevel + 1) === 0) {
      logger.info('Batch creation complete. Processing...');
      processBatches();
    } else {
      createBatches(priorityLevel + 1);
    }
  }
};


/**
* connectDB
* @summary connect to main database
*/
var connectDB = function () {
  logger.debug(chalk.yellow('Connecting to MongoDB now...'));
  MongoDriver.connect(process.env['MONGO_DATA_URL'], function (error, db) {
    if (!error) {
      logger.debug(chalk.bgGreen('Connected to MongoDB successfully.'));
      DBConnection.db = db;
      DBConnection.connected = true;
      createBatches();
    } else {
      logger.error('Could not connect to dabase: %s', error);
      throw new Error('ESMongoSync: Connection to database: ' + process.env['MONGO_DATA_URL'] + ' failed!');
    }
  });
};


/**
* reconnect
* @summary try reconnecting to Mongo Oplog
*/
var reconnect = function () {
  logger.debug(chalk.bgYellow('REconnecting to MongoDB...'));
  _.delay(tail, 5000);
};


/**
* tail
* @summary tails mongo database for real-time events emission
*/
var tail = function () {
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
        var opDoc={};
        if(watcher.findFilds){
          opDoc=filterJsonObject(doc.o,watcher.findFilds);
        }
        else{
          opDoc=doc.o;
        }

        opDoc=mergeJsonObject(opDoc,watcher.expandFilds);
        opDoc.id=doc.o._id.toString();
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
        var opDoc={};
        if(watcher.findFilds){
          opDoc=filterJsonObject(doc.o,watcher.findFilds);
        }
        else{
          opDoc=doc.o;
        }

        opDoc=mergeJsonObject(opDoc,watcher.expandFilds);
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
      reconnect();
    });

    Oplog.on('end', function () {
      logger.warn('Stream ended, reconnecting ...');
      reconnect();
    });

  } catch (error) {
    logger.error('Connection to Oplog failed!\nRetrying...');
    reconnect();
  }
};


/**
* connectElasticSearch
* @summary connect to elastic search if no object is passed from init
*/
var connectElasticSearch = function () {
  if (EsClient === null) {
    EsClient = new ElasticSearch.Client({
      host: process.env['ELASTIC_SEARCH_URL'],
      keepAlive: true
    });
    EsClient.ping({
      requestTimeout: Infinity
    }, function (error) {
      if (error) {
        logger.error('ElasticSearch cluster is down!');
      } else {
        logger.debug(chalk.green('Connected to ElasticSearch successfully!'));
        connectDB();
      }
    });
  } else {
    connectDB();
  }
};


/**
* initialize
* @summary initializing package and setting up major connections
* @param {Function} callBack - callBack invoked after indexing operation is complete
* @return {null} return null
*/
var initialize = function (callBack) {
  callBack = callBack || function () { };
  tail();
  connectElasticSearch();
  callBack();
};


/**
* init
* @summary initializing package and setting up major connections
* @param {Array} watchers - array of watchers specifying Mongo Database collections to watch in real time
* @param {Object} esClient - elasticSearch object to be used in all communications with ElasticSearch cluster
* @param {Function} callBack - callBack invoked after indexing operation is complete
* @return {null} return null
*/
var init = function (watchers, esClient, callback) {
  logger.debug(chalk.bgCyan('Starting initialization...'));

  // validate arguments
  Validation.validateArgs(arguments);

  // validate environment variables
  var unsetEnvs = Validation.systemEnvsSet();
  if (esClient && unsetEnvs.length === 1 && unsetEnvs[0] === 'ELASTIC_SEARCH_URL') {
    unsetEnvs = [];
  }

  if (unsetEnvs.length > 0) {
    throw new Error('ESMongoSync: The following environment variables are not defined: ' + unsetEnvs.join(', ') + '. Set and restart server.');
  }

  // continue package init
  Options.documentsInBatch = Number(process.env['BATCH_COUNT']);
  Options.watchedCollections = watchers;
  EsClient = esClient;
  initialize(callback);
};


/**
* addWatchers
* @summary add watchers dynamically, documents won't be pulled from MongoDB automatically unless reIndex is called explicitly
* @param {Array} watchers - array of watchers specifying Mongo Database collections to watch in real time
* @return {null} return null
*/
var addWatchers = function (watchers) {
  if (_.isArray(watchers)) {
    _.each(watchers, function (watcher) {
      Options.watchedCollections.push(watcher);
    });
  } else {
    logger.error('Argument not an array. Argument must be an array.');
  }
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


/**
* reIndex
* @summary reindex all data from mongoDB to ElasticSearch
*/
var reIndex = function () {
  logger.debug(chalk.bgCyan('REindex...'));
  createBatches();
};

var updateSingleWatcher = function (currentWatcher, watchers) {
  Options.watchedCollections = [];
  Options.watchedCollections.push(currentWatcher);
  reIndex();
  Options.watchedCollections = [];
  addWatchers(watchers);
};

var deleteSingleWatcher = function (watchers) {
  Options.watchedCollections = [];
  addWatchers(watchers);
};

var mergeJsonObject = function (nativeJson, expandJson) {
  var resultJson = {};
  for (var attr in nativeJson) {
    resultJson[attr] = nativeJson[attr];
  }
  for (var attr in expandJson) {
    resultJson[attr] = expandJson[attr];
  }

  return resultJson;
};

var filterJsonObject=function(nativeJson,filterJson){
  var resultJson = {};
  for(var attrNa in nativeJson){
    for(var attrFi in filterJson){
      if(attrNa===attrFi){
        resultJson[attrNa]=nativeJson[attrNa];
      }
    }
  }
  return resultJson;
};

module.exports = {
  init: init,
  destroy: destroy,
  disconnect: disconnect,
  reconnect: reconnect,
  addWatchers: addWatchers,
  reIndex: reIndex,
  updateSingleWatcher: updateSingleWatcher,
  deleteSingleWatcher: deleteSingleWatcher
};
