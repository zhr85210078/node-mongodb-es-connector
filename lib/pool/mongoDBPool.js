/*
 * @Author: horan 
 * @Date: 2017-07-09 09:43:04 
 * @Last Modified by: horan
 * @Last Modified time: 2018-07-09 09:44:16
 * @Creates and manages the Mongo connection pool
 */
 
var Promise = require("bluebird");
var mongo = require('mongodb');
var _ = require('underscore');
var mongoDBPool = [];

module.exports = function () {

    return {
        getConnection: function getConnection(connectionString) {
            return new Promise(function (resolve, reject) {
                if (_.isEmpty(connectionString)) {
                    return reject('getConnection must be called with a mongo connection string');
                }
                var pool = _.findWhere(mongoDBPool, { connectionString: connectionString });
                if (pool) {
                    return resolve(pool.db);
                }
                var MongoClient = new mongo.MongoClient();
                MongoClient.connect(connectionString, function (err, database) {
                    if (err) {
                        return reject(err);
                    }
                    mongoDBPool.push({
                        connectionString: connectionString,
                        db: database
                    });
                    return resolve(database);
                });
            });
        },
        ObjectID: function (id) {
            return mongo.ObjectID(id);
        }
    };
}();