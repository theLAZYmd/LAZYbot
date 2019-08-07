const Parse = require('./parse');

/**
 * @constructor
 * Parses search resolvables by category, imperatively ex: someone might search '!profile Kyle' but equally '!profile Kyle#428' or !profile 325736595980288010'
 */
class Search extends Parse {
	constructor(message) {
		super(message);
	}

	get users() {
		const User = require('../search/user');
		return new User (this.message);
	}

	get dbusers() {
		const DBusers = require('../search/dbuser');
		return new DBusers(this.message);
	}

	get members() {
		const Member = require('../search/member');
		return new Member(this.message);
	}

	get channels() {
		const Channel = require('../search/channel');
		return new Channel(this.message);
	}

	get guilds() {
		const Guild = require('../search/guild');
		return new Guild(this.message);
	}

	get roles() {
		const Role = require('../search/role');
		return new Role(this.message);
	}

	get emojis() {
		const Emoji = require('../search/emoji');
		return new Emoji(this.message);
	}

	get messages() {
		const Message = require('../search/message');
		return new Message(this.message);
	}

	get colors() {
		const Colors = require('../search/colors');
		return new Colors();
	}
}

module.exports = Search;
