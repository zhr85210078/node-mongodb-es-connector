var _ = require('underscore'),
logger = require('./logger.js'),
chalk = require('chalk');

// helper variables
var serverEnv = process.env;
var watcherKeys = ['collectionName', 'index', 'type', 'transformFunction', 'fetchExistingDocuments', 'priority'];
var systemEnvs = ['MONGO_OPLOG_URL', 'MONGO_DATA_URL', 'ELASTIC_SEARCH_URL', 'BATCH_COUNT'];

/**
 * watcherValid
 * @summary validate single watcher for correct structure and content
 * @param {Object} watcher - single watcher object for collection to be kept in sync
 * @param {int} position - position of watcher in watcher array
 * @return {Boolean} return true if no Error is thrown, false if otherwise
 */
var watcherValid = function (watcher, position) {
  logger.debug(chalk.blue('Validating watch #%s: %s'), position, watcher);

  // flag to return after validation check
  var status = true;

  if (typeof watcher !== 'object') {
    // watcher must be an object
    throw new Error('ESMongoSync: Watcher in position ' + position + ' must be an object');
  }

  for (var x in watcherKeys) {
    var key = watcherKeys[x];
    if (watcher.hasOwnProperty(key)) {
      switch (key) {
        case 'transformFunction':
          status = typeof watcher[key] === 'function' || watcher[key] === null;
          break;
        case 'fetchExistingDocuments':
          status = typeof watcher[key] === 'boolean';
          break;
        case 'priority':
          status = typeof watcher[key] === 'number';
          break;
        default:
          status = typeof watcher[key] === 'string';
          break;
      }
      if (!status) {
        break;
      }
    }
  }

  if (!status) {
    throw new Error('ESMongoSync: Watcher in position ' + position + ' is malformed.');
  }

  return status;
};


module.exports = {

  /**
   * validateArgs
   * @summary validate arguments passed into package init
   * @param {Array} args - array of watchers specifying Mongo Database collections to watch in real time && elasticSearch object
   */
  validateArgs: function (args) {
    logger.debug(chalk.blue('Validating init arguments: %s'), JSON.stringify(args));

    if (args.length !== 3) {
      /*
      * throw error as module can't be initialized successfully,
      * this will always lead to incorrect results...
      * */
      throw new Error('ESMongoSync: Incorrect argument count in init function');
    } else {
      // validate watchers
      var watchers = args[0];
      if (!_.isArray(watchers)) {
        // first argument should be an array of watchers
        throw new Error('ESMongoSync: First argument not an array.');
      } else {
        var currentPosition = 0;
        var check = function (currentWatcher, position) {
          if (currentWatcher) {
            if (watcherValid(currentWatcher, position)) {
              currentPosition++;
              var newWatcher = watchers[currentPosition];
              check(newWatcher, currentPosition);
            }
          }
        };
        check(watchers[currentPosition], currentPosition);
      }

      // validate esClient object
      var esClient = args[1];
      if (typeof esClient !== 'object') {
        // esClient must be an object
        throw new Error('ESMongoSync: ElasticSearch Client object passed must be an ES object or null');
      }
      // validate callback
      var cb = args[2];
      if (cb !== null && typeof (cb) !== 'function') {
        throw new Error('ESMongoSync: callback must be a function or null');
      }

      logger.debug(chalk.blue('init arguments valid!'));
    }

  },

  /**
   * systemEnvsSet
   * @summary verifies that all required environment variables are set
   * @return {Array} returns array of unset envs
   */
  systemEnvsSet: function () {
    var unsetEnv = [];
    _.each(systemEnvs, function (env) {
      if (!serverEnv[env]) {
        unsetEnv.push(env);
      }
    });
    return unsetEnv;
  }

};
