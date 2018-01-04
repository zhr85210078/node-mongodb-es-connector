var sane = require('sane');
var chalk = require('chalk');
var path = require("path");
var fs = require('fs');
var logger = require('./logger.js');

var fsWatcher = function (filePath) {
    var watcher = sane(filePath, { glob: ['**/*.json'] });
    watcher.on('ready', function () { 
        logger.debug(chalk.bgGreen('fsWatcher is running'));
    });
    watcher.on('change', function (fileName, root, stat) { 
        logger.debug(chalk.hex('#FF34B3').bgHex('#FFFF00').bold('file changed: %s'), fileName);
        var currentFile=JSON.parse(fs.readFileSync(path.join(root, fileName)));
        require("../main.js").updateSingleDataConfig(currentFile);
    });
    watcher.on('add', function (fileName, root, stat) { 
        logger.debug(chalk.bgBlue('file added: %s'), fileName);
        var currentFile=JSON.parse(fs.readFileSync(path.join(root, fileName)));
        require("../main.js").updateSingleDataConfig(currentFile);
    });
    watcher.on('delete', function (fileName, root) { 
        logger.debug(chalk.bgHex('#EE30A7').bold('file deleted: %s'), fileName);
    });
};

module.exports = {
    fsWatcher: fsWatcher
};