const { createLogger, format, transports, addColors } = require('winston');
const { combine, timestamp, printf, colorize } = format;
const levels = { 
	error: 0, 
	warn: 1, 
	info: 2, 
	verbose: 3, 
	debug: 4,
	load: 4,
	command: 4,
	data: 5
};
addColors({
	error: 'red', 
	warn: 'yellow', 
	info: 'white', 
	verbose: 'green', 
	debug: 'green',
	load: 'green',
	command: 'blue',
	data: 'blue'
});

const myFormat = printf(({ level, message, timestamp }) => {
	return `${timestamp} | ${level}: ${message}`;
});
 
const logger = createLogger({
	levels,
	format: combine(
		colorize(),
		timestamp(),
		myFormat
	),
	exitOnError: false,
	transports: [
		new transports.Console({
			level: 'command'
		}),
		new transports.File({
			filename: '../error.log',
			level: 'warn'
		}),
		new transports.File({
			filename: '../debug.log',
			level: 'command'
		}),
		new transports.File({
			filename: '../data.log',
			level: 'data'
		})
	]
});        

class Logger {

	/**
	 * Logs data for a new command instance
	 * @param {Parse} argsInfo 
	 * @param {Object} cmdInfo 
	 */
	static command(argsInfo, cmdInfo) {
		const author = argsInfo.author.tag;
		const Constructor = cmdInfo.file.toProperCase();
		const command = (cmdInfo.command ? argsInfo.server.prefixes[cmdInfo.prefix] : cmdInfo.prefix) + argsInfo.command;
		const args = argsInfo.args;
		logger.log({
			level: 'command',
			message: [author, Constructor, command, args]
				.map(a => typeof a === 'object' ? JSON.stringify(a, null) : a)
				.join(' | ')
		});
		return '';
	}
	
	/**
	 * Logs data when a new module loads
	 * @param {*} startTime 
	 * @param {*} list 
	 * @param {*} source 
	 */
	static load(startTime, list = [], source) {
		if (typeof startTime === 'number') list.push((Date.now() - startTime) + 'ms');
		if (source) list.push(source);
		logger.log({
			level: 'load',
			message: list
				.map(a => typeof a === 'object' ? JSON.stringify(a, null, 4) : a)
				.join(' | ')
		});
	}

	/**
	 * Logs a new error message asynchronously
	 * @param {Error} e 
	 */
	static error() {
		for (let a of Array.from(arguments)) {
			logger.log({
				level: 'error',
				message: a.stack
			});
		}
	}

	/**
	 * Logs a new warn message asynchronously
	 */
	static warn() {
		for (let a of Array.from(arguments)) {
			let message = a;
			if (typeof a === 'object') message = JSON.stringify(a, null, 4);
			logger.log({
				level: 'warn',
				message
			});
		}
	}

	/**
	 * Logs info data asynchronously
	 */
	static info() {
		for (let a of Array.from(arguments)) {
			let message = a;
			if (typeof a === 'object') message = JSON.stringify(a, null, 4);
			logger.log({
				level: 'info',
				message
			});
		}
	}
	
	/**
	 * Logs any verbose information asynchronously
	 */
	static verbose() {
		for (let a of Array.from(arguments)) {
			let message = a;
			if (typeof a === 'object') message = JSON.stringify(a, null, 4);
			logger.log({
				level: 'verbose',
				message
			});
		}
	}

	/**
	 * For outputting debug data to the console as well as a debug file
	 */
	static debug() {
		for (let a of Array.from(arguments)) {
			let message = a;
			if (typeof a === 'object') message = JSON.stringify(a, null, 4);
			logger.log({
				level: 'debug',
				message
			});
		}
	}

	/**
	 * For outputting debug data to a data file
	 */
	static data() {
		for (let a of Array.from(arguments)) {
			let message = a;
			if (typeof a === 'object') message = JSON.stringify(a, null, 4);
			logger.log({
				level: 'data',
				message
			});
		}
	}

}

Logger.load(Date.now(), ['online', 'offline', {obj1: true, obj2: false}], 'lichess');

module.exports = Logger;