var Promise = require("bluebird");
var mongoPromise = require('../lib/promise/mongoPromise');
//var mongoUrl="mongodb://UserAdmin:pass1234@HKDBSDWV002:29031,HKDBSDWV002:29032,HKDBSDWV002:29033/PwCUS_ProposalHub?authSource=admin&replicaSet=rs_ExceedNotes_DEV";
//var mongoUrl="mongodb://UserAdmin:pass1234@HKDBSDWV002:29031,HKDBSDWV002:29032,HKDBSDWV002:29033/PwCUS_ProposalHub?authSource=admin&replicaSet=rs_ExceedNotes_DEV";
var mongoUrl = "mongodb://UserAdmin:pass1234@localhost:29031,localhost:29032,localhost:29033/myTest?authSource=admin&replicaSet=my_replica";
var path = require("path");
//var filePath = path.join(__dirname, 'img/structure.jpg');
//var filePath = path.join(__dirname, 'img/mongoDB.jpg');
var filePath = path.join(__dirname, 'img/elasticsearch.jpg');

//var fileName="docs\\Citation2017-07-20T122437Z_2MA3H3WJHADT-3-2386.pptx";
// mongoPromise.getGridFsFiles(mongoUrl, fileName).then(function (results) {
//     console.log(results);
// });


//var id="4a4770fe-83ad-4e96-b954-a28029bbf9f2";
// mongoPromise.getGridFsFileById(mongoUrl, id).then(function (result) {
//     console.log(result);
// });



//var mainId="b01198a7-6c78-4b26-bd11-1690bad99e59";
// mongoPromise.getGridFsFileByMetaDataMainId(mongoUrl, mainId).then(function (result) {
//     console.log(result);
// });


// var fileId="ce23348f-7237-4b90-b66b-7d7346bbd6b3";
// mongoPromise.getGridFsStreams(mongoUrl, fileId).then(function (result) {
//     console.log(result);
// });


// var mainId="5a91057c25c9c8e2124b9a86"; 
// mongoPromise.getGridFsFileByMetaDataMainId(mongoUrl, mainId).then(function (files) {
//     var resultArry=[];
//     Promise.reduce(files, (total, item, index) => {
//         return new Promise(function (resolve, reject) {
//             mongoPromise.getGridFsStreams(mongoUrl,item._id).then(function (result) {
//                 if (result) {
//                     var resultObj={};
//                     resultObj.filename=item.filename;
//                     resultObj.data=result;
//                     resultArry.push(resultObj);
//                     return resolve(resultArry);
//                 }
//                 else {
//                     return resolve(false);
//                 }
//             });
//         });
//     }, 0).then(res => {
//         console.log(res);
//     });
// });


// var metadata = {
//     "MainCollectionName": "carts",
//     "MainId": "5a91057c25c9c8e2124b9a86",
//     "filename": "structure.jpg"
// };
// var metadata = {
//     "MainCollectionName": "carts",
//     "MainId": "5a9105cb25c9c8e2124b9b56",
//     "filename": "mongoDB.jpg"
// };
var metadata = {
    "MainCollectionName": "carts",
    "MainId": "5a9105cb25c9c8e2124b9b56",
    "filename": "elasticsearch.jpg"
};
mongoPromise.insertGridFsStreams(mongoUrl,metadata,filePath).then(function(result){
    console.log(result);
});
