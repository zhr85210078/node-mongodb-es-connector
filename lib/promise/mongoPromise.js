/*
 * @Author: horan 
 * @Date: 2017-07-09 09:46:58 
 * @Last Modified by: horan
 * @Last Modified time: 2019-01-03 16:57:46
 * @Mogodb Method
 */

var Promise = require("bluebird");
var mongo = require('mongodb');
var mongoDBPool = require('../pool/mongoDBPool');
var Grid = require('gridfs-stream');
var streamToPromise = require("stream-to-promise");
var fs = require('fs');

var getDataCount = function (url, collectionName, filterFilds) {
    return new Promise(function (resolve, reject) {
        mongoDBPool.getConnection(url).then(function (db) {
            db.collection(collectionName).count(filterFilds, function (err, result) {
                if (err) {
                    return reject(err);
                } else {
                    return resolve(result);
                }
            });
        }).catch(function (err) {
            return reject(err);
        });
    });
};

var getOneData = function (url, collectionName, id) {
    return new Promise(function (resolve, reject) {
        mongoDBPool.getConnection(url).then(function (db) {
            db.collection(collectionName).findOne({
                '_id': id
            }, function (err, result) {
                if (err) {
                    return reject(err);
                } else {
                    return resolve(result);
                }
            });
        }).catch(function (err) {
            return reject(err);
        });
    });
};

var getAllDataResult = function (url, collectionName, filterFilds, searchFilds) {
    return new Promise(function (resolve, reject) {
        mongoDBPool.getConnection(url).then(function (db) {
            db.collection(collectionName).find(filterFilds).project(searchFilds).toArray(function (err, result) {
                if (err) {
                    return reject(err);
                } else {
                    return resolve(result);
                }
            });
        }).catch(function (err) {
            return reject(err);
        });
    });
};

var getPageDataResult = function (url, collectionName, filterFilds, searchFilds, pagesize, currentNum) {
    return new Promise(function (resolve, reject) {
        var skipNum = Math.ceil(pagesize * currentNum);
        mongoDBPool.getConnection(url).then(function (db) {
            db.collection(collectionName).find(filterFilds).limit(pagesize).skip(skipNum).project(searchFilds).toArray(function (err, result) {
                if (err) {
                    return reject(err);
                } else {
                    return resolve(result);
                }
            });
        }).catch(function (err) {
            return reject(err);
        });
    });
};

var insertData = function (url, collectionName, insertArray) {
    return new Promise(function (resolve, reject) {
        mongoDBPool.getConnection(url).then(function (db) {
            db.collection(collectionName).insertMany(insertArray, function (err, result) {
                if (err) {
                    return reject(err);
                } else {
                    return resolve(result);
                }
            });
        }).catch(function (err) {
            return reject(err);
        });
    });
};

var getGridFsFiles = function (url, fileName) {
    return new Promise(function (resolve, reject) {
        mongoDBPool.getConnection(url).then(function (db) {
            var gfs = Grid(db, mongo);
            gfs.files.find({
                filename: fileName
            }).toArray(function (err, files) {
                if (err) {
                    return reject(err);
                } else {
                    return resolve(files);
                }
            });
        }).catch(function (err) {
            return reject(err);
        });
    });
};

var getGridFsFileById = function (url, id) {
    return new Promise(function (resolve, reject) {
        mongoDBPool.getConnection(url).then(function (db) {
            var gfs = Grid(db, mongo);
            gfs.findOne({
                _id: id
            }, function (err, file) {
                if (err) {
                    return reject(err);
                } else {
                    return resolve(file);
                }
            });
        }).catch(function (err) {
            return reject(err);
        });
    });
};

var getGridFsFileByMetaDataMainId = function (url, mainId) {
    return new Promise(function (resolve, reject) {
        mongoDBPool.getConnection(url).then(function (db) {
            var gfs = Grid(db, mongo);
            gfs.files.find({
                "metadata.MainId": mainId
            }).toArray(function (err, files) {
                if (err) {
                    return reject(err);
                } else {
                    return resolve(files);
                }
            });
        }).catch(function (err) {
            return reject(err);
        });
    });
};

var getGridFsStreams = function (url, fileId) {
    return new Promise(function (resolve, reject) {
        mongoDBPool.getConnection(url).then(function (db) {
            var gfs = Grid(db, mongo);
            var readstream = gfs.createReadStream({
                _id: fileId
            });

            streamToPromise(readstream).then(function (buffer) {
                var base64 = Buffer(buffer).toString('base64');
                return resolve(base64);
            }).catch(function (err) {
                return reject(err);
            });
        }).catch(function (err) {
            return reject(err);
        });
    });
};

var getGridFsArray = function (mongoUrl, mainId) {
    return new Promise(function (resolve, reject) {
        getGridFsFileByMetaDataMainId(mongoUrl, mainId).then(function (files) {
            var resultArry = [];
            if (files.length > 0) {
                Promise.reduce(files, function (total, item) {
                    return new Promise(function (resolve, reject) {
                        getGridFsStreams(mongoUrl, item._id).then(function (result) {
                            if (result) {
                                var resultObj = {};
                                resultObj.filename = item.filename;
                                resultObj.data = result;
                                resultArry.push(resultObj);
                                return resolve(resultArry);
                            } else {
                                return reject('fail get gridfs streams');
                            }
                        }).catch(function (err) {
                            return reject(err);
                        });
                    });
                }, 0).then(function (res) {
                    return resolve(res);
                }).catch(function (err) {
                    return reject(err);
                });
            } else {
                return resolve(resultArry);
            }
        });
    });
};


var insertGridFsStreams = function (url, metadata, path) {
    return new Promise(function (resolve, reject) {
        mongoDBPool.getConnection(url).then(function (db) {
            var gfs = Grid(db, mongo);
            var writestream = gfs.createWriteStream({
                filename: metadata.filename,
                metadata: metadata
            });
            var writableStream = fs.createReadStream(path).pipe(writestream);
            streamToPromise(writableStream);
            writestream.on('close', function (file) {
                if (file.filename) {
                    return resolve(true);
                } else {
                    return reject('fail insert gridfs streams');
                }
            });
        }).catch(function (err) {
            return resolve(err);
        });
    });
};

module.exports = {
    getDataCount: getDataCount,
    getOneData: getOneData,
    getAllDataResult: getAllDataResult,
    getPageDataResult: getPageDataResult,
    insertData: insertData,
    getGridFsFiles: getGridFsFiles,
    getGridFsFileById: getGridFsFileById,
    getGridFsFileByMetaDataMainId: getGridFsFileByMetaDataMainId,
    getGridFsStreams: getGridFsStreams,
    getGridFsArray: getGridFsArray,
    insertGridFsStreams: insertGridFsStreams
};
