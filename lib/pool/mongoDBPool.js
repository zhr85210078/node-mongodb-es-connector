/*
 * @Author: horan 
 * @Date: 2017-07-09 09:43:04 
 * @Last Modified by: horan
 * @Last Modified time: 2019-04-25 10:59:34
 * @Creates and manages the Mongo connection pool
 */

var Promise = require("bluebird");
var MongoClient = require('mongodb').MongoClient;
var _ = require('underscore');
var mongoDBPool = [];

module.exports = function () {

    return {
        getConnection: function (connectionString) {
            return new Promise(function (resolve, reject) {
                if (_.isEmpty(connectionString)) {
                    return reject('getConnection must be called with a mongo connection string');
                }
                var pool = _.findWhere(mongoDBPool, {
                    connectionString: connectionString
                });
                if (pool) {
                    return resolve(pool.db);
                }
                MongoClient.connect(connectionString, {
                    useNewUrlParser: true
                }, function (err, client) {
                    if (err) {
                        return reject(err);
                    }
                    var dbName = connectionString.split("?")[0].split("/")[3];
                    var database = client.db(dbName);
                    mongoDBPool.push({
                        connectionString: connectionString,
                        client: client,
                        db: database
                    });
                    return resolve(database);
                });
            });
        },
        ObjectID: function (id) {
            return mongo.ObjectID(id);
        },
        clientClose: function (connectionString) {
            var pool = {};
            var newMongoDBPool = [];
            for (var item in mongoDBPool) {
                if (mongoDBPool[item].connectionString === connectionString) {
                    pool = mongoDBPool[item];
                } else {
                    newMongoDBPool.push(item);
                }
            }
            pool.client.close();
            mongoDBPool = newMongoDBPool;
        }
    };
}();