const Search = require('../util/search');

class Guild extends Search {
	constructor(message) {
		super(message);
	}

	get(searchstring) {
		let guild = '';
		if (searchstring.length >= 2) {
			if (!guild) guild = this.byID(searchstring);
			if (!guild) guild = this.byName(searchstring);
		}
		return guild;
	}

	byID(snowflake) {
		let id = snowflake.match(/[0-9]{18}/);
		return id ? this.client.guilds.find(guild => id[0] === guild.id) : null;
	}

	byName(name) {
		return this.client.guilds.find(guild => guild.name && name.toLowerCase() === guild.name.toLowerCase()) || null;
	}

}

module.exports = Guild;