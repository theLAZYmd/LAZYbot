const Parse = require('../util/parse');
const Embed = require('../util/embed');
const Logger = require('../util/logger');

class messageReactionAdd extends Parse {

	constructor (message, user) {
		super(message);
		if (user.id !== this.quote.author) {
			for (let method of Object.getOwnPropertyNames(messageReactionAdd.prototype)) {
				if (typeof method !== 'function') continue;
				this[method] = () => {};
			}
		}
		this.quote = this.client.open[this.message.id];
		this.target = this.Search.users.byID(this.quote.target);
	}

	get usernm () {
		return this.Search.channels.byID(this.quote.channel).messages.filter(m => m.author.id === this.quote.target);
	}

	get arr () {
		if (this._arr) return this._arr;
		return this._arr = this.userm.array().sort((a, b) => b.createdTimestamp - a.createdTimestamp);
	}

	async getMessage(index) {
		const arr = this.arr;
		let m = arr[index - 1];
		this.Output.editor(new Embed(this.message.embeds[0])
			.setAuthor([
				m.author.tag,
				m.createdAt.toString().slice(0, 24),
				'#' + m.channel.name
			].join(', '), m.author.avatarURL)
			.setDescription(m.content)
		, this.message);
	}

	async left () {
		let index = this.quote.index;
		if (index < 1) index = 1;
		else if (index > this.arr.length) index = this.arr.length;
		index--;
		this.getMessage(index);
		this.client.open[this.message.id].index--;
	}

	async right () {
		let index = this.quote.index;
		if (index < 0) index = 0;
		else if (index >= this.arr.length) index = this.arr.length - 2;
		index++;
		this.getMessage(index);
		this.client.open[this.message.id].index--;
	}

	async confirm () {
		delete this.client.open[this.message.id];
		this.message.clearReactions();
	}

	async delete () {
		delete this.client.open[this.message.id];
		this.message.delete();
	}

	async channel () {
		try {
			let channel = await this.Output.response({
				description: 'Please specify a channel from which messages should be gotten',
				filter: content => this.Search.channels.get(content)
			});
			this.quote.channel = this.Seaarch.channels.get(channel).id;
			let m = this.userm.first();
			this.Output.editor(new Embed(this.message.embeds[0])
				.setAuthor([
					this.target.tag,
					m ? m.createdAt.toString().slice(0, 24) : '-',
					'#' + channel.name
				].join(', '), this.target.avatarURL)
				.setDescription(m ? m.content : '')
			, this.message);
			this.client.open[this.message.id].index = 0;
			this.client.open[this.message.id].channel = this.quote.channel;
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

}

module.exports = async (client, messageReaction, user) => {
	try {
		if (user.bot) throw '';
		if (user.id === client.user.id) throw '';
		if (messageReaction.message.author.id !== client.user.id) throw '';
		if (!messageReaction.message.guild) throw '';
		messageReaction.remove(user);
		const Reaction = new messageReactionAdd(messageReaction.message, user);
		switch (messageReaction.emoji.name) {
			case '⬅':
				return Reaction.left();
			case '➡':
				return Reaction.right();
			case '✅':
				return Reaction.confirm();
			case '❎':
				return Reaction.delete();
			case '#⃣':
				return Reaction.channel();
		}
	} catch (e) {
		if (e) Logger.error(e);
	}
};