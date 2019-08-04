const config = require('../config.json');
const DataManager = require('./datamanager.js');
const Permissions = require('./permissions.js');
const Logger = require('./logger.js');

class Parse {

	constructor(message) { //everything extends to here
		this.message = message;
	}

	//DATA

	get server() {
		if (!this.guild) return null;
		if (this._server) return this._server;
		return this._server = this.getServer();
	}
	
	set server(server) {
		DataManager.setServer(server);
		this._server = server;
	}

	getServer() {
		return DataManager.getServer(this.guild.id);
	}

	get reactionmessages() {
		if (!this._reactionmessages) if (this.guild) this._reactionmessages = DataManager.getServer(this.guild.id, './src/data/reactionmessages.json');
		return this._reactionmessages || {};
	}

	set reactionmessages(reactionmessages) {
		DataManager.setServer(reactionmessages, './src/data/reactionmessages.json');
		this._reactionmessages = reactionmessages;
	}

	//Methods

	get Output() {
		if (!this._Output) {
			let OutputConstructor = require('./output.js');
			this._Output = new OutputConstructor(this);
		}
		return this._Output;
	}

	get Permissions() {
		if (!this._Permissions) this._Permissions = Permissions;
		return this._Permissions;
	}

	get Paginator() {
		if (!this._Paginator) {
			let PaginatorConstructor = require('../modules/Utility/paginator');
			this._Paginator = new PaginatorConstructor(this);
		}
		return this._Paginator;
	}

	get Embeds() {
		if (!this._Paginator) {
			let EmbedsConstructor = require('../modules/Utility/embeds');
			this._Embeds = new EmbedsConstructor(this);
		}
		return this._Embeds;
	}

	get Search() {
		let SearchConstructor = require('./search.js');
		return new SearchConstructor(this);
	}

	get Check() {
		if (!this._Check) {
			let CheckConstructor = require('./check.js');
			return this._Check = new CheckConstructor(this);
		}
		return this._Check;
	}

	get error() {
		if (!this._log) return this._log = Logger.error;
		return this._log;
	}
	
	get log() {
		if (!this._log) return this._log = Logger.info;
		return this._log;
	}

	//argsInfo

	get client() {
		if (this._client) return this._client;
		return this._client = this.message ? this.message.client : require('../lazybot');
	}

	get guild() {
		if (this._guild) return this._guild;
		if (this.member) this._guild = this.member.guild;
		else if (this.message) this._guild = this.message.guild || this.message._guild;
		return this._guild || null;
	}

	set guild(value) {
		this._guild = value;
	}

	//Message properties
	
	get content() {
		if (this._content) return this._content;
		return this._content = !this.message || !this.message.content ? '' : this.message.content
			.replace('’', '\'')
			.replace('…', '...')
			.replace('—', '--')
			.replace('“', '"')
			.replace('”', '"')
			.replace(/[\u200B-\u200D\uFEFF]/g, '');
	}

	get author() {
		if (this._author) return this._author;
		return this._author = this.message ? this.message.author : null;
	}

	get channel() {
		if (this._channel) return this._channel;
		return this._channel = typeof this.message !== 'undefined' ? this.message.channel : null;
	}
	
	set channel(channel) {
		if (!/(?:Category|DM|Guild|News|Text|Voice)Channel/.test(channel.constructor.name)) throw new TypeError(channel.constructor.name);
		this._channel = channel;
	}

	get searchChannel() {
		if (this._searchChannel) return this._searchChannel;
		return this._searchChannel = typeof this.message !== 'undefined' ? this.message.searchChannel : null;
	}
	
	set searchChannel(channel) {
		if (!/(?:Category|DM|Guild|News|Text|Voice)Channel/.test(channel.constructor.name)) throw new TypeError(channel.constructor.name);
		this._searchChannel = channel;
	}

	get member() {
		if (this._member) return this._member;
		return this._member = this.message ? this.message.member : null;
	}

	set member(value) {
		this._member = value;
	}

	get user() {
		if (this._user) return this._user;
		return this._user = this.member ? this.member.user : null;
	}

	set user(user) {
		this._user = user;
	}

	/**
	 * @type {DBuser}
	 */
	get dbuser() {
		if (this._dbuser) return this._dbuser;
		if (!this.user) return null;
		return this.Search.dbusers.getUser(this.user);
	}

	set dbuser(dbuser) {
		this._dbuser = dbuser;
	}

	get dbindex() {
		if (!this.dbuser) return null;
		return this.dbuser.getIndex();
	}

	get prefix() {
		if (this._prefix) return this._prefix;
		return this._prefix = Array.from(this.prefixes.values()).find(p => this.content.startsWith(p)) || '';
	}
	
	get prefixes() {
		if (this._prefixes) return this._prefixes;
		let prefixes = this.server ? this.server.prefixes : {
			generic: '!',
			nadeko: '.'
		};
		return this._prefixes = new Map(Object.entries(prefixes));
	}

	get generic() {
		return this.prefixes.get('generic');
	}

	get nadeko() {
		return this.prefixes.get('nadeko');
	}

	get words() {
		if (this._words) return this._words;
		if (!this.message || !this.content) return [];
		return this._words = this.content.slice(this.prefix.length).match(/[^\s]+/gi) || [];
	}

	get command() {
		if (this._command) return this._command;
		return this._command = this.words.length > 0 ? this.words[0] : '';
	}

	get args() {
		if (this._args) return this._args;
		return this._args = this.words.length > 0 ? this.words.slice(1) : [];
	}

	get argument() {
		if (this._argument) return this._argument;
		return this._argument = this.content.slice(this.prefix.length + this.command.length + 1);
	}

	set argument(argument) {
		this._argument = argument;
	}

	get embed() {
		if (this._embed) return this._embed;
		return this.message && this.message.embeds ? this.message.embeds[0] : null;
	}

	//USEFUL FUNCTIONS

	isBetaBot() {
		return this.client.user.id === config.ids.betabot;
	}

	static ratingData(dbuser, source, username) {
		try {
			let account = dbuser[source.key][username];
			if (!account) throw 'No account found for that username!';
			return Object.values(config.variants)
				.filter(variant => variant[source.key] && account[variant.key])
				.map((variant) => [variant.name, account[variant.key].endsWith('?') ? account[variant.key] : account[variant.key].bold()])
				.toPairs();
		} catch (e) {
			if (e) throw e;
		}
	}

	static profile(dbuser, source, username) {
		return `[${username}](${(config.sources[source.key].url.profile.replace('|', username))})`;
	}

}

module.exports = Parse;