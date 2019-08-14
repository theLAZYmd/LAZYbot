const client = require('lichess');
const Lichess = new client();
const rp = require('request-promise');

const Parse = require('../../util/parse');
const Embed = require('../../util/embed');
const DataManager = require('../../util/datamanager');
const Logger = require('../../util/logger');
const Commands = require('../../util/commands');
const config = DataManager.getFile('./src/config.json');

/**
 * @typedef {object} TrackInput
 * @property {Parse} argsInfo
 * @property {DBuser} dbuser
 * @property {string[][]} successes
 * @property {Error[]} errors
 */
class Track {

	constructor(argsInfo, dbuser) {
		this.successes = [];
		this.errors = [];
		this.argsInfo = argsInfo;
		this._command = this.argsInfo.command;
		this.dbuser = dbuser;
	}

	/**
	 * Returns whether this Track instance was initiated by a command (true) or automatically (false)
	 * @name Track#command
	 * @type {Boolean}
	 */
	get command() {
		return Boolean(this._command);
	}

	/**
	 * Returns the list of sources for which the DBuser can validly be updated
	 * @name Track#sources
	 * @type {Array}
	 */
	get sources() {
		if (this._sources) return this._sources;
		return this._sources = Object.values(config.sources).filter(s => this.dbuser[s.key]);
	}

	/**
	 * Sets the source property of the Track instance to a source object ready to grab data from
	 * @name Track#source
	 * @param {Object} source 
	 */
	setSource(source) {
		this.source = source;
		return this;
	}

	/**
	 * Sets the username property of the Track instance to a given username
	 * @name Track#username
	 * @param {string} username 
	 */
	setUsername(username = '') {
		username = username.replace(/[^\w-]+/g, '');
		if (!username) {
			this.username = null;
			return this;
		}
		if (!username.match(/[a-z0-9][\w-]*[a-z0-9]/i)) throw new Error('Invalid syntax for a username.');
		for (let s of this.sources) {
			for (let u in this.dbuser[s.key]) {
				if (u.toLowerCase() === username.toLowerCase()) {
					username = u;
				}
			}
		}
		this.username = username;
		return this;
	}

	/**
	 * Sets a message to be edited in a command-called update embed
	 * @name Track#message
	 * @param {Message} message
	 */
	setMessage(message) {
		this.message = message;
	}

	/**
	 * Logs a new error to be outputted at the end of a Track Instance on data set
	 * @param {Error} e 
	 */
	setError(e) {
		this.errors.push(e);
		return this;
	}

	/**
	 * Confirms that a data update was successful
	 */
	setSuccess() {
		this.successes.push([this.source.key, this.username]);
		return this;
	}

	/**
	 * Edits a running embed for an update command
	 * @private
	 */
	async edit() {
		if (this.command) await this.argsInfo.Output.editor({
			description: `Updating user ${this.dbuser.username}... on **${this.source.name}**`
		}, this.message);
	}

	/**
	 * Logs the list of accounts that have been updated to the console
	 * @private
	 */
	log() {
		if (this.successes.length === 0) return this;
		Logger.command(['Tracker', 'update', 'auto', '[' + [this.dbuser.username, ...(this.successes.map(s => `${s[0]}: ${s[1]}`))].join(', ') + ']']);
		return this;
	}

	async getData() {
		let parsedData;
		if (/lichess|bughousetest/.test(this.source.key)) parsedData = await Lichess.users.get(this.username);
		else parsedData = parseChesscom(await Tracker.request(this), this);
		if (!parsedData) throw 'No response received';
		this.assign(parsedData);
		this.setSuccess();
		return this;
	}

