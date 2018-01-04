var Promise = require('es6-promise').Promise;
var ElasticSearch = require('elasticsearch');
var _ = require('underscore');
var elasticsearchPool = [];

module.exports = function () {
    return {
        getConnection: function getConnection(connectionString) {
            return new Promise(function (resolve, reject) {
                if (_.isEmpty(connectionString)) {
                    return reject('getConnection must be called with a mongo connection string');
                }
                var pool = _.findWhere(elasticsearchPool, { connectionString: connectionString });
                if (pool) {
                    return resolve(pool.EsClient);
                }
                var EsClient = null;
                EsClient = new ElasticSearch.Client({
                    host: connectionString,
                    keepAlive: true
                });
                EsClient.ping({
                    requestTimeout: Infinity
                }, function (error) {
                    if (error) {
                        return reject(error);
                    } else {
                        elasticsearchPool.push({
                            connectionString: connectionString,
                            EsClient: EsClient
                        });
                        return resolve(EsClient);
                    }
                });
            });
        }
    };
}();