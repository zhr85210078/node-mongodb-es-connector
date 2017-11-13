
/*
 *  Dependencies....
 *
 */
var ElasticSearch = require('elasticsearch'),
  MongoDriver = require('mongodb').MongoClient,
  _ = require('underscore'),
  Validation = require('./util/validation'),
  Util = require('./util/util'),
  tail = require('./util/tail'),
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


        // //-------------------------------------------------
        // logger.debug(chalk.red('doc: %s'),doc.index);
        // //-------------------------------------------------


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
          var searchResults;
          if(watcher.findFilds!=null){
            searchResults=collection.find({}).project(watcher.findFilds);     
          }
          else{
            searchResults=collection.find({}).project({});
          }
          searchResults.forEach(function (document) {
            if(watcher.filter!=null){
              document=Util.filterJsonObject(document,watcher.filter);
            }
            if(watcher.expandFilds!=null){
              document=Util.mergeJsonObject(document,watcher.expandFilds);
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
  if(!EsClient){
    connectElasticSearch();
  }
  tail.tail(Options,EsClient);
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


// /**
// * addWatchers
// * @summary add watchers dynamically, documents won't be pulled from MongoDB automatically unless reIndex is called explicitly
// * @param {Array} watchers - array of watchers specifying Mongo Database collections to watch in real time
// * @return {null} return null
// */
// var addWatchers = function (watchers) {
//   if (_.isArray(watchers)) {
//     _.each(watchers, function (watcher) {
//       Options.watchedCollections.push(watcher);
//     });
//   } else {
//     logger.error('Argument not an array. Argument must be an array.');
//   }
// };

/**
* reIndex
* @summary reindex all data from mongoDB to ElasticSearch
*/
var reIndex = function () {
  logger.debug(chalk.bgCyan('REindex...'));
  createBatches();
};

var addSingleWatcher=function(currentWatcher,watchers){
  Options.watchedCollections = [];
  Options.watchedCollections.push(currentWatcher);
  reIndex();
  Options.watchedCollections = watchers;
};

var updateSingleWatcher = function (currentWatcher, watchers) {
  Options.watchedCollections = [];
  Options.watchedCollections.push(currentWatcher);
  reIndex();
  Options.watchedCollections = watchers;
};

var deleteSingleWatcher = function (watchers) {
  Options.watchedCollections = watchers;
};

module.exports = {
  init: init,
  reIndex: reIndex,
  addSingleWatcher: addSingleWatcher,
  updateSingleWatcher: updateSingleWatcher,
  deleteSingleWatcher: deleteSingleWatcher
};
