const Search = require('../util/search');

class User extends Search {
	constructor(message) {
		super(message);
	}

	/**
     * @typedef {string} UserResolvable
     * @param {UserResolvable} searchstring 
     * @param {boolean} exactmode 
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

	byID(snowflake) {
		let id = snowflake.match(/[0-9]{18}/);
		return id ? this.client.users.find(user => id[0] === user.id) : null;
	}

	byTag(string) {
		let tag = string.match(/[\S \t^@#:`]{2,32}#\d{4}/);
		return tag ? this.client.users.find(user => tag[0].toLowerCase() === user.tag.toLowerCase()) : null;
	}

	byUsername(string, exactmode) {
		let username = string.match(/[\S \t^@#:`]{2,32}/);
		if (!username) return null;
		return exactmode ? this.client.users.find(user => user.username.toLowerCase() === username[0].toLowerCase()) : this.client.users.find(user => user.username.toLowerCase().startsWith(username[0].toLowerCase()));
	}

	byAliases(searchstring, exactmode) {
		let dbuser = this.dbusers.get(searchstring, exactmode);
		return dbuser ? this.byID(dbuser.id) : '';
	}

	byDisplayName(string, exactmode) {
		let displayName = string.match(/[\S \t^@#:`]{2,32}/);
		if (!displayName) return null;
		return exactmode ? this.guild.members.find(member => member.nickname && member.nickname.toLowerCase() === displayName[0].toLowerCase()) : this.guild.members.find(member => member.nickname && member.nickname.toLowerCase().startsWith(displayName[0].toLowerCase()));
	}

}

module.exports = User;