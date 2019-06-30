const Parse = require('../util/parse');
const Logger = require('../util/logger');

class messageReactionAdd extends Parse {

	constructor (message, user) {
		super(message);
		this.messageReactionUser = user;
	}

	async left () {

	}

	async right () {

	}

	async confirm () {

	}

	async channel () {

	}

}

module.exports = async (client, messageReaction, user) => {
	try {
		if (user.bot) throw '';
		if (!messageReaction.message.user.id !== client.user.id) throw '';
		if (!messageReaction.message.guild) throw '';
		messageReaction.remove(user);
		const Reaction = new messageReactionAdd(messageReaction.message, user);
		switch (messageReaction.emoji) {
			case '⬅':
				return Reaction.left();
			case '➡':
				return Reaction.right();
			case '✅':
				return Reaction.confirm();
			case '#⃣':
				return Reaction.channel();
		}
	} catch (e) {
		if (e) Logger.error(e);
	}
};