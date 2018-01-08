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
        return watcher.mongodb.mongodb_collectionName === collectionName;
    });
};

var getWatchers = function (watchers, collectionName) {
    var watchersArr=[];
    _.find(watchers, function (watcher) {
        if(watcher.mongodb.mongodb_collectionName === collectionName){
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
                resultJson[attrNa]=nativeJson[attrNa];
            }
        }
    }
    return resultJson;
};

var filterJson=function(filterJson,dataJson){
    for(var fj in filterJson){
        for(var dj in dataJson){
            if(fj===dj){
                if(filterJson[fj]!==dataJson[dj]){
                    return false;
                }
            }
        }
    }
    return true;
};

var contains=function (arr, obj) {  
    var i = arr.length;  
    while (i--) {  
        if (arr[i] === obj) {  
            return true;  
        }  
    }  
    return false;  
}; 

var readFileList = function (filePath, filesList) {
    var files = fs.readdirSync(filePath);
    files.forEach(function (filename) {
        var stat = fs.statSync(path.join(filePath, filename));
        if (stat.isDirectory()) {
            readFileList(path.join(filePath, filename), filesList);
        }
        else {
            var currentFile = require(path.join(filePath, filename));
            filesList.push(currentFile);
        }
    });
    return filesList;
};


module.exports = {
    getCollectionName: getCollectionName,
    getWatcher: getWatcher,
    getWatchers:getWatchers,
    mergeJsonObject: mergeJsonObject,
    returnJsonObject:returnJsonObject,
    filterJson:filterJson,
    contains:contains,
    readFileList:readFileList
};