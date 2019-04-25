/*
 * @Author: horan 
 * @Date: 2017-07-09 09:44:35 
 * @Last Modified by: horan
 * @Last Modified time: 2019-03-06 16:36:21
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
        logger.logMethod('debug',
            '',
            '',
            'FsWatcher is running');
    });
    watcher.on('change', function (fileName, root) {
        logger.logMethod('info',
            '',
            '',
            '******************************update config file******************************');
        logger.logMethod('info',
            '',
            '',
            'File changed: ' + fileName);
        var currentFile = {};
        currentFile.Filename = fileName;
        currentFile.Content = JSON.parse(fs.readFileSync(path.join(root, fileName)));
        require("../main.js").singlePipe(currentFile, root);
    });
    watcher.on('add', function (fileName, root) {
        logger.logMethod('info',
            '',
            '',
            '******************************Add config file******************************');
        logger.logMethod('info',
            '',
            '',
            'File added: ' + fileName);
        var currentFile = {};
        currentFile.Filename = fileName;
        currentFile.Content = JSON.parse(fs.readFileSync(path.join(root, fileName)));
        require("../main.js").singlePipe(currentFile, root);
    });
    watcher.on('delete', function (fileName) {
        logger.logMethod('info',
            '',
            '',
            '******************************Delete config file******************************');
        logger.logMethod('info',
            '',
            '',
            'File deleted: ' + fileName);
    });
};

module.exports = {
    fsWatcher: fsWatcher
};