/*
 * @Author: horan 
 * @Date: 2017-07-09 10:24:01 
 * @Last Modified by: horan
 * @Last Modified time: 2019-10-22 15:35:44
 * @Startup
 */

var path = require("path");
var fsWatcher = require('./lib/util/fsWatcher');
var filePath = path.join(__dirname, 'crawlerData');
var getFileList = require('./lib/util/util').readFileList(filePath, [], ".json");
fsWatcher.fsWatcher(filePath);
require('./lib/main').init(getFileList, filePath);