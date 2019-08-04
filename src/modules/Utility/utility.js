const Parse = require('../../util/parse');
const Embed = require('../../util/embed');
const DataManager = require('../../util/datamanager');

class Utility extends Parse { //fairly miscelanneous functions

	async members() {
		let tally = DataManager.getData();
		this.Output.generic(`There are **${tally.length}** unique users registered to the database.`);
	}

	async ping() {
		this.Output.generic(`** ${this.author.tag}** :ping_pong: ${parseInt(this.client.ping)}ms`);
	}

	async uptime() {
		let time = Date.getTime(Date.now() - this.client.readyTimestamp);
		return this.Output.generic(`**${time.days}** days, **${time.hours}** hours, **${time.minutes}** minutes, and **${time.seconds}** seconds since ${Math.random() > 0.5 ? '**bleep bloop! It\'s showtime**' : 'last reboot'}.`);
	}

	async markdownify() {
		try {
			let msg = await this.find(this.args);
			if (!msg.content) throw 'No embeds found to JSONify!';
			this.Output.data(msg.content, this.channel, 'md');
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	async jsonify() {
		try {
			let msg = await this.find(this.args);
			if (!msg.embed) throw 'No embeds found to JSONify!';
			this.Output.data(msg.embed);
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	async fetch() {
		try {
			let msg = await this.find(this.args);
			let embed = new Embed(msg.embed || {});
			let denoter = 'Fetched Message for ' + this.author.tag;
			let timestamp = 'On ' + Date.getISOtime(msg.createdTimestamp || Date.now()) + ', user **' + msg.author.tag + '** said:';
			if (msg.content) {
				if (!/^On [a-zA-Z]{3} [a-zA-Z]{3} [0-9][0-9]? [0-9]{4} [0-9][0-9]:[0-9][0-9]:[0-9][0-9] GMT\+[0-9][0-9], user \*\*[\S \t^@#:`]{2,32}#\d{4}\*\* said:/.test(msg.content)) {
					embed.setContent(timestamp).setTitle(denoter).setDescription(msg.content.format());
				} else embed.setContent(timestamp);
			}
			else if (embed.title || embed.description || embed.fields && embed.fields.length > 1) {
				embed.setContent(timestamp);
			}
			this.Output.sender(embed);
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	/**
	 * Parses a message from a user to find or 'edit' something and returns a 'target' message
	 * @param {string[]} args 
	 */
	async find(args = this.args) {
		try {
			let channel = args[1] ? this.Search.channels.get(args[1]) : this.channel;
			if (!channel) throw 'No such channel!';
			this.message.channel = channel;			//We set through the initialising message nowadays, rather than the setter since the setter is not preserved
			let msg = await this.Search.messages.get(args[0], true);
			if (!msg) throw 'Unknown Message';
			msg.embed = msg.embeds && msg.embeds[0] ? new Embed(msg.embeds[0]) : null;
			return msg;
		} catch (e) {
			if (!e) return null;
			if (typeof e === 'string') throw e;
			let string = '**Fetch Error:** ';
			if (e.message ==='Unknown Message') throw string += 'Couldn\'t find message, check ID and channel is correct.';
			if (e.message === 'Missing Access') throw string += 'Bot doesn\'t have access to channel.';
			if (e.message.startsWith('Invalid Form Body')) throw string += 'Couldn\'t recognise ' + args[0] + ' as a valid message ID';
			throw e;
		}
	}

	/**
     * Outputs the information collected on a given user 
     * @param {UserResolvable} argument 
     * @param {*} user 
     */
	async dbuser(argument = this.argument, user = this.user) {
		try {
			if (argument) {
				if (!this.Permissions.role('admin', this)) throw this.Permissions.output('role');
				user = this.Search.users.get(argument);
				if (!user) throw new Error('Couldn\'t find user **' + argument + '** in this server');
			}
			let dbuser = this.Search.dbusers.getUser(user);
			this.Output.data(dbuser, this.channel, 'json');
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

}

module.exports = Utility;