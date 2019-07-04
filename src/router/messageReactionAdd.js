const Quote = require('./quote');
const Logger = require('../util/logger');

class messageReactionAdd extends Quote {

	constructor (message, user, messageReaction) {
		super(message);
		this.messageReaction = messageReaction;
		this.messageReactionUser = user;
		try {
			if (!this.quote) return this.Output.data(this.client.open);
			if (user.id !== this.quote.author) {
				for (let method of Object.getOwnPropertyNames(messageReactionAdd.prototype)) {
					if (typeof method !== 'function') continue;
					this[method] = () => {};
				}
				return;
			}
			if (this.client.open[this.message.id].timeout) clearTimeout(this.client.open[this.message.id].timeout);
			this.client.open[this.message.id].timeout = setTimeout(() => this.confirm(), 20000);
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}
	
	async getMessage(index) {
		let embed = await this.getEmbed(index);
		this.Output.editor(embed, this.message);
		Logger.log(['Quote', this.messageReactionUser.tag, this.target.tag, embed.description, index]);
	}

	async left () {
		const arr = await this.getArr();
		let index = this.quote.index;
		index--;
		if (index < 0) {
			index = 0;
			this.messageReaction.remove(this.messageReactionUser);
		}
		else if (index >= arr.length) index = arr.length - 1;
		this.getMessage(index);
		this.client.open[this.message.id].index--;
	}

	async right () {
		const arr = await this.getArr();
		let index = this.quote.index;
		index++;
		if (index < 0) index = 0;
		else if (index >= arr.length) {
			index = arr.length - 1;
			this.messageReaction.remove(this.messageReactionUser);
		}
		this.getMessage(index);
		this.client.open[this.message.id].index++;
	}

	async confirm () {
		delete this.client.open[this.message.id];
		if (this.message.createdTimestamp - Date.now() < 5000) {
			setTimeout(() => this.message.clearReactions(), 1500);
		} else this.message.clearReactions();
	}

	async delete () {
		delete this.client.open[this.message.id];
		this.message.delete();
	}

	async channel () {
		try {
			let c = await this.Output.response({
				author: this.messageReactionUser,
				description: 'Please specify a channel from which messages should be gotten',
				filter: m => this.Search.channels.get(m.content)
			});
			let channel = this.Search.channels.get(c);
			if (!channel.permissionsFor(this.messageReactionUser).has('VIEW_CHANNEL')) throw this.Permissions.output('role');
			this.quote.channel = channel.id;
			this.getMessage(0);
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
		const Reaction = new messageReactionAdd(messageReaction.message, user, messageReaction);
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