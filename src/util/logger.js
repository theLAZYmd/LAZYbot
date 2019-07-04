class Logger {
    
	static async command(argsInfo, cmdInfo) {
		try {
			let time = Date.getISOtime(Date.now()).slice(0, 24);
			let author = argsInfo.author.tag;
			let Constructor = cmdInfo.file.toProperCase();
			let command = (cmdInfo.command ? argsInfo.server.prefixes[cmdInfo.prefix] : cmdInfo.prefix) + argsInfo.command;
			let args = argsInfo.args;
			//logger.log({
			//	"level": "info",
			//	"message": time + " | " + author + " | " + Constructor + " | " + command + " | [" + args + "]"
			//});
			Logger.output(time + ' | ' + author + ' | ' + Constructor + ' | ' + command + ' | [' + args + ']');
			return '';
		} catch (e) {
			Logger.error(e);
		}
	}

	/**
     * Asynchronously logs a value
     * @param {*} value
     */
	static async log() {
		let str = '';
		for (let r of arguments) str += ((s) => {
			if (/string|number|boolean/.test(typeof s)) return s;
			if (Array.isArray(s)) return [Date.getISOtime(Date.now()).slice(0, 24), ...s].join(' | ');
			if (typeof s === 'object') return [Date.getISOtime(Date.now()).slice(0, 24), ...Object.entries(s).map(([k, v]) => k + ': ' + v)].join(' | ');
			if (typeof s === 'function') return s.toString();
		})(r) + ' ';
		Logger.output(str);
	}

	static async load(startTime, list, source) {
		let arr = [
			Date.getISOtime(Date.now()).slice(0, 24),
			'loaded'
		];
		if (typeof startTime === 'number') arr.push((Date.now() - startTime) + 'ms');
		if (source) arr.push(source);
		Logger.output(arr.join(' | ') + '\n' + list.map(([s, k]) => ['    ' + k, s]).toPairs());
	}

	/**
	 * Logs a new item to the console
	 */
	static async output() {
		console.log(...arguments);
	}

	/**
	 * Logs a new error message asynchronously
	 * @param {Error} e 
	 */
	static async error(e) {
		console.error(e);
	}
}

module.exports = Logger;