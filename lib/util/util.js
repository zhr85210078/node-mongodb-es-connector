/*
 * @Author: horan 
 * @Date: 2017-07-09 10:23:12 
 * @Last Modified by: horan
 * @Last Modified time: 2018-07-11 16:54:33
 * @Common Method
 */

var _ = require('underscore');
var fs = require('fs');
var path = require("path");

var getWatchers = function (watchers, mServer, database, collectionName) {
    var watchersArr = [];
    _.find(watchers, function (watcher) {
        if (watcher.Content.mongodb.m_connection.m_servers.toString() === mServer) {
            if (watcher.Content.mongodb.m_database === database) {
                if (watcher.Content.mongodb.m_collectionname === collectionName) {
                    watchersArr.push(watcher);
                }
            }
        }
    });
    return watchersArr;
};

var returnJsonObject = function (nativeJson, searchJson) {
    var resultJson = {};
    if (nativeJson && searchJson) {
        for (var attrNa in nativeJson) {
            for (var attrFi in searchJson) {
                if (attrNa === attrFi) {
                    resultJson[attrNa] = nativeJson[attrNa];
                }
            }
        }
    } else {
        resultJson = nativeJson;
    }
    return resultJson;
};

var filterJson = function (filterJson, dataJson) {
    if (filterJson && dataJson) {
        for (var fj in filterJson) {
            for (var dj in dataJson) {
                if (fj === dj) {
                    if (filterJson[fj] !== dataJson[dj]) {
                        return false;
                    }
                }
            }
        }
    }
    return true;
};

var contains = function (arr, obj) {
    var i = arr.length;
    while (i--) {
        if (arr[i] === obj) {
            return true;
        }
    }
    return false;
};

var readFolderList = function (filePath, folderList) {
    if (filePath !== "") {
        var files = fs.readdirSync(filePath);
        if (files && files.length > 0) {
            files.forEach(function (filename) {
                var stat = fs.statSync(path.join(filePath, filename));
                if (stat.isDirectory()) {
                    folderList.push(filename);
                }
            });
        }
    }
    return folderList;
};

var readFileList = function (filePath, filesList) {
    if (filePath !== "") {
        var files = fs.readdirSync(filePath);
        if (files && files.length > 0) {
            files.forEach(function (filename) {
                var stat = fs.statSync(path.join(filePath, filename));
                if (stat.isDirectory()) {
                    readFileList(path.join(filePath, filename), filesList);
                } else {
                    var currentFile = {};
                    var currentFileContent = require(path.join(filePath, filename));
                    currentFile.Filename = filename;
                    currentFile.Content = currentFileContent;
                    filesList.push(currentFile);
                }
            });
        }
    }
    return filesList;
};

var mkdir = function (dirpath, dirname) {
    if (typeof dirname === "undefined") {
        if (fs.existsSync(dirpath)) {
            return;
        } else {
            mkdir(dirpath, path.dirname(dirpath));
        }
    } else {
        if (dirname !== path.dirname(dirpath)) {
            mkdir(dirpath);
            return;
        }
        if (fs.existsSync(dirname)) {
            fs.mkdirSync(dirpath);
        } else {
            mkdir(dirname, path.dirname(dirpath));
            fs.mkdirSync(dirpath);
        }
    }
};

var arrayto_String = function (arr) {
    var returnString = "";
    for (var i = 0; i < arr.length; i++) {
        if ((i + 1) == arr.length) {
            returnString += arr[i].replace(":", "_");
        } else {
            returnString += arr[i].replace(":", "_") + "_";
        }
    }
    return returnString;
};

