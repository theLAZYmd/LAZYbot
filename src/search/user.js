const Search = require('../util/search');

class User extends Search {
	constructor(message) {
		super(message);
	}

	/**
     * @typedef {string} UserResolvable
     * @param {UserResolvable} searchstring 
     * @param {boolean} exactmode 
	 * @public
     */
	get(searchstring, exactmode) {
		let user;
		if (typeof searchstring !== 'string') return null;
		if (searchstring.length >= 2) {
			if (!user) user = this.byID(searchstring);
			if (!user) user = this.byTag(searchstring);
			if (!user) user = this.byUsername(searchstring, exactmode);
			if (!user) user = this.byAliases(searchstring, exactmode);
			if (!user) user = this.byDisplayName(searchstring, exactmode);
		}
		return user;
	}

	/**
	 * @param {string} snowflake 
	 * @returns {User|null}
	 * @public
	 */
	byID(snowflake) {
		let id = snowflake.match(/[0-9]{18}/);
		return id ? this.client.users.find(user => id[0] === user.id) : null;
	}

	/**
	 * @param {string} string 
	 * @returns {User|null}
	 * @public
	 */
	byTag(string) {
		let tag = string.match(/[\S \t^@#:`]{2,32}#\d{4}/);
		return tag ? this.client.users.find(user => tag[0].toLowerCase() === user.tag.toLowerCase()) : null;
	}

	/**
	 * @param {string} string 
	 * @param {boolean} exactmode
	 * @returns {User|null}
	 * @public
	 */
	byUsername(string, exactmode) {
		let username = string.match(/[\S \t^@#:`]{2,32}/);
		if (!username) return null;
		return exactmode ? this.client.users.find(user => user.username.toLowerCase() === username[0].toLowerCase()) : this.client.users.find(user => user.username.toLowerCase().startsWith(username[0].toLowerCase()));
	}

	/**
	 * @param {string} string 
	 * @param {boolean} exactmode
	 * @returns {User|null}
	 * @public
	 */
	byAliases(searchstring, exactmode) {
		let dbuser = this.dbusers.get(searchstring, exactmode);
		return dbuser ? this.byID(dbuser.id) : '';
	}

	/**
	 * @param {string} string 
	 * @param {boolean} exactmode
	 * @returns {User|null}
	 * @public
	 */
	byDisplayName(string, exactmode) {
		let displayName = string.match(/[\S \t^@#:`]{2,32}/);
		if (!displayName) return null;
		let member = this.guild.members.find((m) => {
			if (!m.displayName) return false;
			if (exactmode && m.displayName.toLowerCase() === displayName[0].toLowerCase()) return true;
			else if (m.displayName.toLowerCase().startsWith(displayName[0].toLowerCase())) return true;
			return false;
		});
		return member ? member.user : null;
	}

}

module.exports = User;