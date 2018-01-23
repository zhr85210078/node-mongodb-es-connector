var winston = require('winston');
var RotateFile = require('winston-daily-rotate-file');
var moment = require('moment');

winston.setLevels({
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    verbose: 4,
});

winston.addColors({
    debug: 'cyan',
    info: 'green',
    warn: 'yellow',
    error: 'red',
    verbose:'blue'
});

var logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({
            level: 'debug',
            prettyPrint: true,
            colorize:true,
            silent: false,
            timestamp: () => moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
        }),
        new (RotateFile)({
            level: 'info',
            prettyPrint: true,
            silent: false,
            colorize: false,
            name: 'info-file',
            filename: 'logs/logger',
            timestamp: () => moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
            json: false,
            maxFiles: 10,
            datePattern: '-yyyy-MM-dd.log',    
            formatter: function(options) {
                return options.timestamp() +' '+ options.level.toUpperCase() +' '+ (options.message ? options.message : '') +
                  (options.meta && Object.keys(options.meta).length ? '\n\t'+ JSON.stringify(options.meta) : '' );
              }
        })
    ]
});

module.exports=logger;