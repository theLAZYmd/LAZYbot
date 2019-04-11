const DataManager = require('./datamanager.js');
const Logger = require('../util/logger.js');
const config = require('../config.json');

/**
 * @typedef {Object} messageObject
 * @property {count} number
 * @property {lastSeen} number
 * @property {string} last
 */

/**
 * @typedef {Object} DBuser
 * @property {string} id
 * @property {string} username
 * @property {messageObject} messages
 * @deprecated
 */
class DBuser {

	constructor(dbuser) {
		for (let prop of Object.keys(dbuser)) {
			this[prop] = dbuser[prop];
		}
	}

	/**
	 * Returns the last message a DBuser said with all mentions replaced by their corresponding objects
	 * @returns {string}
	 */
	get lastMessage() {
		if (this._lastMessage) return this._lastMessage;
		if (!this.dbuser.messages.last) return '';
		let string = this.dbuser.messages.last
			.replace(/<@!?([0-9]{18})>/g, (match, p1) => '@' + this.Search.users.byID(p1).name)
			.replace(/<@&!?([0-9]{18})>/g, (match, p1) => '@' + this.Search.roles.byID(p1).name)
			.replace(/<#!?([0-9]{18})>/g, (match, p1) => '#' + this.Search.channels.byID(p1).name);
		return this._lastMessage = string.format();
	}
	
	/**
	 * Creates a new DBuser from a Discord User object
	 * @param {User} user 
	 * @returns {DBuser}
	 */
	fromUser(user) {
		let obj = {};
		obj.id = user.id,
		obj.username = user.username,
		obj.messages = {
			count: 0,
			last: user.lastMessage ? user.lastMessage.content : '',
			lastSeen: Date.now()
		};
		return new DBuser(obj);
	}
	
	setData(dbuser) {
		let tally = DataManager.getData();
		tally[this.getIndex(dbuser)] = dbuser;
		DataManager.setData(tally);
		this._data = tally;
		return true;
	}
    
}

class Search {

	constructor() {
		
	}

	get tally() {
		if (this._tally) return this._tally;
		return this._tally = DataManager.getData();
	}

	/**
     * 
     * @param {DBuserResolvable} searchstring - looks through the database and searches for a match based on Aliases, Username, ID, or index
     * @param {Boolean} exactmode 
     */
	get(searchstring, exactmode) {
		let dbuser = null;
		if (typeof searchstring === 'string') {
			if (!dbuser) dbuser = this.byAliases(searchstring, exactmode);
			if (!dbuser) dbuser = this.byUsername(searchstring);
			if (!dbuser) dbuser = this.byID(searchstring);
		} else if (typeof searchstring === 'number') {
			if (!dbuser) dbuser = this.byIndex(searchstring);
		}
		return dbuser;
	}

	getUser(user) {
		let dbuser = this.byID(user.id);
		if (dbuser) return dbuser;
		dbuser = new DBuser(user);
		let tally = this.tally;
		tally.push(dbuser);
		DataManager.setData(tally);
		Logger.log('User ' + dbuser.username + ' has been logged in the database!');
		return dbuser;
	}

	byID(snowflake) {
		let id = snowflake.match(/[0-9]{18}/);
		return id ? this.tally.find(user => id[0] === user.id) : null;
	}
	byUsername(string) {
		let tag = string.match(/[\S \t^@#:`]{2,32}#\d{4}/);
		return tag ? this.tally.find(user => tag[0].toLowerCase() === user.tag.toLowerCase()) : null;
	}

	byIndex(index) {
		if (index < 0) return null;
		return typeof index === 'number' && this.tally[index] ? this.tally[index] : null;
	}

	byAliases(alias, exactmode) {
		return this.tally.find((dbuser) => {
			for (let source of Object.keys(config.sources)) {
				if (typeof dbuser[source] === 'object') {
					for (let account of Object.keys(dbuser[source]).filter(a => !a.startsWith('_'))) {
						if (!exactmode && account.toLowerCase().startsWith(alias.toLowerCase())) return true;
						else if (exactmode && account.toLowerCase() === alias.toLowerCase()) return true;
					}
				}
			}
			return false;
		});
	}

}

module.exports = new Search();