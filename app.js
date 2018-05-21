var path = require("path");
var filePath = path.join(__dirname, 'crawlerDataConfig');
var getFileList = require('./lib/util/util').readFileList(filePath, []);
require('./lib/util/util').createInfoArray(getFileList);
require('./lib/main').init(getFileList, filePath);


