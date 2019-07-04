const Quote = require('./quote');
const Logger = require('../util/logger');

const keys = ['quote'];

class Message extends Quote {

	constructor (message) {
		super(message);
	}

	async getUser (args = this.args) {
		let user;
		if (!/\w+/i.test(args[0])) user = await this.Output.response({
			description: 'Please specify a user to quote',
			filter: content => this.Search.users.get(content)
		});
		user = this.Search.users.get(args[0]);
		if (!user) throw 'No such user found';
		return user;
	}

	async run (args = this.args) {
		try {
			if (this.author.bot) throw '';
			if (!this.prefix) throw '';
			if (keys.indexOf(this.command) === -1) throw '';
			let user = await this.getUser();
			if (!user) throw 'No such user found';
			let channel = args[1] ? (this.Search.channels.get(args[1]) || this.channel) : this.channel;
			if (!channel.permissionsFor(this.author).has('VIEW_CHANNEL')) throw this.Permissions.output('role');
			this.message.delete();
			this.quote = {
				target: user.id,
				author: this.author.id,
				index: 0,
				channel: channel.id
			};
			let embed = await this.getEmbed(0);
			if (!this.client.open) this.client.open = {};
			const msg = await this.Output.reactor(embed, this.channel, ['⬅', '➡', '✅', '❎', '#⃣']);
			this.client.open[msg.id] = this.quote;
			Logger.log(['Quote', this.author.tag, user.tag, embed.description, 0]);
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

}

module.exports = async (client, message) => {
	try {
		const Module = new Message(message);
		Module.run();
	} catch (e) {
		if (e) Logger.error(e);
	}
};