/*
 * @Author: horan 
 * @Date: 2017-07-09 10:24:01 
 * @Last Modified by: horan
 * @Last Modified time: 2019-05-21 18:21:35
 * @Startup
 */

var path = require("path");
var fsWatcher = require('./lib/util/fsWatcher');
var filePath = path.join(__dirname, 'crawlerData');
var getFileList = require('./lib/util/util').readFileList(filePath, [], ".json");
require('./lib/util/util').createInfoArray(getFileList);
fsWatcher.fsWatcher(filePath);
require('./lib/main').init(getFileList, filePath);