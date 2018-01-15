var _ = require('underscore');
var Promise = require('es6-promise').Promise;
var fs = require('fs');
var path = require("path");

var getCollectionName = function (ns) {
    var splitArray = ns.split('.');
    return splitArray[splitArray.length - 1];
};

var getWatcher = function (watchers, collectionName) {
    return _.find(watchers, function (watcher) {
        return watcher.Content.mongodb.mongodb_collectionName === collectionName;
    });
};

var getWatchers = function (watchers, collectionName) {
    var watchersArr = [];
    _.find(watchers, function (watcher) {
        if (watcher.Content.mongodb.mongodb_collectionName === collectionName) {
            watchersArr.push(watcher);
        }
    });
    return watchersArr;
};

var mergeJsonObject = function (nativeJson, expandJson) {
    var resultJson = {};
    for (var nattr in nativeJson) {
        resultJson[nattr] = nativeJson[nattr];
    }
    for (var eattr in expandJson) {
        resultJson[eattr] = expandJson[eattr];
    }
    return resultJson;
};

var returnJsonObject = function (nativeJson, searchJson) {
    var resultJson = {};
    var flag = false;
    for (var attrNa in nativeJson) {
        for (var attrFi in searchJson) {
            if (attrNa === attrFi) {
                resultJson[attrNa] = nativeJson[attrNa];
            }
        }
    }
    return resultJson;
};

var filterJson = function (filterJson, dataJson) {
    for (var fj in filterJson) {
        for (var dj in dataJson) {
            if (fj === dj) {
                if (filterJson[fj] !== dataJson[dj]) {
                    return false;
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

var isInteger = function (number) {
    return number > 0 && String(number).split('.')[1] == undefined;
};

var readFileList = function (filePath, filesList) {
    var files = fs.readdirSync(filePath);
    files.forEach(function (filename) {
        var stat = fs.statSync(path.join(filePath, filename));
        if (stat.isDirectory()) {
            readFileList(path.join(filePath, filename), filesList);
        }
        else {
            var currentFile = {};
            var currentFileContent = require(path.join(filePath, filename));
            currentFile.Filename = filename;
            currentFile.Content = currentFileContent;
            filesList.push(currentFile);
        }
    });
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
        }
        else {
            returnString += arr[i].replace(":", "_") + "_";
        }
    }
    return returnString;
};

var returnMongodbDataUrl = function (connection, dataBase) {
    var mongodbDataUrl = "";
    if (connection.mongodb_servers && connection.mongodb_servers.length > 0) {
        if (connection.mongodb_authentication) {
            if (connection.mongodb_authentication.userName && connection.mongodb_authentication.passWord) {
                mongodbDataUrl = "mongodb://" + connection.mongodb_authentication.userName + ":" + connection.mongodb_authentication.passWord + "@" + connection.mongodb_servers.toString() + "/" + dataBase;
            }
        }
        else {
            mongodbDataUrl = "mongodb://" + connection.mongodb_servers.toString() + "/" + dataBase;
        }
    }
    return mongodbDataUrl;
};

var returnMongodbOplogUrl = function (connection) {
    var mongodbOplogUrl = "";
    if (connection.mongodb_servers && connection.mongodb_servers.length > 0) {
        if (connection.mongodb_authentication) {
            if (connection.mongodb_authentication.userName && connection.mongodb_authentication.passWord) {
                mongodbOplogUrl = "mongodb://" + connection.mongodb_authentication.userName + ":" + connection.mongodb_authentication.passWord + "@" + connection.mongodb_servers.toString() + "/local";
            }
        }
        else {
            mongodbOplogUrl = "mongodb://" + connection.mongodb_servers.toString() + "/local";
        }
    }
    return mongodbOplogUrl;
};

module.exports = {
    getCollectionName: getCollectionName,
    getWatcher: getWatcher,
    getWatchers: getWatchers,
    mergeJsonObject: mergeJsonObject,
    returnJsonObject: returnJsonObject,
    filterJson: filterJson,
    contains: contains,
    isInteger: isInteger,
    readFileList: readFileList,
    mkdir: mkdir,
    arrayto_String: arrayto_String,
    returnMongodbDataUrl: returnMongodbDataUrl,
    returnMongodbOplogUrl: returnMongodbOplogUrl
};