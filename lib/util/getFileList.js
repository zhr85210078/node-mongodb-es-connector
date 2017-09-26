var fs = require('fs');
var path = require("path");

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
    readFileList: readFileList
  };