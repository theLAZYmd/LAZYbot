const config = require('../config.json');
const Logger = require('./logger');
const Permissions = require('./permissions');

class Parse {

	constructor(message) { //everything extends to here
		this.message = message;
	}

	//Methods

	get Output() {
		if (!this._Output) {
			let OutputConstructor = require('./output.js');
			this._Output = new OutputConstructor(this.message);
		}
		return this._Output;
	}

	get Permissions() {
		if (!this._Permissions) this._Permissions = Permissions;
		return this._Permissions;
	}

	get Embeds() {
		if (!this._Paginator) {
			let EmbedsConstructor = require('../modules/Utility/embeds');
			this._Embeds = new EmbedsConstructor(this.message);
		}
		return this._Embeds;
	}
	
	get Search() {
		let SearchConstructor = require('./search.js');
		return new SearchConstructor(this.message);
	}

	get error() {
		if (!this._log) return this._log = Logger.error;
		return this._log;
	}
	
	get log() {
		if (!this._log) return this._log = Logger.log;
		return this._log;
	}

	//argsInfo

	get client() {
		if (this._client) return this._client;
		return this._client = this.message ? this.message.client : null;
	}

	get guild() {
		if (this._guild) return this._guild;
		if (!this._guild && this.member) this._guild = this.member.guild;
		if (!this._guild && this.message) this._guild = this.message.guild || this.message._guild;
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

	get prefix() {
		if (this._prefix) return this._prefix;
		return this.content.startsWith(config.prefix) ? config.prefix : '';
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