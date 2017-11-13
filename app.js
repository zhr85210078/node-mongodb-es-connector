// var MONGO_OPLOG_URL="mongodb://localhost:29031/local"; 
// var MONGO_DATA_URL="mongodb://localhost:29031/myTest"; 

// // var MONGO_OPLOG_URL="mongodb://siteRootAdmin:pass1234@HKAPPUWV812:29031/local?authSource=admin"; 
// // var MONGO_DATA_URL="mongodb://siteRootAdmin:pass1234@HKAPPUWV812:29031/vRiskBB4RawData?authSource=admin"; 

// var ELASTIC_SEARCH_URL="localhost:9200"; 
// var BATCH_COUNT = 1000; 

// process.env.DEBUG='*';
// process.env.MONGO_OPLOG_URL = MONGO_OPLOG_URL;
// process.env.MONGO_DATA_URL = MONGO_DATA_URL;
// process.env.ELASTIC_SEARCH_URL =ELASTIC_SEARCH_URL;
// process.env.BATCH_COUNT = BATCH_COUNT;

// var path = require("path");
// var ESMongoSync = require('./lib/main');
// var filePath =path.join(__dirname,'watchers');
// var getFileList = require('./lib/util/getFileList').readFileList(filePath,[]);
// ESMongoSync.init(getFileList,null,null);
// require('./lib/util/fsWatcher').fsWatcher(filePath,ESMongoSync,require('./lib/util/getFileList'));




// var path = require("path");
// var index = require('./index.js');
// var filePath =path.join(__dirname,'watchers');
// index.setConfig("mongodb://localhost:29031/local","mongodb://localhost:29031/myTest","localhost:9200",1000);
// index.start(filePath);

// var flag=false;

// // //var flag=index.isExistWatcher(filePath,"carts");
// // //console.log(flag);

// var oneSecond = 5000 * 1; // one second = 1000 x 1 ms
// setTimeout(function() {
//     var findFilds={};
//     var expandFilds={};
//     var filter={};
//     findFilds.cName=1;
//     findFilds.cPrice=1;
//     expandFilds.aaa="11111111";
//     filter.cPrice="333";
//     flag=index.addSingleWatcher(filePath,"carts","mycarts","carts",filter,findFilds,expandFilds);
//     //flag=index.updateSingleWatcher(filePath,"documents","mydocuments","documents",null,null);
//     //flag=index.deleteSingleWatcher(filePath,"documents");
// }, oneSecond);

module.exports = require('./index.js');