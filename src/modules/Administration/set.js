const Parse = require('../../util/parse');
const Embed = require('../../util/embed');
const DataManager = require('../../util/datamanager');
const Package = DataManager.getFile('./package.json');
const config = DataManager.getFile('./src/config.json');

class Set extends Parse {

	constructor(message) {
		super(message);
	}

	static get get () {
		if (Set._get) return Set._get;
		return Set._get = {
			states: s => '`' + s.toString() + '`',
			prefixes: p => p.bold(),
			colors:  c => `[${c}](https://convertingcolors.com/decimal-color-${c}.html)`,
			roles: r => this.Search.roles.get(r),
			channels: c => this.Search.channels.get(c)
		};
	}

	static get set () {
		if (Set._set) return Set._set;
		return Set._set = {
			states: s => s === 'false' ? false : s === 'true' ? true : undefined,
			prefixes: p => p.toString(),
			colors: c => Number(c),
			roles: r => (this.Search.roles.get(r) || {id: undefined}).id,
			channels: c => (this.Search.channels.get(c) || {id: undefined}).id,
		};
	}
	
	static get validate () {
		if (Set._validate) return Set._validate;
		return Set._validate = {
			states: s => typeof s === 'boolean',
			prefixes: p => typeof p === 'string' && p.length === 1,
			colors:  c => !isNaN(c),
			roles: r => typeof r === 'string',
			channels: c => typeof c === 'string',
		};
	}

	/**
	 * Displays server settings
	 * @param {string} type 
	 * @public
	 */
	async generate(type = this.argument || '') {
		try {
			const types = Object.keys(Set.get);
			let server = this.server;
			if (type && !server[type]) throw `Invalid setting on server settings to view: ${type}\n${types.join(', ')}`;
			if (!type) type = types[await this.Output.choose({
				type: 'setting to view',
				options: types
			})];
			if (typeof Set.get[type] !== 'function') throw new SyntaxError('No listed getter for setting ' + type);
			let embed = new Embed().setTitle('The House Server ' + type.toProperCase());
			for (let [k, v] of Object.entries(server[type])) {
				if (typeof v === 'object') for (let [_k, _v] of Object.entries(v)) {
					embed.addField(k.toProperCase() + ' ' + _k.toProperCase(), Set.get[type](_v), true);
				} else embed.addField(k.toProperCase(), Set.get[type](v), true);
			}
			this.Output.sender(embed);
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	/**
	 * Sets a server setting
	 * @param {string} type 
	 * @param {string} key 
	 */
	async set(type = this.args[0], key = this.args[1]) {
		try {
			const types = Object.keys(Set.get);
			let server = this.server;
			if (type && !server[type]) throw `Invalid setting on server settings to view: ${type}\n${types.join(', ')}`;
			if (!type) type = types[await this.Output.choose({
				type: 'setting to edit',
				options: types
			})];
			if (typeof key === 'undefined') key = await this.Output.choose({
				type: 'server setting to edit',
				options: Object.keys(server[type]).filter(k => typeof server[type][k] !== 'object')
			});
			let value = await this.Output.response({
				description: 'Please enter a new server setting value for **' + type + '**: **' + key + '**'
			});
			value = Set.set[type](value);
			if (!Set.validate[type](value)) throw 'Invalid setting value';
			server[type][key] = value;
			this.server = server;
			this.generate(type);
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	username(args) {
		if (args.length !== 1) return;
		let newUsername = args[0];
		if (newUsername !== this.client.user.username) {
			this.client.user.setUsername(newUsername);
			this.Output.generic(`Bot username has been updated to **${newUsername}**`);
		} else this.Output.onError(`Bot username was already **${this.client.user.tag}**!`);
	}

	upversion(argument) {
		let version = Package.version.split('.', 3);
		if (!argument) version[2] = (Number(version[2]) + 1).toString();
		else if (argument.toLowerCase().includes('big')) version = [version[0], (Number(version[1]) + 1).toString(), '0'];
		else if (argument.toLowerCase().includes('huge')) version = [(Number(version[0]) + 1).toString(), '0', '0'];
		this.version(version.join('.'));
	}

	downversion(argument) {
		let version = Package.version.split('.', 3);
		if (!argument) version[2] = (Number(version[2]) - 1).toString();
		else if (argument.toLowerCase().includes('big')) version[1] = (Number(version[1]) - 1).toString();
		else if (argument.toLowerCase().includes('huge')) version[0] = (Number(version[0]) - 1).toString();
		this.version(version.join('.'));
	}

	async version(version = this.argument) {
		try {
			if (!version) return this.Output.generic(`You are using ${Package.name.replace('lazy', 'LAZY')} version **v.${Package.version}**`);
			if (!this.Permissions.role('admin', this)) throw this.Permissions.output('role');
			version = version.match(/[0-9]+.[0-9]+.[0-9]/);
			if (!version) throw 'Invalid syntax!';
			Package.version = version[0];
			DataManager.setFile(Package, './package.json');
			this.guild.me.setNickname(`${Package.name.replace('lazy', 'LAZY')}${this.client.user.id === config.ids.betabot ? 'beta' : ''} v.` + version);
			this.Output.generic(`${Package.name.replace('lazy', 'LAZY')} version has been ${this.command === 'upversion' ? 'upped' : 'modified'} to **v.${version}**!`);
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}


}

module.exports = Set;