var assert = require('assert');

assert(true); // OK

// var mongo = require('mongodb');
// var Promise = require("bluebird");
// var mongoPromise = require('../lib/promise/mongoPromise');
// var mongoUrl = "mongodb://UserAdmin:pass1234@localhost:29031,localhost:29032,localhost:29033/myTest?authSource=admin&replicaSet=my_replica";
// var path = require("path");
// var filePath = path.join(__dirname, 'img/51CTO下载-C#字符串和正则表达式参考手册.pdf');

// var dataList = [];
// for (var i = 0; i < 100; i++) {
//     var item = {};
//     item.num = i;
//     item.id = mongo.ObjectID();
//     item.metadata = {
//         "MainCollectionName": "carts",
//         "MainId": item.id.toString(),
//         "filename": "51CTO下载-C#字符串和正则表达式参考手册.pdf"
//     };
//     var masterDoc = {
//         "_id": item.id,
//         "cName": "name" + i,
//         "cPrice": i * 1000,
//         "cImgSrc": "51CTO下载-C#字符串和正则表达式参考手册.pdf",
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
//                     mongoPromise.insertData(mongoUrl, "carts", item.masterDocArray).then(function (result) {
//                         console.log(item.num + ':' + result);
//                         return resolve(result)
//                     });
//                 }
//             });
//         //}, 1000);
//     });
// }, 0).then(function (result) {
//     console.log("end");
// });