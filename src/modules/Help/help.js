const Parse = require('../../util/parse');
const Embed = require('../../util/embed');
const DataManager = require('../../util/datamanager');
const Commands = require('../../util/commands');
const { commands, aliases  } = Commands.message;
const Package = DataManager.getFile('./package.json');
const config = require('../../config.json');

class Help extends Parse {
	constructor(message) {
		super(message);
	}

	async run(args) {
		try {
			let prefix = this.server ? this.server.prefixes.generic : '!';
			let embed = new Embed();
			switch (args.length) {
				case (0):
					return this.Output.sender(embed
						.setTitle(`${Package.name.replace('lazy', 'LAZY')}${this.isBetaBot() ? 'beta' : ''} v.${Package.version} by ${Package.author}`)
						.addField('Help on using Discord', 'Type `... discord`', false)
						.addField('View all commands', `Type \`${prefix}commands\``, false)
						.addField('Get help on an individual command', `Type \`${prefix}help commandName\` for any given command`, false)
						.addField('View the bot\'s GitHub repo', '[theLAZYmd/LAZYbot](http://bit.ly/LAZYbot)', false)
					);
				case (1): 
					if (!this.guild) throw 'Cannot use this command outside of a server.';
					this.cmdInfo = commands.get(args[0].slice(prefix.length));
					if (!this.cmdInfo) throw 'Couldn\'t find that command. Please verify that that command exists.';
					if (this.cmdInfo.active === false) throw 'This command is no longer active. Commands get removed for maintenance/safety reasons periodically.\nPlease DM <@!338772451565502474> for more information.';
					embed = ['title', 'color', 'thumbnail', 'description', 'fields', 'footer'].reduce((embed, property) => {
						embed[property] = this[property];
						return embed;
					}, {});
					return this.Output.sender(embed);
				default:
					if (!this.guild) throw new Error('Cannot use this command outside of a server.');
					throw new Error(this.Permissions.output('args'));                 
			}
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	get color() {
		return 11126483;
	}

	/**
	 * Returns the title of an embed
	 * @name Embed#title
	 * @type {string}
	 */
	get title() {
		return '`' + this.cmdInfo.aliases.map(alias => /\s| /.test(alias) ? alias : this.prefix + alias).join(' `** / **` ') + '`';
	}

	get description() {
		return this.cmdInfo.description
			.replace(/\${([a-z]+)}/gi, value => this.server.prefixes[value.match(/[a-z]+/i)]);
		//.replace(/\${generic}/gi, this.server.prefixes.generic)
		//.replace(/\${nadeko}/gi, this.server.prefixes.nadeko);
	}

	get fields() {
		let fields = [];
		if (this.cmdInfo.syntax) fields.push(['Syntax', this.cmdInfo.syntax.join(' ').bold(), false].toField());
		if (this.cmdInfo.subcommands) fields.push(['Subcommands', this.subcommands, false].toField());
		fields.push(['Usage', this.usage, false].toField());
		if (typeof this.requires === 'string' && this.requires.trim()) fields.push(['Requirements', this.requires, false].toField());
		return fields;
	}

	/**
	 * Gets information about what a certain command 'requires' to run, such as number of arguments or permissions, and outputs it
	 * @public
	 */
	get requires() {
		if (this._requires) return this._requires;
		if (!this.cmdInfo.requires) return this._requires = '';
		let array = [];
		for (let [type, value] of Object.entries(this.cmdInfo.requires)) {
			value = !Array.isArray(value) ? [value] : value;
			value = value.map((_item) => {
				let item = this.map(type, _item);
				if (typeof _item === 'undefined') return item; //if couldn't find lookup value, just use the given value
				return item;
			});
			if (value.includes('undefined')) continue;
			array.push([
				'• ' + type.toProperCase(),
				value.join(' or ')
			]);
		}
		return this._requires = array.toPairs();
	}

	/**
	 * Modified this.cmdInfo.subcommands to a map.prototype
	 * Iterate using map.prototype.entries();
	 * @returns {string}
	 */
	get subcommands() {
		if (this._subcommands) return this._subcommands;
		return this._subcommands = Array.from(this.cmdInfo.subcommands.values())
			.map((sc) => ['- `' + sc.aliases.join(' ` / ` ') + '`', sc.description])
			.toPairs();
	}

	get footer() {
		return Embed.footer('Module: ' + this.cmdInfo.module);
	}

	get usage() {
		let string = '';
		for (let alias of this.cmdInfo.aliases) {
			if (alias.split(/\s+/).length >= 2) continue;
			string += '`' + this.prefix + alias + '`\n';
		}
		if (this.cmdInfo.subcommands) {
			for (let sc of this.cmdInfo.subcommands.values()) {
				string += '`' + this.prefix + this.cmdInfo.aliases[0] + ' ' + sc.aliases[0] + '`\n';
			}
		}
		if (this.cmdInfo.usage) {
			for (let u of this.cmdInfo.usage.map(u => this.cmdInfo.aliases.inArray(u.match(/^\w+/gi)[0]) ? this.prefix + u : u)) {
				string += '`' + u + '`\n';
			}
		}
		return string;
	}

	/**
	 * A set of functions called depending on type
	 * @param {key} type Key value of the requires object
	 * @param {*} item Element of an array which made up the 'value' of a requires object
	 */
	map(type, item) {
		let user, string = '';
		switch (type) {
			case 'house':
				return `[House Discord Server](${config.urls.house}) command only.`;
			case 'user':
				if (item === 'owner') return `Bot owner only. [Active developers](${Package.contributors_page}).`;
				user = this.Search.users.get(item);
				if (user) return user;
				return '';
			case 'state':
				return item;
			case 'channels':
				return this.Search.channels.get(this.server.channels[item]);
			case 'role':
				if (item === 'owner') return '**Server owner only**.';
				return this.Search.roles.get(this.server.roles[item]);
			case 'bot':
				return undefined;
			case 'response':
				return undefined;
			case 'args':
				if (item.hasOwnProperty('length')) {
					if (!Array.isArray(item.length)) item.length = [item.length];
					for (let i in item.length)
						if (item.length[i] === '++')
							item.length[i] = 'more';
					string += '`' + item.length.join('` or `') + '` arguments';
				}
				return string;
			default:
				return undefined;
		}
	}
}

module.exports = Help;