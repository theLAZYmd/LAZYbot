const Search = require('../util/search');

class Role extends Search {
	constructor(message) {
		super(message);
	}

	get(searchstring) {
		let role;
		if (searchstring.length >= 2) {
			if (!role) role = this.byID(searchstring);
			if (!role) role = this.byName(searchstring);
		}
		return role;
	}

	byID(snowflake) {
		let id = snowflake.match(/[0-9]{18}/);
		return id ? this.guild.roles.find(role => id[0] === role.id) : null;
	}

	byName(name) {
		return this.guild.roles.find(role => name.toLowerCase() === role.name.toLowerCase()) || null;
	}

}

module.exports = Role;