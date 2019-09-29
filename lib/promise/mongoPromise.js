/*
 * @Author: horan 
 * @Date: 2017-07-09 09:46:58 
 * @Last Modified by: horan
 * @Last Modified time: 2019-09-29 09:46:27
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
            db.collection(collectionName).countDocuments(filterFilds, function (err, result) {
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

var getGridFsArray = function (mongoUrl, mainId, attachmentSize, currentData, mongodataCount) {
    return new Promise(function (resolve, reject) {
        var maxAttachmentSize = 1024 * 1024 * 150;
        if (attachmentSize) {
            maxAttachmentSize = attachmentSize;
        }
        getGridFsFileByMetaDataMainId(mongoUrl, mainId).then(function (files) {
            var resultArry = [];
            resultArry[0] = "success";
            var attachments_SizeByte = 0;
            if (files.length > 0) {
                Promise.reduce(files, function (total, item) {
                    return new Promise(function (resolve, reject) {
                        if ((attachmentSize && item.length < attachmentSize) || (!attachmentSize && item.length < maxAttachmentSize)) {
                            getGridFsStreams(mongoUrl, item._id).then(function (result) {
                                if (result) {
                                    var resultObj = {};
                                    resultObj.filename = item.filename;
                                    resultObj.data = result;
                                    resultArry.push(resultObj);
                                    attachments_SizeByte += item.length;
                                    return resolve(resultArry);
                                } else {
                                    return reject('Fail get gridfs streams (' + currentData + '/' + mongodataCount + '), DocId: ' + mainId + ', fileId: ' + item._id.toString());
                                }
                            }).catch(function (err) {
                                return reject(err);
                            });
                        } else {
                            resultArry[0] = 'Exceed max length (' + currentData + '/' + mongodataCount + '), DocId: ' + mainId + ', fileId: ' + item._id.toString();
                            return resolve(resultArry);
                        }
                    });
                }, 0).then(function (res) {
                    if (attachments_SizeByte > maxAttachmentSize) {
                        resultArry = [];
                        resultArry[0] = 'Exceed max length (' + currentData + '/' + mongodataCount + '), DocId: ' + mainId;
                        return resolve(resultArry);
                    }
                    return resolve(res);
                }).catch(function (err) {
                    return reject(err);
                });
            } else {
                resultArry[0] = 'no attachments found (' + currentData + '/' + mongodataCount + '), DocId: ' + mainId;
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
