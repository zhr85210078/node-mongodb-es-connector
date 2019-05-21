/*
 * @Author: horan 
 * @Date: 2017-07-09 09:45:21 
 * @Last Modified by: horan
 * @Last Modified time: 2019-05-21 17:09:00
 * @Elasticsearch Method
 */

var Promise = require("bluebird");
var elasticsearchPool = require('../pool/elasticsearchPool');

var queryByIndex = function (url, esHttpAuth, index, query) {
    return new Promise(function (resolve, reject) {
        elasticsearchPool.getConnection(url, esHttpAuth).then(function (client) {
            client.search({
                index: index,
                size: 10000,
                // body: {
                //     query: query
                // }
            }, function (err, response) {
                if (err) {
                    return reject(err);
                } else if (response.errors) {
                    return resolve([]);
                } else {
                    var hits = response.hits.hits;
                    return resolve(hits);
                }
            });
        }).catch(function (err) {
            return reject(err);
        });
    });
};

var bulkData = function (url, esHttpAuth, bulk) {
    return new Promise(function (resolve, reject) {
        elasticsearchPool.getConnection(url, esHttpAuth).then(function (client) {
            client.bulk({
                body: bulk,
                timeout: '600000ms'
            }, function (err, response) {
                if (err) {
                    return reject(err);
                } else if (response.errors) {
                    return resolve(true);
                } else {
                    return resolve(true);
                }
            });
        }).catch(function (err) {
            return reject(err);
        });
    });
};

var bulkDataAndPip = function (url, esHttpAuth, bulk, pipelineName) {
    return new Promise(function (resolve, reject) {
        elasticsearchPool.getConnection(url, esHttpAuth).then(function (client) {
            client.bulk({
                body: bulk,
                timeout: '600000ms',
                pipeline: pipelineName
            }, function (err, response) {
                if (err) {
                    return reject(err);
                } else if (response.errors) {
                    return resolve(true);
                } else {
                    return resolve(true);
                }
            });
        }).catch(function (err) {
            return reject(err);
        });
    });
};

var deleteByIndex = function (url, esHttpAuth, index) {
    return new Promise(function (resolve, reject) {
        elasticsearchPool.getConnection(url, esHttpAuth).then(function (client) {
            client.indices.delete({
                index: index
            }, function (err, response) {
                if (err) {
                    return reject(err);
                } else if (response.errors) {
                    return resolve(true);
                } else {
                    return resolve(true);
                }
            });
        }).catch(function (err) {
            return reject(err);
        });
    });
};

var removeDoc = function (url, esHttpAuth, index, type, document_id) {
    return new Promise(function (resolve, reject) {
        elasticsearchPool.getConnection(url, esHttpAuth).then(function (client) {
            client.delete({
                index: index,
                type: type,
                id: document_id
            }, function (err, response) {
                if (err) {
                    return reject(err);
                } else if (response.errors) {
                    return resolve(true);
                } else {
                    return resolve(true);
                }
            });
        });
    });
};

var existDoc = function (url, esHttpAuth, index, type, document_id) {
    var queryStr = "_id:" + document_id;
    return new Promise(function (resolve, reject) {
        elasticsearchPool.getConnection(url, esHttpAuth).then(function (client) {
            client.search({
                index: index,
                type: type,
                q: queryStr
            }, function (err, response) {
                if (err) {
                    return reject(err);
                } else if (response.errors) {
                    return resolve(true);
                } else {
                    var flag = false;
                    var hits = response.hits.hits;
                    if (hits.length > 0) {
                        flag = true;
                    }
                    return resolve(flag);
                }
            });
        });
    });
};

var existEsServer = function (url, esHttpAuth) {
    return new Promise(function (resolve, reject) {
        elasticsearchPool.existEsServer(url, esHttpAuth).then(function (result) {
            return resolve(result);
        }).catch(function (err) {
            return reject(err);
        });
    });
};

var getSettings = function (url, esHttpAuth, index) {
    return new Promise(function (resolve, reject) {
        elasticsearchPool.getConnection(url, esHttpAuth).then(function (client) {
            client.indices.getSettings({
                index: index
            }, function (err, response) {
                if (err) {
                    return resolve(false);
                } else if (response.errors) {
                    return resolve(false);
                } else {
                    return resolve(response);
                }
            });
        }).catch(function (err) {
            return reject(err);
        });
    });
};

var putSettings = function (url, esHttpAuth, index, putSettingsObj) {
    return new Promise(function (resolve, reject) {
        elasticsearchPool.getConnection(url, esHttpAuth).then(function (client) {
            client.indices.putSettings({
                index: index,
                body: putSettingsObj
            }, function (err, response) {
                if (err) {
                    return reject(err);
                } else if (response.errors) {
                    return resolve(true);
                } else {
                    return resolve(true);
                }
            });
        }).catch(function (err) {
            return reject(err);
        });
    });
}

module.exports = {
    queryByIndex: queryByIndex,
    bulkData: bulkData,
    bulkDataAndPip: bulkDataAndPip,
    deleteByIndex: deleteByIndex,
    removeDoc: removeDoc,
    existDoc: existDoc,
    existEsServer: existEsServer,
    getSettings: getSettings,
    putSettings: putSettings
};