var returnMongodbDataUrl = function (url, connection, dataBase) {
    var mongodbDataUrl = "";
    if (url) {
        mongodbDataUrl = url;
    } else {
        if (connection.m_servers && connection.m_servers.length > 0) {
            if (connection.m_authentication) {
                if (connection.m_authentication.username && connection.m_authentication.password && connection.m_authentication.authsource) {
                    if (connection.m_authentication.ssl) {
                        mongodbDataUrl = "mongodb://" + connection.m_authentication.username + ":" + connection.m_authentication.password +
                            "@" + connection.m_servers.toString() + "/" + dataBase + "?ssl=" + connection.m_authentication.ssl + "&authSource=" +
                            connection.m_authentication.authsource + (connection.m_authentication.replicaset ? "&replicaSet=" + connection.m_authentication.replicaset : "");
                    } else {
                        mongodbDataUrl = "mongodb://" + connection.m_authentication.username + ":" + connection.m_authentication.password +
                            "@" + connection.m_servers.toString() + "/" + dataBase + "?authSource=" + connection.m_authentication.authsource +
                            (connection.m_authentication.replicaset ? "&replicaSet=" + connection.m_authentication.replicaset : "");
                    }
                }
            } else {
                mongodbDataUrl = "mongodb://" + connection.m_servers.toString() + "/" + dataBase;
            }
        }
    }
    return mongodbDataUrl;
};

var returnMongodbOplogUrl = function (url, connection) {
    var mongodbOplogUrl = "";
    if (url) {
        var urlArray = url.split("?");
        var length = urlArray[0].lastIndexOf('/');
        var topUrlString = urlArray[0].substr(0, length);
        mongodbOplogUrl = topUrlString + "/local?" + urlArray[1];
    } else {
        if (connection.m_servers && connection.m_servers.length > 0) {
            if (connection.m_authentication) {
                if (connection.m_authentication.username && connection.m_authentication.password && connection.m_authentication.authsource) {
                    if (connection.m_authentication.ssl) {
                        mongodbOplogUrl = "mongodb://" + connection.m_authentication.username + ":" + connection.m_authentication.password +
                            "@" + connection.m_servers.toString() + "/local" + "?ssl=" + connection.m_authentication.ssl + "&authSource=" +
                            connection.m_authentication.authsource + (connection.m_authentication.replicaset ? "&replicaSet=" + connection.m_authentication.replicaset : "");
                    } else {
                        mongodbOplogUrl = "mongodb://" + connection.m_authentication.username + ":" + connection.m_authentication.password +
                            "@" + connection.m_servers.toString() + "/local" + "?authSource=" + connection.m_authentication.authsource +
                            (connection.m_authentication.replicaset ? "&replicaSet=" + connection.m_authentication.replicaset : "");
                    }
                }
            } else {
                mongodbOplogUrl = "mongodb://" + connection.m_servers.toString() + "/local";
            }
        }
    }
    return mongodbOplogUrl;
};

var createInfoArray = function (fileList) {
    global.infoArray = [];
    _.find(fileList, function (file) {
        var item = {};
        item.cluster = file.Content.elasticsearch.e_connection.e_server;
        item.index = file.Content.elasticsearch.e_index;
        item.msg = "";
        item.status = "w";
        global.infoArray.push(item);
    });
};

var updateInfoArray = function (cluster, index, msg, status) {
    if (global.infoArray && global.infoArray.length > 0) {
        _.find(global.infoArray, function (file) {
            if (file.cluster === cluster && file.index === index) {
                file.msg = msg;
                file.status = status;
            }
        });
    } else {
        global.infoArray = [];
        var item = {};
        item.cluster = cluster;
        item.index = index;
        item.msg = msg;
        item.status = status;
        global.infoArray.push(item);
    }
};

module.exports = {
    getWatchers: getWatchers,
    returnJsonObject: returnJsonObject,
    filterJson: filterJson,
    contains: contains,
    readFolderList: readFolderList,
    readFileList: readFileList,
    mkdir: mkdir,
    arrayto_String: arrayto_String,
    returnMongodbDataUrl: returnMongodbDataUrl,
    returnMongodbOplogUrl: returnMongodbOplogUrl,
    createInfoArray: createInfoArray,
    updateInfoArray: updateInfoArray
};