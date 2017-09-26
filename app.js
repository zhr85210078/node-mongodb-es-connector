var MONGO_OPLOG_URL="mongodb://localhost:29031/local"; 
var MONGO_DATA_URL="mongodb://localhost:29031/myTest"; 

// var MONGO_OPLOG_URL="mongodb://siteRootAdmin:pass1234@HKAPPUWV812:29031/local?authSource=admin"; 
// var MONGO_DATA_URL="mongodb://siteRootAdmin:pass1234@HKAPPUWV812:29031/vRiskBB4RawData?authSource=admin"; 

var ELASTIC_SEARCH_URL="localhost:9200"; 
var BATCH_COUNT = 5000; 

process.env.DEBUG='*';
process.env.MONGO_OPLOG_URL = MONGO_OPLOG_URL;
process.env.MONGO_DATA_URL = MONGO_DATA_URL;
process.env.ELASTIC_SEARCH_URL =ELASTIC_SEARCH_URL;
process.env.BATCH_COUNT = BATCH_COUNT;

var path = require("path");
var ESMongoSync = require('./lib/main');
var filePath =path.join(__dirname,'watchers');
var getFileList = require('./lib/util/getFileList').readFileList(filePath,[]);
ESMongoSync.init(getFileList,null,null);
require('./lib/util/fsWatcher').fsWatcher(filePath,ESMongoSync,require('./lib/util/getFileList'));