	/**
	 * Assigns parsed data from a chess website to the properties of the user in the database. Follows on from getting data
	 * @param {LichessUser|ChesscomUser} parsedData
	 * @private
	 */
	assign(parsedData) {
		this.setUsername(parsedData.username);
		let account = this.dbuser[this.source.key] || {};
		if (!account._main) account._main = this.username;
		account[this.username] = Tracker.parseRatings(parsedData.ratings, this.source);
		if (account._main === parsedData.username) { //if it's the main one
			for (let prop of ['name', 'country', 'language', 'title', 'bio', 'language']) {
				if (parsedData[prop]) account['_' + prop] = parsedData[prop]; //grab info
				else if (account['_' + prop]) delete account['_' + prop]; //keeps it in sync - if excess data, delete it
			}
		}
		this.dbuser[this.source.key] = account;
		return this;
	}

	/**
	 * Sets the modified data for a DBuser to the database
	 * @private
	 */
	setData() {
		if (this.dbuser.lastupdate) delete this.dbuser.lastupdate;
		this.dbuser.lastUpdate = Date.now();
		this.dbuser.setData();
		return this;
	}

	/**
	 * Outputs the result of a new link or update
	 * @private
	 */
	async output() {
		try {
			const whitespace = '      \u200B';
			let errors = this.errors;
			let embed = new Embed().setColor(this.argsInfo.server.colors.ratings);
			let sources = this._command === 'update' ? this.sources : [this.source];
			for (let source of sources) {
				let accounts = this._command === 'update' ? Object.keys(this.dbuser[source.key]) : [this.username];
				for (let account of accounts) {
					if (account.startsWith('_')) continue;
					if (this.successes.every(([s, a]) => s !== source.key && a !== account)) {
						errors.push(`${this.argsInfo.Search.emojis.get(source.key)} Couldn't ${this._command === 'update' ? 'update' : 'link to'} '${account}' on ${source.name}`);
					} else embed.addField(
						`${this.argsInfo.Search.emojis.get(source.key)} ${this._command === 'update' ? 'Updated' : `Linked ${this.dbuser.username} to`} '${account}'`,
						Parse.profile(this.dbuser, source, account) + '\nCurrent highest rating is **' + this.dbuser[source.key][account].maxRating + '**' + whitespace + '\n' + Parse.ratingData(this.dbuser, source, account),
						true
					);
				}
			}
			if (embed.fields.length) await this.argsInfo.Output[this._command === 'update' ? 'editor' : 'sender'](embed, this.message);
			if (errors.length)
				for (let e of errors) this.argsInfo.Output.onError(e);
		} catch (e) {
			if (e) this.argsInfo.Output.onError(e);
		}
		return this;
	}

}

class Tracker extends Parse {

	constructor(message, guildID) {
		super(message);
		if (guildID) this.message.guild = this.Search.guilds.byID(guildID);
	}

