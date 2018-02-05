var Promise = require("bluebird");
var mongoDBPool = require('../pool/mongoDBPool');

var getDataCount=function(url,collectionName,filterFilds){
    return new Promise(function (resolve, reject) {
        mongoDBPool.getConnection(url).then(function (db) {
            db.collection(collectionName).count(filterFilds,function (err,result){
                if (err){
                    return reject(err);
                }
                else{
                    return resolve(result);
                }
            });
        }).catch(function (err) {
            return reject(err);
        });
    });
};

var getAllDataResult = function (url,collectionName,filterFilds,searchFilds) {
    return new Promise(function (resolve, reject) {
        mongoDBPool.getConnection(url).then(function (db) {
            db.collection(collectionName).find(filterFilds).project(searchFilds).toArray(function (err,result){
                if (err){
                    return reject(err);
                }
                else{
                    return resolve(result);
                }
            });
        }).catch(function (err) {
            return reject(err);
        });
    });
};

var getPageDataResult = function (url,collectionName,filterFilds,searchFilds,pagesize,currentNum) {
    return new Promise(function (resolve, reject) {
        var skipNum=Math.ceil(pagesize*currentNum);
        mongoDBPool.getConnection(url).then(function (db) {
            db.collection(collectionName).find(filterFilds).limit(pagesize).skip(skipNum).project(searchFilds).toArray(function (err,result){
                if (err){
                    return reject(err);
                }
                else{
                    return resolve(result);
                }
            });
        }).catch(function (err) {
            return reject(err);
        });
    });
};

var insertData=function (url,collectionName,insertArray) {
    return new Promise(function (resolve, reject) {
        mongoDBPool.getConnection(url).then(function (db) {
            db.collection(collectionName).insertMany(insertArray,function(err,result){
                if (err){
                    return reject(err);
                }
                else{
                    return resolve(result);
                }
            });
        }).catch(function (err) {
            return reject(err);
        });
    });
};

module.exports = {
    getAllDataResult:getAllDataResult,
    getPageDataResult:getPageDataResult,
    getDataCount:getDataCount,
    insertData:insertData
};
