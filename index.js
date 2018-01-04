// var path = require("path");
// var _ = require('underscore');
// var main=require('./lib/main');
// var filePath = path.join(__dirname, 'crawlerDataConfig');
// var getFileList = require('./lib/util/getFileList').readFileList(filePath, []);
// var numCPUs = require('os').cpus().length;

// main.init(getFileList);

// _.each(getFileList, function (jsonFileObj) {
//     /*mongodb*/
//     var mongodbDataUrl = jsonFileObj.mongodb.mongodb_data_url;
//     var mongodbOplogUrl = jsonFileObj.mongodb.mongodb_oplog_url;
//     var collectionName = jsonFileObj.mongodb.mongodb_collectionName;
//     var filterFilds = jsonFileObj.mongodb.mongodb_filterFilds;
//     var searchFilds = jsonFileObj.mongodb.mongodb_searchFilds;
//     var defaultFilds = jsonFileObj.mongodb.mongodb_defaultFilds;
//     /*elasticsearch*/
//     var esIndex=jsonFileObj.elasticsearch.elasticsearch_index;
//     var esType=jsonFileObj.elasticsearch.elasticsearch_type;
//     var esUrl=jsonFileObj.elasticsearch.elasticsearch_url;
//     main.startProcess(mongodbDataUrl,collectionName,filterFilds,searchFilds,defaultFilds,esIndex,esType,esUrl).then(function (result){
//         console.log(result);
//         return result;
//     });
//     // mongoPromise.getDataCount(mongoUrl, collectionName, filterFilds).then(function (result) {
//     //     console.log(result);
//     //     return result;
//     // }).then(function (result) {
//     //     if (result > 0) {
//     //         return mongoPromise.getDataResult(mongoUrl, collectionName, filterFilds, searchFilds);
//     //     }
//     //     else {
//     //         return [];
//     //     }
//     // }).then(function (result) {
//     //     console.log(result);
//     //     return result;
//     // });
// });

// elasticsearchPromise.searchESindex("http://localhost:9200", "mydesign", {}).then(function (result) {
//     console.log(result);
//     return result;
// });

//url,collectionName,filterFilds,searchFilds,pagesize,pageNum

// var mongoPromise = require('./lib/promise/mongoPromise');
// var filterFilds={
//     "name":"test1111"
// };
// var searchFilds={
//     "name": 1,
//     "password": 1
// };
// mongoPromise.getPageDataResult("mongodb://localhost:29031/myTest","users",filterFilds,searchFilds,5000,1).then(function (result) {
//         console.log(result);
//         return result;
// });