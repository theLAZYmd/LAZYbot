const Parse = require('../../util/parse');
const Logger = require('../../util/logger');
const UtilityConstructor = require('../Utility/utility');
const config = require('../../config.json');

class Emoji extends Parse {
	constructor(message) {
		super(message);
		this.Utility = new UtilityConstructor(this.message);
		this.find = this.Utility.find;
	}

	async react(args) {
		let id = args.shift();
		try {
			let msg = await this.find([id]);
			if (!msg) throw '';
			this.emoji(args, msg);
			this.message.delete();
		} catch (e) {
			try {
				let user = this.Search.users.get(id);
				if (!user) throw 'Couldn\'t find a user or message matching that ID in this channel.';
				let messages = (await this.channel.fetchMessages({
					limit: 50
				})).filter(msg => msg.author.id === user.id && msg.id !== this.message.id)
					.sort((a, b) => {
						return b.createdTimestamp - a.createdTimestamp;
					});
				this.emoji(args, messages.first());
				this.message.delete();
			} catch (e) {
				if (e) this.Output.onError(e);
			}
		}
	}

	async emoji(args, message = this.message) {
		try {
			let succeeded = [],
				failed = [];
			for (let i = 0; i < args.length; i++) {
				let emoji = this.Search.emojis.get(args[i].trim());
				if (emoji.id === config.emojis.gold && this.command !== 'gild') continue;
				if (!emoji) {
					failed.push(args[i]);
					continue;
				}
				setTimeout(() => {
					message.react(emoji);
				}, i * 1000);
				succeeded.push(emoji.id);
			}
			if (this.command === 'gild') return succeeded;
			let filter = (reaction, user) => succeeded.includes(reaction.emoji.id) && !user.bot;
			let collector = message.createReactionCollector(filter, {
				time: 180000
			});
			collector.on('collect', async (reaction) => {
				try {
					await reaction.remove(this.client.user);
				} catch (e) {
					if (e) Logger.error(e);
				}
			});
			if (failed[0]) this.Output.onError('Couldn\'t find emoji ' + failed.join(', ') + '.');
			return succeeded;
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	gild(args) {
		args.push('481996881606475798');
		this.react(args);
		this.channel.send('.take 1 ' + this.author.id);
	}

}

module.exports = Emoji;