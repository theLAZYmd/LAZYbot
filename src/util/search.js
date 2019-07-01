const Parse = require('./parse');
const config = require('../config.json');

/**
 * @constructor
 * Parses search resolvables by category, imperatively ex: someone might search '!profile Kyle' but equally '!profile Kyle#428' or !profile 325736595980288010'
 */
class Search extends Parse {
	constructor(message) {
		super(message);
	}

	get users() {
		return new User(this.message);
	}

	get members() {
		return new Member(this.message);
	}

	get channels() {
		return new Channel(this.message);
	}

	get guilds() {
		return new Guild(this.message);
	}

	get roles() {
		return new Role(this.message);
	}

	get emojis() {
		return new Emoji(this.message);
	}
}

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

	byDisplayName(string, exactmode) {
		let displayName = string.match(/[\S \t^@#:`]{2,32}/);
		if (!displayName) return null;
		return exactmode ? this.guild.members.find(member => member.nickname && member.nickname.toLowerCase() === displayName[0].toLowerCase()) : this.guild.members.find(member => member.nickname && member.nickname.toLowerCase().startsWith(displayName[0].toLowerCase()));
	}

}

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

class Emoji extends Search {
	constructor(message) {
		super(message);
	}

	static validate (str) {
		return /[0-9a-z]/i.test(str);
	}

	static get unicodes () {
		return ['0⃣', '1⃣', '2⃣', '3⃣', '4⃣', '5⃣', '6⃣', '7⃣', '8⃣', '9⃣', '🇦', '🇧', '🇨', '🇩', '🇪', '🇫', '🇬', '🇭', '🇮', '🇯', '🇰', '🇱', '🇲', '🇳', '🇴', '🇵', '🇶', '🇷', '🇸','🇹', '🇺', '🇻', '🇼', '🇽','🇾', '🇿'];
	}

	static get hexatrigintamals () {
		return ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
	}

	get(searchstring) {
		if (searchstring.length === 0) return null;
		let emoji;
		if (!emoji) emoji = this.byID(searchstring);
		if (!emoji) emoji = this.byName(searchstring);
		if (!emoji) emoji = this.byHextrigs(searchstring);
		if (!emoji) emoji = this.byUnicode(searchstring);
		return emoji;
	}

	byID(snowflake) {
		let id = snowflake.match(/[0-9]{18}/);
		return id ? this.client.emojis.find(emoji => id[0] === emoji.id) || '' : null;
	}

	byKey(key) {
		return config.emojis[key] ? this.byID(config.emojis[key]) : null;
	}

	byName(name) {
		return this.client.emojis.find(emoji => emoji.name.replace(/[^a-z0-9]+/gi, '').toLowerCase() === name.replace(/[^a-z0-9]+/gi, '').toLowerCase()) || '';
	}
    
	byHextrigs(hextrig) {
		if (!Emoji.validate(hextrig)) return null;
		return Emoji.unicodes[Emoji.hexatrigintamals.indexOf(hextrig)] || null;
	}

	byUnicode(searchstring) {
		let emoji = searchstring.match(/(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|[\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|[\ud83c[\ude32-\ude3a]|[\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/);
		return emoji && emoji[0] ? emoji[0] : '';
	}

}

module.exports = Search;