var sane = require('sane');
var logger = require('./logger.js');
var chalk = require('chalk');
var path = require("path");

var fsWatcher = function (filePath, ESMongoSync,getFileList) {
    var watcher = sane(filePath, { glob: ['**/*.json'] });
    watcher.on('ready', function () { 
        logger.debug(chalk.bgGreen('fsWatcher is running'));
    });
    watcher.on('change', function (filepath, root, stat) { 
        logger.debug(chalk.hex('#FF34B3').bgHex('#FFFF00').bold('file changed: %s'), filepath);
        ESMongoSync.updateSingleWatcher(require(path.join(root,filepath)),getFileList.readFileList(filePath,[]));
    });
    watcher.on('add', function (filepath, root, stat) { 
        logger.debug(chalk.bgBlue('file added: %s'), filepath);
        ESMongoSync.addSingleWatcher(require(path.join(root,filepath)),getFileList.readFileList(filePath,[]));
    });
    watcher.on('delete', function (filepath, root) { 
        logger.debug(chalk.bgHex('#EE30A7').bold('file deleted: %s'), filepath);
        ESMongoSync.deleteSingleWatcher(getFileList.readFileList(filePath,[]));
    });
};

module.exports = {
    fsWatcher: fsWatcher
};