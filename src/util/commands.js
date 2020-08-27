const fs = require('fs');
const path = require('path');

const DataManager = require('./datamanager');
const Logger = require('./logger');
const All = DataManager.getFile('./src/commands/all.json');
const Bot = DataManager.getFile('./src/commands/bot.json');
const DM = DataManager.getFile('./src/commands/dm.json');
const Message = DataManager.getFile('./src/commands/message.json');
const Reaction = DataManager.getFile('./src/commands/reaction.json');
const Interval = DataManager.getFile('./src/commands/interval.json');
const config = require('../config.json');

class Commands {

	static async run (cmdInfo, message) {
		if (!cmdInfo.args) cmdInfo.args = [];
		const directory = path.join('modules', cmdInfo.module, cmdInfo.file);
		let extensions = ['.js', '.ts', '.mjs'];
		let testPath = directory;
		while (!fs.existsSync(path.join(process.cwd(), 'src', testPath))) {
			if (extensions.length === 0) throw new Error('Couldn\'t find module ' + path.join(process.cwd(), 'src', directory));
			testPath = directory + extensions.shift();
		}
		let Constructor = require(path.join(process.cwd(), 'src', testPath));
		let Instance = await new Constructor(message);
		if (typeof Instance[cmdInfo.method] === 'function') return Instance[cmdInfo.method](...cmdInfo.args);
		return false;
	}

	static getFunction (cmdInfo) {
		let directory = 'modules/' + cmdInfo.module + '/' + cmdInfo.file.toLowerCase();
		let path = 'modules/' + cmdInfo.module + '/' + cmdInfo.file.toLowerCase();
		let extensions = ['.js', '.ts', '.mjs'];
		while (!fs.existsSync('./src/' + path)) {
			if (extensions.length === 0) throw 'Couldn\'t find module ./src/' + directory;
			path = directory + extensions.shift();
		}
		let Constructor = require('../' + path);
		let method = Constructor.prototype[cmdInfo.method];
		if (typeof method !== 'function') method = Object.getProp(Constructor.prototype, cmdInfo.method); // eval("Constructor.prototype." + cmdInfo.method);
		if (typeof method !== 'function') {
			Logger.error(path, cmdInfo.method);
			return null;
		}
		return method;
	}

	static parse () {

		class cmdInfo {

			constructor(c, base = {}) {
				if (c.prefix || base.prefix) this.prefix = c.prefix || base.prefix;
				this.module = c.module || base.module;
				this.file = c.file || base.file;
				this.method = c.method;
				this.description = c.description;
				this.active = c.active !== false ? true : false;
				this.aliases = c.aliases;
				if (c.arguments) this.arguments = c.arguments;
				if (c.requires) this.requires = c.requires;
				if (c.guild) this.guild = c.guild;
			}

		}
		return new cmdInfo(...arguments);
	}
    
	/**
     * The map of all functions which are called for every message event
     * @type {Map} 
     */
	static get all () {
		if (Commands._all) return Commands._all;
		return Commands.getAll();
	}
    
	/**
     * The map of all bot commmands triggered by their title, mapped to their info
     * @type {Map} 
     */
	static get bot () {
		if (Commands._bot) return Commands._bot;
		return Commands.getBot();
	}
    
	/**
     * The map of all DM commmands triggered by messages, mapped to their info
     * @type {Map} 
     */    
	static get dm () {
		if (Commands._dm) return Commands._dm;
		return Commands.getDM();
	}
    
	/**
     * The map of all commands triggered by messages for a server, mapped to their info
     * @type {Map} 
     */
	static get message () {
		if (Commands._message) return Commands._message;
		return {
			commands: new Map(),
			aliases: new Map()
		};
	}
     
	/**
     * The map of all functions which are called for every reaction event, keyed by reaction emoji name
     * @type {Map} 
     */   
	static get reaction () {
		if (Commands._reaction) return Commands._reaction;
		return Commands.getReaction();
	}

	static get interval () {
		if (Commands._interval) return Commands._interval;
		return Commands.getInterval();
	}

	static get accounts () {
		if (Commands._accounts) return Commands._accounts;
		return Commands.getAccounts();
	}
    
	static getAll () {
		let map = Array.from(All);
		return Commands._all = map;
	}

	static getBot () {
		let map = new Map(Array.from(Bot)
			.map(c => [c.title.toLowerCase(), Commands.parse(c)])
		);
		return Commands._bot = map;
	}

	static async getMessage () {
		let commands = new Map();
		let aliases = new Map();
		for (let c of Object.values(Message).flat()) {
			if (!Array.isArray(c.aliases)) continue;
			let info = Commands.parse(c);
			if (c.subcommands && c.subcommands.length > 0) {
				info.subcommands = new Map();
				for (let sc of c.subcommands) {
					for (let a of sc.aliases) {
						if (a.split(/\s/g).length < 2) info.subcommands.set(a.toLowerCase(), Commands.parse(sc, c));
						else aliases.set(a.toLowerCase(), info);
					}
				}
			}
			for (let alias of c.aliases) {
				if (alias.split(/\s/g).length < 2) commands.set(alias.toLowerCase(), info);
				else aliases.set(alias.toLowerCase(), info);
			}
		}
		let modules = fs.readdirSync(path.join('src', 'modules'));
		modules = modules.filter(m => m.startsWith('#')); // for beta where we're still using a config.json
		for (let m of modules) {
			let files = fs.readdirSync(path.join('src', 'modules', m));
			for (let f of files) try {
				let pathname = ['.', 'modules', m, f].join('/');
				let constructor = require.main.require(pathname);
				if (!constructor.prototype) throw f;
				for (let method of Object.getOwnPropertyNames(constructor.prototype)) {
					if (typeof constructor.prototype[method] !== 'function') continue;
					if (method.startsWith('#')) continue;
					aliases.set(method.toLowerCase(), {
						prefix: 'generic',
						module: m,
						file: f,
						method,
						description: 'This command is in beta'
					});
				}
			} catch (e) {
				Logger.error(e);
			}
		}
		return Commands._message = {    commands, aliases    };
	}

	static getDM () {
		let aliases = new Map();
		let regexes = new Map();
		let def;
		for (let c of Object.values(DM).flat()) {
			let info = Commands.parse(c);
			if (c.aliases) {
				for (let alias of c.aliases) {
					aliases.set(alias.toLowerCase(), info);
				}
			}
			if (c.regex) regexes.set(c.regex, info);
			if (c.default) def = info;
		}
		return Commands._dm = {    aliases, regexes, def    };
	}

	static getReaction () {
		let name = new Map();
		let key = new Map();
		for (let c of Object.values(Reaction).flat()) {
			let info = Commands.parse(c);
			if (c.name) name.set(c.name.toLowerCase(), info);
			if (c.key) key.set(c.key.toLowerCase(), info);
		}
		return Commands._reaction = {   name, key   };
	}

	static getInterval () {
		return Commands._interval = Object.entries(Interval);
	}

	static getAccounts() {
		let accounts = new Map();
		let tally = DataManager.getData();
		tally.forEach((dbuser) => {
			for (let s of Object.keys(config.sources)) {
				if (s !== 'lichess') continue;  //lichess block
				if (!dbuser[s]) continue;
				for (let account of Object.keys(dbuser[s])) {
					if (account.startsWith('_')) continue;
					accounts.set(account, dbuser.id);
				}
			}
		});
		return Commands._accounts = {    accounts    };
	}

}

module.exports = Commands;
