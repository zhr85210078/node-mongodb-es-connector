/*
 * @Author: horan 
 * @Date: 2017-07-09 09:44:35 
 * @Last Modified by: horan
 * @Last Modified time: 2018-08-02 15:32:10
 * @Creates and manages the fsWatcher
 */

var sane = require('sane');
var path = require("path");
var fs = require('fs');
var logger = require('./logger.js');

var fsWatcher = function (filePath) {
    var watcher = sane(filePath, {
        glob: ['**/*.json']
    });
    watcher.on('ready', function () {
        logger.logMethod('debug', 'fsWatcher is running');
    });
    watcher.on('change', function (fileName, root) {
        logger.logMethod('info', '******************************change config file******************************');
        logger.logMethod('info', 'file changed: ' + fileName);
        var currentFile = {};
        currentFile.Filename = fileName;
        currentFile.Content = JSON.parse(fs.readFileSync(path.join(root, fileName)));
        require("../main.js").singlePipe(currentFile, root);
    });
    watcher.on('add', function (fileName, root) {
        logger.logMethod('info', '******************************add config file******************************');
        logger.logMethod('info', 'file added: ' + fileName);
        var currentFile = {};
        currentFile.Filename = fileName;
        currentFile.Content = JSON.parse(fs.readFileSync(path.join(root, fileName)));
        require("../main.js").singlePipe(currentFile, root);
    });
    watcher.on('delete', function (fileName) {
        logger.logMethod('info', '******************************delete config file******************************');
        logger.logMethod('info', 'file deleted: ' + fileName);
    });
};

module.exports = {
    fsWatcher: fsWatcher
};