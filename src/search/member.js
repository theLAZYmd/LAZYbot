const Search = require('../util/search');

class Member extends Search {
	constructor(message) {
		super(message);
	}

	get(searchstring, exactmode) {
		let user = this.users.get(searchstring, exactmode);
		return user ? this.byUser(user) : null;
	}

	byUser(user) {
		return this.guild.members.find(member => member.id === user.id);
	}

	getRoles(member) {
		return (member.roles || []).map(role => role.name);
	}

	getOnline() {
		return this.guild.members.filter(member => member.presence.status.match(/online|idle|dnd/));
	}

}

module.exports = Member;