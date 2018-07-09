/*
 * @Author: horan 
 * @Date: 2017-07-09 10:24:01 
 * @Last Modified by: horan
 * @Last Modified time: 2018-07-09 10:24:41
 * @Startup
 */

var path = require("path");
var filePath = path.join(__dirname, 'crawlerDataConfig');
var getFileList = require('./lib/util/util').readFileList(filePath, []);
require('./lib/util/util').createInfoArray(getFileList);
require('./lib/main').init(getFileList, filePath);


