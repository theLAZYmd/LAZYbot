const Parse = require('../util/parse');
const Embed = require('../util/embed');
const Logger = require('../util/logger');
const config = require('../config.json');

const keys = ['quote'];

class Quote extends Parse {

	constructor (message) {
		super(message);
	}

	async getUser (argument = this.argument) {
		if (this.author.id === this.client.user.id) throw '';
		if (keys.indexOf(this.command) === -1) throw '';
		let user;
		if (!/[a-z]/i.test(argument)) user = await this.Output.response({
			description: 'Please specify a user to quote',
			filter: content => this.Search.users.get(content)
		});
		if (!this.prefix) throw '';
		user = this.Search.users.get(argument);
		if (!user) throw 'No such user found';
		return user;
	}

	async run () {
		try {
			let user = await this.getUser();
			if (!user) throw 'No such user found';
			this.message.delete();
			let messages = await this.channel.fetchMessages({ limit: 100 });
			let userm = messages.filter(m => m.author.id === user.id);
			let m = userm.first();
			if (!this.client.open) this.client.open = {};
			let msg = await this.Output.reactor(new Embed()
				.setColor(config.colors.background)
				.setAuthor([
					user.tag,
					m ? m.createdAt.toString().slice(0, 24) : '-',
					'#' + this.channel.name
				].join(', '), user.avatarURL)
				.setDescription(m ? m.content : '')
			, this.channel, ['⬅', '➡', '✅', '❎', '#⃣']);
			this.client.open[msg.id] = {
				target: user.id,
				author: this.author.id,
				index: 0,
				channel: this.channel.id
			};
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

}

module.exports = async (client, message) => {
	try {
		const Module = new Quote(message);
		Module.run();
	} catch (e) {
		if (e) Logger.error(e);
	}
};