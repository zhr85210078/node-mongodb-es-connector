var Promise = require("bluebird");
var ElasticSearch = require('elasticsearch');
var _ = require('underscore');
var elasticsearchPool = [];

module.exports = function () {
    return {
        getConnection: function getConnection(connectionString, httpAuth) {
            return new Promise(function (resolve, reject) {
                if (_.isEmpty(connectionString)) {
                    return reject('getConnection must be called with a mongo connection string');
                }
                var pool = _.findWhere(elasticsearchPool, { connectionString: connectionString });
                if (pool) {
                    return resolve(pool.EsClient);
                }
                var EsClient = null;
                var ElasticSearchConfig = {};
                if (httpAuth!=null&&httpAuth.userName && httpAuth.passWord) {
                    ElasticSearchConfig.host = connectionString;
                    ElasticSearchConfig.keepAlive = true;
                    ElasticSearchConfig.httpAuth = httpAuth.userName + ":" + httpAuth.passWord;
                }
                else {
                    ElasticSearchConfig.host = connectionString;
                    ElasticSearchConfig.keepAlive = true;
                }

                EsClient = new ElasticSearch.Client(ElasticSearchConfig);
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
        },
        isExistEsServer: function isExistEsServer(connectionString, httpAuth) {
            return new Promise(function (resolve, reject) {
                var EsClient = null;
                var ElasticSearchConfig = {};
                if (httpAuth!=null&&httpAuth.userName && httpAuth.passWord) {
                    ElasticSearchConfig.host = connectionString;
                    ElasticSearchConfig.keepAlive = true;
                    ElasticSearchConfig.httpAuth = httpAuth.userName + ":" + httpAuth.passWord;
                }
                else {
                    ElasticSearchConfig.host = connectionString;
                    ElasticSearchConfig.keepAlive = true;
                }

                EsClient = new ElasticSearch.Client(ElasticSearchConfig);
                EsClient.ping({
                    requestTimeout: 60000
                }, function (error) {
                    if (error) {
                        return resolve(false);
                    }
                    return resolve(true);
                });
            });
        }
    };
}();