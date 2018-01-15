var _ = require('underscore');
var parser = require('dot-object');
var logger = require('./logger.js');

var Promise = require('es6-promise').Promise;
var elasticsearchPool = require('../pool/elasticsearchPool');

var insert = function (index, type, document_id, document, url,httpAuth) {
  logger.debug('Inserting document %s', document_id);
  return new Promise(function (resolve, reject) {
    elasticsearchPool.getConnection(url,httpAuth).then(function (client) {
      client.index({
        index: index,
        type: type,
        id: document_id,
        body: parser.object(document)
      }, function (error, response) {
        if (!error && !response.errors) {
          logger.info('Inserted document %s to %s/%s (index/type)', document_id, index, type);
          return resolve(true);
        } else {
          if (error) {
            logger.error('Document %s NOT inserted to %s/%s (index/type) because of "%s"\n%s', document_id, index, type, error.message, error.stack);
            return reject(error);
          }
          if (response.errors) {
            logger.warn('Document %s NOT inserted to %s/%s (index/type):\n%s', document_id, index, type, JSON.stringify(response.errors));
            return reject(response.errors);
          }
        }
      }).catch(function (err) {
        return reject(err);
      });
    });
  });
};

var remove = function (index, type, document_id, url,httpAuth) {
  logger.debug('Deleting document %s', document_id);
  return new Promise(function (resolve, reject) {
    elasticsearchPool.getConnection(url,httpAuth).then(function (client) {
      client.delete({
        index: index,
        type: type,
        id: document_id
      }, function (error, response) {
        if (!error && !response.errors) {
          logger.info('Deleted %s from %s/%s (index/type)', document_id, index, type);
          return resolve(true);
        } else {
          if (error) {
            logger.error('Document %s to be deleted but not found', document_id);
            return reject(error);
          }
          if (response.errors) {
            logger.warn('Document %s NOT deleted to %s/%s (index/type):\n%s', document_id, index, type, JSON.stringify(response.errors));
            return reject(response.errors);
          }
        }
      }).catch(function (err) {
        return reject(err);
      });
    });
  });
};

var update = function (index, type, document_id, partialDocument, url,httpAuth) {
  logger.debug('Updating document %s', document_id);
  return new Promise(function (resolve, reject) {
    elasticsearchPool.getConnection(url,httpAuth).then(function (client) {
      client.update({
        index: index,
        type: type,
        id: document_id,
        body: {
          doc: parser.object(partialDocument)
        }
      }, function (error, response) {
        if (!error && !response.errors) {
          logger.info('Update %s in %s/%s (index/type)', document_id, index, type);
          return resolve(true);
        } else {
          if (error) {
            logger.error('Document %s to be updated but not found', document_id);
            return reject(error);
          }
          if (response.errors) {
            logger.warn('Document %s NOT updated to %s/%s (index/type):\n%s', document_id, index, type, JSON.stringify(response.errors));
            return reject(response.errors);
          }
        }
      }).catch(function (err) {
        return reject(err);
      });
    });
  });
};

module.exports = {
  insert: insert,
  remove: remove,
  update: update
};

