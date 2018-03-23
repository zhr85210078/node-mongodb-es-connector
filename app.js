var path = require("path");
var main = require('./lib/main');
var filePath = path.join(__dirname, 'crawlerDataConfig');
var getFileList = require('./lib/util/util').readFileList(filePath, []);
main.init(getFileList, filePath);