	/**
	 * Links a user's Discord account to an account on a specific API website, so-far support for Lichess.org and Chess.com
	 * Called from {generic}lichess and {generic}chess.com commands
	 * @param {string} command 
	 */
	async run(command = this.command, dbuser = this.dbuser, username = '') {
		try {
			//Build command, dbuser, username
			switch (this.args.length) {
				case (0):
					username = this.author.username;
					break;
				case (1):
					username = this.args[0];
					break;
				default: {
					if (!this.Permissions.role('admin', this)) throw this.Permissions.output('role');
					username = this.args[0];
					let searchstring = this.argument.slice(username.length).trim();
					let user = this.Search.users.get(searchstring);
					if (!user) throw new Error('Invalid user given ' + searchstring);
					dbuser = this.Search.dbusers.getUser(user);
				}
			}
			await dbuser;
			let source = Object.values(config.sources).find(s => s.key === command.toLowerCase().replace(/\./g, ''));
			if (dbuser[source.key] && dbuser[source.key][username]) throw 'Already linked account.';
			let data = new Track(this, dbuser);
			await data.setSource(source).setUsername(username).getData();
			Commands.accounts.accounts.set(username, dbuser.id);
			data.setData().log().output();
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	/**
	 * Updates a single user on all their linked accounts
	 * @param {User} user 
	 */
	async update(dbuser = this.dbuser, user = this.user) {
		try {
			if (this.argument) {
				if (!this.Permissions.role('admin', this)) throw this.Permissions.output('role');
				user = this.Search.users.get(this.argument);
				if (!user) throw new Error('Couldn\'t find user ' + this.argument + ' in this server');
				dbuser = this.Search.dbusers.getUser(user);
			}
			if (this.user && dbuser.username !== this.user.tag) dbuser.username = user.tag;
			let data = new Track(this, dbuser);
			if (data.sources.length === 0) throw `No linked accounts found.\nPlease link an account to your profile through \`${this.generic}lichess\`, \`${this.generic}chess.com\`, or \`${this.generic}bughousetest\`.`;
			if (this.command) data.setMessage(await this.Output.generic('Updating user ' + dbuser.username + '...'));
			for (let source of data.sources) {
				data.setSource(source);
				if (data.command) await data.edit();
				for (let account of Object.keys(data.dbuser[source.key])) try {
					if (account.startsWith('_')) continue;
					await sleep(1000);
					await data.setUsername(account).getData();
					data.setUsername();
				} catch (e) {
					if (e) data.setError(e);
				}
			}
			data.setData().log();
			if (data.command) data.output();
		} catch (e) {
			if (e && this.command) this.Output.onError(e);
		}
	}

	/**
	 * Grabs the least up to date user in the database and runs them through the update process, without outputting a result
	 * @private
	 */
	async updateCycle() {
		let dbuser = this.nextUpdate();
		if (!dbuser) return Logger.info('All users are up to date.');
		this.update(dbuser);
	}

	/**
	 * Updates every single member of the database from lichess
	 * @public
	 */
	async updateAll() {
		try {
			if (!/^(?:-f|--force)$/.test(this.argument) && config.lastUpdate && Date.now() - config.lastUpdate < 3600000) return Logger[this.command ? 'error' : 'info']('Already updated all Lichess data within the last hour. Use `-f | --force` flag to update all anyway');
			const lichess = Object.values(config.sources).find(s => s.key === 'lichess');
			const accounts = Commands.accounts.accounts;
			const ids = Array.from(accounts.keys());
			let embed = new Embed()
				.setTitle(`${this.Search.emojis.get('lichess')} Beginning updates for all users`)
				.setFooter(`Updated data on 0 / ${ids.length} Lichess accounts`);
			let userObj = {};
			let DataStore = new Map();
			let msg = this.command ? await this.Output.sender(embed) : undefined;
			let users = await Lichess.users.get(ids);
			users.tap((parsedData, username) => {
				let id = accounts.get(parsedData.username);
				let dbuser = this.Search.dbusers.byID(id);
				if (!dbuser) return Logger.error([username, id]);
				let user = this.Search.users.byID(id);
				if (!user) return dbuser.left();
				let data = DataStore.get(id) || new Track(this, dbuser);
				data.setSource(lichess).setUsername(username).assign(parsedData).setSuccess();
				DataStore.set(id, data);
				if (!userObj[dbuser.username]) userObj[dbuser.username] = [];
				userObj[dbuser.username].push(parsedData.username);
			});
			let description = Object.entries(userObj).reduce((acc, [id, usernames]) => acc += `${id}: **${usernames.join('**, **')}**\n`, '');
			if (msg) await this.Output.editor(embed.setFooter(`Updated data on ${ids.length} / ${ids.length} Lichess accounts`), msg);
			await DataStore.forEach(data => data.setData());
			if (msg) await this.Output.editor(embed
				.setTitle(`${this.Search.emojis.get('lichess')} All updates successfully completed`)
				.setDescription(description.slice(0, 2048)), msg);
			Logger.data(userObj);
			Logger.command(['Tracker', 'updateAll', 'auto', [ids.length]]);
			config.lastUpdate = Date.now();
			DataManager.setFile(config, './src/config.json');
		} catch (e) {
			if (e) this.command ? this.Output.onError(e) : Logger.error(e);
		}
	}

	nextUpdate() { //Least Up-to-Date User
		let currentValue = Infinity;
		return DataManager.getData().findd((dbuser) => {
			if (dbuser.left) delete dbuser.left;
			dbuser = this.Search.dbusers.getDBuser(dbuser);
			if (Object.values(config.sources).filter(source => dbuser[source.key]).length === 0) return false; //sources
			let user = this.Search.users.byID(dbuser.id);
			if (!user) {
				return false;
			}
			if (!/online|idle|dnd/.test(user.presence.status)) return false;
			if (!dbuser.lastUpdate) return true;
			if (dbuser.lastUpdate < currentValue && dbuser.lastUpdate < Date.now() - config.delays.repeat) {
				currentValue = dbuser.lastUpdate;
				return dbuser;
			}
		});
	}

	/**
	 * Grabs JSON data from the API for all other (chess.com) sites
	 * @param {Tracker} data 
	 */
	static request(data) {
		try {
			return rp({
				uri: config.sources.chesscom.url.user.replace('|', data.username),
				json: true,
				timeout: 4000
			});
		} catch (e) {
			if (e) throw 'Either request timed out or account doesn\'t exist. If account exists, please try again in 30 seconds.';
		}
	}

	/**
	 * Transforms rating map into an object
	 * @param {RatingStore} ratingObj
	 * @private
	 */
	static parseRatings(ratingObj, source) {
		const vmap = new Map(
			Object.values(config.variants)
				.filter(v => v[source.key])
				.map(v => [v[source.key], v.key])
		);
		return Array.from(ratingObj).reduce((acc, [key, value]) => {
			if (!value.rating) return acc;
			acc[vmap.get(key)] = value.rating.toString() + (value.prov ? '?' : '');
			if (value.rating > acc.maxRating && !value.prov) acc.maxRating = value.rating;
			return acc;
		}, {
			maxRating: 0
		});
	}

	/**
	 * Creates a dialogue that allows a user to pick an account linked to their discord account and unlink it.
	 * @param {DBUser} user
	 * @prefix {generic}
	 * @public
	 */
	async remove(user = this.user) {
		try {
			//Permissions check for having a target user
			if (this.argument) {
				if (!this.Permissions.role('admin', this)) throw this.Permissions.output('role');
				user = this.Search.users.get(this.argument);
				if (!user) throw new Error('Couldn\'t find user ' + this.argument + ' in this server');
			}

			//Get the user and grab all their [source, accounts]
			let dbuser = await this.Search.dbusers.getUser(user);
			let accounts = [];
			for (let s of Object.keys(config.sources)) {
				if (!dbuser[s]) continue;
				for (let a of Object.keys(dbuser[s])) {
					if (a.startsWith('_')) continue;
					accounts.push([s, a]);
				}
			}

			//Await their choice of account
			let options = accounts.map(([source, username]) => this.Search.emojis.get(source) + ' ' + username);
			let val = await this.Output.choose({
				option: 'account to remove',
				options
			});
			
			//Delete that account
			let [source, account] = accounts[val];
			delete dbuser[source][account];
			if (dbuser[source]._main === account) {
				for (let prop of Object.keys(dbuser[source])) {
					if (prop.startsWith('_')) {
						delete dbuser[source][prop];
					} else
					if (!dbuser[source]._main) dbuser[source]._main = dbuser[source][prop];
				}
			}
			Commands.accounts.accounts.delete(account);

			//Set data and output
			dbuser.setData();
			this.Output.sender(new Embed()
				.setTitle(`Stopped tracking via ${this.prefix}remove command`)
				.setDescription(`Unlinked **${options[val]}** from ${user.tag}`)
				.setColor(config.colors.ratings)
			);
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

}

module.exports = Tracker;

function parseChesscom(chesscomData, data) {
	return {
		get ratings() {
			return new Map(
				chesscomData.stats
					.map(s => [s.key, {
						rating: s.stats.rating,
						prov: s.gameCount <= 10,
						rd: null,
						games: s.gameCount
					}])
			);
		},
		get username() {
			return data.username;
		}
	};
}

async function sleep(ms) {
	return new Promise(resolve => {
		setTimeout(resolve, ms);
	});
}