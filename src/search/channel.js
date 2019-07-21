const Search = require('../util/search');

class Channel extends Search {
	constructor(message) {
		super(message);
	}

	get(searchstring) {
		let channel = '';
		if (searchstring.length >= 2) {
			if (!channel) channel = this.byID(searchstring);
			if (!channel) channel = this.byName(searchstring);
		}
		return channel;
	}

	byID(snowflake) {
		let id = snowflake.match(/[0-9]{18}/);
		return id ? this.client.channels.find(channel => id[0] === channel.id) : null;
	}

	byName(name) {
		return (this.guild || this._guild).channels.find(channel => channel.name && name.replace(/[^a-z]+/gi, '').toLowerCase() === channel.name.replace(/[^a-z]+/gi, '').toLowerCase()) || null;
	}

}

module.exports = Channel;