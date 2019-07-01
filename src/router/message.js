const Parse = require('../util/parse');
const Embed = require('../util/embed');
const Logger = require('../util/logger');
const config = require('../config.json');

const keys = ['quote'];

class Quote extends Parse {

	constructor (message) {
		super(message);
	}

	async run (argument = this.argument) {
		try {
			if (this.author.id === this.client.user.id) throw '';
			if (!/[a-z]/i.test(this.content)) throw '';
			if (!this.prefix) throw '';
			if (keys.indexOf(this.command) === -1) throw '';
			let user = this.Search.users.get(argument);
			if (!user) throw 'No such user found';
			this.message.delete();
			let messages = await this.channel.fetchMessages({
				limit: 100
			});
			let userm = messages.filter(m => m.author && m.author.id === user.id);
			let m = userm.first();
			if (!this.client.open) this.client.open = {};
			let msg = await this.Output.reactor(new Embed()
				.setColor(config.colors.background)
				.setAuthor([
					user.tag,
					m ? m.createdAt.toString().slice(0, 24) : '-',
					'#' + this.name
				].join(', '), user.avatarURL)
				.setDescription(m ? m.content : '')
			, this.channel, ['⬅', '➡', '✅', '#⃣']);
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