/*
 * @Author: horan 
 * @Date: 2017-07-09 09:42:38 
 * @Last Modified by: horan
 * @Last Modified time: 2021-03-25 14:18:00
 * @Creates and manages the Elasticsearch connection pool
 */

var Promise = require("bluebird");
var ElasticSearch = require('elasticsearch');
var elasticsearchPool = [];

var getClient = function (connectionString, httpAuth) {
    return new Promise(function (resolve, reject) {
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
        ElasticSearchConfig.requestTimeout = 1200000;
        ElasticSearchConfig.deadTimeout = 1200000;
        ElasticSearchConfig.suggestCompression = true;
        ElasticSearchConfig.keepAlive = true;
        ElasticSearchConfig.sniffOnConnectionFault = true;
        if (httpAuth !== null && httpAuth.username && httpAuth.password) {
            ElasticSearchConfig.httpAuth = httpAuth.username + ":" + httpAuth.password;
        }

        EsClient = new ElasticSearch.Client(ElasticSearchConfig);
        EsClient.ping({
            requestTimeout: 1200000
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
};

module.exports = function () {
    return {
        getConnection: function (connectionString, httpAuth) {
            return new Promise(function (resolve, reject) {
                if (elasticsearchPool && elasticsearchPool.length > 0 && connectionString.length > 0) {
                    var isExistClient = elasticsearchPool.find(function (v) {
                        return v.str === connectionString;
                    });
                    if (isExistClient && isExistClient.EsClient) {
                        return resolve(isExistClient.EsClient);
                    } else {
                        return getClient(connectionString, httpAuth).then(function (result) {
                            return resolve(result);
                        });;
                    }
                } else {
                    return getClient(connectionString, httpAuth).then(function (result) {
                        return resolve(result);
                    });;
                }
            });
        }
    };
}();