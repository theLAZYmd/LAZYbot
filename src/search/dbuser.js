const Search = require('../util/search');
const DataManager = require('../util/datamanager');
const Logger = require('../util/logger');
const config = require('../config.json');

class DBusers extends Search {

	constructor() {
		super();
	}

	get tally() {
		return DataManager.getData();
	}

	/**
     * Looks through the database and searches for a match based on Aliases, Username, ID, or index
     * @param {DBuserResolvable} searchstring
     * @param {Boolean} exactmode
	 * @returns {DBuser}
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
		return dbuser ? new DBuser(dbuser) : dbuser;
	}

	/**
	 * Gets a DBuser from a Discord user or member, based on an ID property. If none found, creates a new one.
	 * @param {Member|User} user 
	 * @type {DBuser}
	 */
	getUser(user) {
		let dbuser = this.byID(user.id);
		if (dbuser) return dbuser;
		else return new DBuser().joined(user);
	}

	/**
	 * Converts a dbuser object into a dbuser instance
	 * @param {Object} dbuser
	 * @type {DBuser}
	 */
	getDBuser(dbuser) {
		return dbuser ? new DBuser(dbuser) : null;
	}

	/**
	 * Returns the index of a dbuser in the array of the database
	 * @param {DBuser} dbuser
	 */
	getIndex(dbuser) {
		return this.tally.map(dbuser => dbuser.id).indexOf(dbuser.id);
	}    

	/**
	 * Finds a dbuser by its Discord ID
	 * @param {string} snowflake 
	 * @returns {DBuser}
	 */
	byID(snowflake) {
		let id = snowflake.match(/[0-9]{18}/);
		if (!id) return null;
		let dbuser = this.tally.find(user => id[0] === user.id);
		return dbuser ? new DBuser(dbuser) : dbuser;
	}

	/**
	 * Finds a dbuser by its Discord username
	 * @param {string} string 
	 * @returns {DBuser}
	 */
	byUsername(string) {
		let tag = string.match(/[\S \t^@#:`]{2,32}#\d{4}/);
		if (!tag) return null;
		let dbuser = this.tally.find(user => tag[0].toLowerCase() === user.tag.toLowerCase());
		return dbuser ? new DBuser(dbuser) : dbuser;
	}

	/**
	 * Finds a dbuser by its index in the database
	 * @param {number} index 
	 * @returns {DBuser}
	 */
	byIndex(index) {
		if (typeof index !== 'number' || index < 0) return null;
		let dbuser = this.tally[index];
		return dbuser ? new DBuser(dbuser) : dbuser;
	}

	/**
	 * Finds a dbuser by its alias of a linked account
	 * @param {alias} string 
	 * @param {Boolean} exactmode
	 * @returns {DBuser}
	 */
	byAliases(alias, exactmode) {
		let dbuser = this.tally.find((dbuser) => {
			for (let source of Object.keys(config.sources)) {
				if (!dbuser[source]) continue;
				for (let account of Object.keys(dbuser[source])) {
					if (account.startsWith('_')) continue;
					if (!exactmode && account.toLowerCase().startsWith(alias.toLowerCase())) return true;
					else if (exactmode && account.toLowerCase() === alias.toLowerCase()) return true;
				}
			}
			return false;
		});
		return dbuser ? new DBuser(dbuser) : dbuser;
	}

}

module.exports = DBusers;

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
 */
class DBuser {

	constructor(dbuser) {
		if (!dbuser) return dbuser;
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
     * Returns a dbuser object
     * @returns {DBuser}
     */
	get() {
		return this;
	}
	
	/**
	 * Creates a new DBuser from a Discord User object
	 * @param {User} user 
	 * @returns {DBuser}
	 */
	fromUser(user) {
		let obj = {};
		obj.id = user.id,
		obj.username = user.tag,
		obj.messages = {
			count: 0,
			last: user.lastMessage ? user.lastMessage.content : '',
			lastSeen: Date.now()
		};
		return new DBuser(obj);
	}
	
	/**
	 * Sets the data in the database
	 * @param {DBuser} dbuser 
	 */
	setData() {
		let index = this.getIndex();
		if (!this.username || !this.id) return console.error(this);
		if (this.hasOwnProperty('lastMessage')) delete this.lastMessage;
		if (this.hasOwnProperty('lastmessage')) delete this.lastmessage;
		let tally = DataManager.getData();
		tally[index] = this;
		DataManager.setData(tally);
	}
	

	/**
	 * Returns the index of a dbuser in the array of the database
	 * @returns {number}
	 */
	getIndex() {
		let tally = DataManager.getData();
		return tally.map(dbuser => dbuser.id).indexOf(this.id);
	}

	/**
	 * Deletes a 'left' property on the DBuser if there was one
	 * @param {User} user
	 * @returns {DBuser}
	 */
	joined(user) {
		if (!user) return this;
		let dbuser = this.fromUser(user);
		let tally = DataManager.getData();
		tally.push(dbuser);
		DataManager.setData(tally);
		Logger.info(`User ${dbuser.username} has been logged in the database!`);
		return dbuser;
	}

	/**
	 * Sets a 'left' property on the DBuser
	 * @returns {DBuser}
	 */
	left() {
		let tally = DataManager.getData();
		let index = this.getIndex();
		tally.splice(index, 1);
		DataManager.setData(tally);
		return null;
	}
    
}