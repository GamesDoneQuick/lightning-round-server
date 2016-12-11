'use strict';

const winston = require('winston');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const logDir = path.resolve(__dirname, '../logs');
const LEVEL = config.get('logLevel') || 'info';

require('winston-daily-rotate-file');

// Make log directory if it does not exist
if (!fs.existsSync(logDir)) {
	fs.mkdirSync(logDir);
}

winston.addColors({
	trace: 'green',
	debug: 'cyan',
	info: 'white',
	warn: 'yellow',
	error: 'red'
});

module.exports = new (winston.Logger)({
	transports: [
		new (winston.transports.DailyRotateFile)({
			json: false,
			prettyPrint: true,
			filename: `${logDir}/log`,
			prepend: true,
			level: LEVEL
		}),
		new (winston.transports.Console)({
			prettyPrint: true,
			colorize: true,
			level: LEVEL
		})
	]
});
