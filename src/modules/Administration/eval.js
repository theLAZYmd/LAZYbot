const Parse = require('../../util/parse.js');
const DataManager = require('../../util/datamanager.js');
const Embed = require('../../util/embed.js');
const Logger = require('../../util/logger.js');
const request = require('request');
const rp = require('request-promise');
const fs = require('fs');

class Eval extends Parse {

	constructor(message) {
		super(message);
	}

	async call(argument) {
		try {
			if (!await this.Permissions.user('owner', this)) throw this.Permissions.output('user');
			if (!/^([\w]+)\/([\w]+).([\w]+)\(([\w\s\*\.\,]*)\)/i.test(argument)) throw 'Incorrect formatting to call a function.';
			let [, Module, Constructor, method, a] = argument.match(/^([\w]+)\/([\w]+).([\w]+)\(([\w\s\,]*)\)/i);
			let argsInfo = this;
			fs.readdir('./src/modules/', async function (err, _files) {
				let M = _files.find(f => f.toLowerCase() === Module.toLowerCase());
				if (!M) throw 'No such module **' + Module + '**';
				fs.readdir(`./src/modules/${M}/`, async function (err, files) {
					for (let f of files.filter(f => (new RegExp(Constructor.toLowerCase()).test(f.toLowerCase())))) try {
						let Instance = require(`../${M}/${f}`);
						let I = new Instance(argsInfo.message);
						if (typeof I[method] !== 'function') throw 'Couldn\'t find method ' + method + ' on ' + Constructor + '.';
						let data = await I[method](eval(a));
						if (/string|number/.test(typeof data)) argsInfo.Output.generic(data);
						else if (typeof data === 'object') argsInfo.Output.data(data);
						else argsInfo.log(data);
						return data;
					} catch (e) {
						if (e) argsInfo.Output.onError(e);
						return;
					}
				});
			});
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	async run(argument) {
		try {
			if (!await this.Permissions.role('owner', this)) throw this.Permissions.output('user');
			if (/^```[a-z]+[\s\n]+([\w\W]+)```$/.test(argument)) argument = argument
				.match(/^```[a-z]+\s+([\w\W\"]+)```$/)[1];
			else throw 'Incorrect formatting! Use a code block!';
			eval(argument);
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}
}

module.exports = Eval;