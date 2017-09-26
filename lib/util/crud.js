var _ = require('underscore'),
  parser = require('dot-object'),
  Util = require('./util'),
  logger = require('./logger.js'),
  chalk = require('chalk');

module.exports = {

  /**
   * insert
   * @summary insert into elastic search
   * @param {Object} watcher
   * @param {Object} document - document to insert
   * @param {Object} esClient - elasticSearch client object
   * @return {null} return null
   */
  insert: function (watcher, document_id, document, esClient) {
    logger.debug(chalk.bgBlue('Inserting document %s'), document_id);
    Util.transform(watcher, document, function (document) {
      esClient.index({
        index: watcher.index,
        type: watcher.type,
        id: document_id,
        body: parser.object(document)
      }, function (error, response) {
        if (!error && !response.errors) {
          logger.info('Inserted document %s to %s/%s (index/type)', document_id, watcher.index, watcher.type);
        } else {
          if (error) {
            logger.error('Document %s NOT inserted to %s/%s (index/type) because of "%s"\n%s', document_id, watcher.index, watcher.type, error.message, error.stack);
          }
          if (response.errors) {
            logger.warn('Document %s NOT inserted to %s/%s (index/type):\n%s', document_id, watcher.index, watcher.type, JSON.stringify(response.errors));
          }
        }
      });
    });
  },


  /**
   * remove
   * @summary delete from elastic search
   * @param {Object} watcher
   * @param {String} id - id of document to remove from elasticSearch
   * @param {Object} esClient - elasticSearch client object
   * @return {null} return null
   */
  remove: function (watcher, id, esClient) {
    logger.debug(chalk.bgHex('#EE30A7').bold('Deleting document %s'), id.toString());
    esClient.delete({
      index: watcher.index,
      type: watcher.type,
      id: id.toString()
    }, function (error, response) {
      if (!error && !response.errors) {
        logger.info('Deleted %s from %s/%s (index/type)', id, watcher.index, watcher.type);
      } else {
        if (error) {
          logger.error('Document %s to be deleted but not found', id);
        }
        if (response.errors) {
          logger.warn('Document %s NOT deleted to %s/%s (index/type):\n%s', id, watcher.index, watcher.type, JSON.stringify(response.errors));
        }
      }
    });
  },


  /**
   * update
   * @summary update elastic search document
   * @param {Object} watcher
   * @param {String} id - id of document to update in elasticSearch
   * @param {Object} partialDocument - partial document containing fields to update with corresponding values
   * @param {Object} esClient - elasticSearch client object
   * @return {null} return null
   */
  update: function (watcher, id, partialDocument, esClient) {
    logger.debug(chalk.hex('#FF34B3').bgHex('#FFFF00').bold('Updating document %s'), id.toString());
    esClient.update({
      index: watcher.index,
      type: watcher.type,
      id: id.toString(),
      body: {
        doc: parser.object(partialDocument)
      }
    }, function (error, response) {
      if (!error && !response.errors) {
        logger.info('Update %s in %s/%s (index/type)', id, watcher.index, watcher.type);
      } else {
        if (error) {
          logger.error('Document %s to be updated but not found', id);
        }
        if (response.errors) {
          logger.warn('Document %s NOT updated to %s/%s (index/type):\n%s', id, watcher.index, watcher.type, JSON.stringify(response.errors));
        }
      }
    });
  }
};

