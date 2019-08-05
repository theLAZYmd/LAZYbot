const Parse = require('../../util/parse');
const Embed = require('../../util/embed');

class MessageCount extends Parse {

	constructor(message) {
		super(message);
	}

	/**
     * Ups the message count for a given user stored in the database
     * @private
     */
	async count(dbuser = this.dbuser) { //section for message logging
		try {
			dbuser.messages.count++;
			dbuser.setData();
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	/**
     * Stores the last message a user has written
     * @private
     */
	async log() {
		try {
			let dbuser = this.dbuser;
			dbuser.messages.last = this.content.length > 500 ? this.content.slice(0, 500).replace('`', '') + '...' : this.content.replace(/`/g, '');
			dbuser.messages.lastSeen = this.message.createdTimestamp;
			if (dbuser.username !== this.author.tag) dbuser.username = this.author.tag;
			dbuser.setData();
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	/**
     * Parses a string and number combination to update the message.count of the user found from that string with that number
     * @param {User} user - A discord user
     * @param {string[]} args - A list of searchResolvable variables
     * @public
     */
	async update(user = this.author, args = this.args) {
		try {
			let number;
			for (let a of args) {
				if (!isNaN(Number(a))) number = Number(a);
				else {
					let _user = this.Search.users.get(a);
					if (_user) user = _user;
					else throw this.Permissions.output('args');
				}
			}
			let dbuser = this.Search.dbusers.getUser(user);
			dbuser.messages.count = number;
			dbuser.setData();
			this.Output.generic(`Message count for **${user.tag}** is now **${dbuser.messages.count.toLocaleString()}** messages.`);
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	/**
     * Outputs the number of messages a user has sent
     * @public
     * @param {string[]} args 
     * @param {User} user 
     */
	async get(args, user = this.user) {
		try {
			if (args.length > 1) throw this.Permissions.output('args');
			if (args.length === 1) { //!messages titsinablender
				user = this.Search.users.get(args[0]);
				if (!user) throw 'Couldn\'t find user!';
			}
			let dbuser = await this.Search.dbusers.getUser(user);
			this.Output.generic(`**${user.tag}** has sent **${dbuser.messages.count.toLocaleString()}** messages.`);
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	/**
     * Outputs the last message a user has sent
     * @public
     * @param {string} argument 
     */
	async last(argument) {
		try {
			let user = this.author;
			if (argument) user = this.Search.users.get(argument);
			if (!user) throw 'Couldn\'t find user **' + argument + '**!';
			let dbuser = this.Search.dbusers.getUser(user);
			if (!dbuser.messages.last) throw 'Last message was not logged for user **' + user.tag + '**.';
			this.Output.sender(new Embed()
				.setTitle('Last Message of ' + user.tag + '\n')
				.setDescription(dbuser.messages.last.format())
			);
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

}

module.exports = MessageCount;