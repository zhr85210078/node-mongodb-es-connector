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
        logger.logMethod('debug', 'file changed: ' + fileName);
        var currentFile = {};
        currentFile.Filename = fileName;
        currentFile.Content = JSON.parse(fs.readFileSync(path.join(root, fileName)));
        require("../main.js").singlePipe(currentFile);
    });
    watcher.on('add', function (fileName, root) {
        logger.logMethod('debug', 'file added: ' + fileName);
        var currentFile = {};
        currentFile.Filename = fileName;
        currentFile.Content = JSON.parse(fs.readFileSync(path.join(root, fileName)));
        require("../main.js").singlePipe(currentFile);
    });
    watcher.on('delete', function (fileName) {
        logger.logMethod('debug', 'file deleted: ' + fileName);
    });
};

module.exports = {
    fsWatcher: fsWatcher
};