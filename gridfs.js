var fs = require("fs"),
    mongo = require("mongodb"),
    Grid = require("gridfs-stream"),
    gridfs,
    writeStream,
    readStream,
    bufs = [];

//var mongoUrl = "mongodb://localhost:29031/myTest";
var mongoUrl="mongodb://siteRootAdmin:pass1234@hkdbsdwv002:29031/PwCUS_ProposalHub?authSource=admin";          
mongo.MongoClient.connect(mongoUrl, function (err, db) {
    gridfs = Grid(db, mongo);
    //readStream = gridfs.createReadStream({ _id: '5731569044795a2308d7e48c' });
    //readStream = gridfs.createReadStream({ filename: "test.txt" });
    readStream = gridfs.createReadStream({ filename: "Handbook for Fin-ePayslips.docx" });

    readStream.on("data", function (chunk) {
        bufs.push(chunk);
    }).on("end", function () {
        var fbuf = Buffer.concat(bufs);
        var thisFile = (fbuf.toString('base64'));
        console.log("contents of thisFile:\n\n", thisFile);
    });
});