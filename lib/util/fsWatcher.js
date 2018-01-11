var sane = require('sane');
var path = require("path");
var fs = require('fs');
var logger = require('./logger.js');

var fsWatcher = function (filePath) {
    var watcher = sane(filePath, { glob: ['**/*.json'] });
    watcher.on('ready', function () { 
        logger.debug('fsWatcher is running');
    });
    watcher.on('change', function (fileName, root, stat) { 
        logger.debug('file changed: %s', fileName);
        var currentFile={};
        currentFile.Filename=fileName;
        currentFile.Content=JSON.parse(fs.readFileSync(path.join(root, fileName)));
        require("../main.js").updateSingleDataConfig(currentFile);
    });
    watcher.on('add', function (fileName, root, stat) { 
        logger.debug('file added: %s', fileName);
        var currentFile={};
        currentFile.Filename=fileName;
        currentFile.Content=JSON.parse(fs.readFileSync(path.join(root, fileName)));
        require("../main.js").updateSingleDataConfig(currentFile);
    });
    watcher.on('delete', function (fileName, root) { 
        logger.debug('file deleted: %s', fileName);
    });
};

module.exports = {
    fsWatcher: fsWatcher
};