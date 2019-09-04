/*
 * @Author: horan 
 * @Date: 2017-07-09 09:42:38 
 * @Last Modified by: horan
 * @Last Modified time: 2019-09-04 11:03:52
 * @Creates and manages the Elasticsearch connection pool
 */

var Promise = require("bluebird");
var ElasticSearch = require('elasticsearch');
var elasticsearchPool = [];

module.exports = function () {
    return {
        getConnection: function (connectionString, httpAuth) {
            return new Promise(function (resolve, reject) {
                if (elasticsearchPool && elasticsearchPool.length > 0 && connectionString.length > 0) {
                    elasticsearchPool.forEach(function (item) {
                        if (item.str === connectionString) {
                            return resolve(item.EsClient);
                        }
                    })
                }

                var EsClient = null;
                var ElasticSearchConfig = {};
                var connectionArray = connectionString.split(",");
                var hostsArray = [];
                connectionArray.forEach(function (connectionItem) {
                    var host = {};
                    var connectionStringArray = connectionItem.split(":");
                    host.protocol = connectionStringArray[0];
                    host.host = connectionStringArray[1].split("/")[2];
                    host.port = connectionStringArray[2].split("/")[0];
                    host.headers = {
                        "Content-Encoding": "gzip,deflate"
                    };
                    hostsArray.push(host);
                });
                ElasticSearchConfig.hosts = hostsArray;
                ElasticSearchConfig.requestTimeout = 600000;
                ElasticSearchConfig.deadTimeout = 600000;
                ElasticSearchConfig.suggestCompression = true;
                if (httpAuth !== null && httpAuth.username && httpAuth.password) {
                    ElasticSearchConfig.httpAuth = httpAuth.username + ":" + httpAuth.password;
                }
                ElasticSearchConfig.sniffOnConnectionFault = true;

                EsClient = new ElasticSearch.Client(ElasticSearchConfig);
                EsClient.ping({
                    requestTimeout: Infinity
                }, function (error) {
                    if (error) {
                        return reject(error);
                    }
                    elasticsearchPool.push({
                        str: connectionString,
                        EsClient: EsClient
                    });
                    return resolve(EsClient);
                });
            });
        },
        existEsServer: function (connectionString, httpAuth) {
            return new Promise(function (resolve, reject) {
                var EsClient = null;
                if (elasticsearchPool && elasticsearchPool.length > 0 && connectionString.length > 0) {
                    elasticsearchPool.forEach(function (item) {
                        if (item.str === connectionString) {
                            EsClient = item.EsClient;
                        }
                    })
                }

                var ElasticSearchConfig = {};
                var connectionArray = connectionString.split(",");
                var hostsArray = [];
                connectionArray.forEach(function (connectionItem) {
                    var host = {};
                    var connectionStringArray = connectionItem.split(":");
                    host.protocol = connectionStringArray[0];
                    host.host = connectionStringArray[1].split("/")[2];
                    host.port = connectionStringArray[2].split("/")[0];
                    host.headers = {
                        "Content-Encoding": "gzip,deflate"
                    };
                    hostsArray.push(host);
                });
                if (httpAuth !== null && httpAuth.username && httpAuth.password) {
                    ElasticSearchConfig.hosts = hostsArray;
                    ElasticSearchConfig.keepAlive = true;
                    ElasticSearchConfig.httpAuth = httpAuth.username + ":" + httpAuth.password;
                } else {
                    ElasticSearchConfig.hosts = hostsArray;
                    ElasticSearchConfig.keepAlive = true;
                }
                ElasticSearchConfig.sniffOnConnectionFault = true;

                EsClient = new ElasticSearch.Client(ElasticSearchConfig);
                EsClient.ping({
                    requestTimeout: 60000
                }, function (error) {
                    if (error) {
                        return reject(error);
                    }
                    elasticsearchPool.push({
                        str: connectionString,
                        EsClient: EsClient
                    });
                    return resolve(true);
                });
            });
        }
    };
}();