var Promise = require('es6-promise').Promise;
var elasticsearchPool = require('../pool/elasticsearchPool');

var searchESindex = function (url, esHttpAuth, index, query) {
    return new Promise(function (resolve, reject) {
        elasticsearchPool.getConnection(url, esHttpAuth).then(function (client) {
            client.search({
                index: index,
                size: 10000,
                body: {
                    query: query
                }
            }, function (err, response) {
                if (err) {
                    return reject(err);
                }
                else if (response.errors) {
                    return reject(response.errors);
                }
                else {
                    var hits = response.hits.hits;
                    return resolve(hits);
                }
            });
        }).catch(function (err) {
            return reject(err);
        });
    });
};

var insertEsData = function (url, esHttpAuth, bulk) {
    return new Promise(function (resolve, reject) {
        elasticsearchPool.getConnection(url, esHttpAuth).then(function (client) {
            client.bulk({
                body: bulk
            }, function (err, response) {
                if (err) {
                    return reject(err);
                }
                else if (response.errors) {
                    return reject(response.errors);
                }
                else {
                    return resolve(true);
                }
            });
        }).catch(function (err) {
            return reject(err);
        });
    });
};

var deleteEsIndex = function (url, esHttpAuth, index) {
    return new Promise(function (resolve, reject) {
        elasticsearchPool.getConnection(url, esHttpAuth).then(function (client) {
            client.indices.delete({
                index: index
            }, function (err, response) {
                if (err) {
                    return reject(err);
                }
                else if (response.errors) {
                    return reject(response.errors);
                }
                else {
                    return resolve(true);
                }
            });
        }).catch(function (err) {
            return reject(err);
        });
    });
};

var isExistEsServer = function (url, esHttpAuth) {
    return new Promise(function (resolve, reject) {
        elasticsearchPool.isExistEsServer(url, esHttpAuth).then(function (result) {
            return resolve(result);
        }).catch(function (err) {
            return reject(err);
        });
    });
};

module.exports = {
    searchESindex: searchESindex,
    insertEsData: insertEsData,
    deleteEsIndex: deleteEsIndex,
    isExistEsServer: isExistEsServer
};
