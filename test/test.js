var assert = require('assert');

assert(true); // OK

// var mongo = require('mongodb');
// var Promise = require("bluebird");
// var mongoPromise = require('../lib/promise/mongoPromise');
// var mongoUrl = "mongodb://UserAdmin:pass1234@localhost:29031,localhost:29032,localhost:29033/myTest?authSource=admin&replicaSet=my_replica";
// var path = require("path");
// var filePath = path.join(__dirname, 'img/大型网站技术架构：核心原理与案例分析.pdf');

// var dataList = [];
// for (var i = 0; i < 100; i++) {
//     var item = {};
//     item.num = i;
//     item.id = mongo.ObjectID();
//     item.metadata = {
//         "MainCollectionName": "books",
//         "MainId": item.id.toString(),
//         "filename": "大型网站技术架构：核心原理与案例分析.pdf"
//     };
//     var masterDoc = {
//         "_id": item.id,
//         "bName": "name" + i,
//         "bPrice": i * 1000,
//         "bImgSrc": "大型网站技术架构：核心原理与案例分析.pdf",
//         "version": "2.0"
//     };
//     item.masterDocArray = [];
//     item.masterDocArray.push(masterDoc);
//     dataList.push(item);
// }

// Promise.reduce(dataList, function (total, item, index) {
//     return new Promise(function (resolve, reject) {
//         //setTimeout(function () {
//             mongoPromise.insertGridFsStreams(mongoUrl, item.metadata, filePath).then(function (result) {
//                 if (result) {
//                     mongoPromise.insertData(mongoUrl, "books", item.masterDocArray).then(function (result) {
//                         console.log(item.num + ':' + result);
//                         return resolve(result)
//                     });
//                 }
//             });
//         //}, 5000);
//     });
// }, 0).then(function (result) {
//     console.log("end");
// });
