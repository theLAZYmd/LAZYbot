const Parse = require('../util/parse');
const Logger = require('../util/logger');

const keys = ['quote'];

class Quote extends Parse {

	constructor (message) {
		super(message);
	}

	async run (argument = this.argument) {
		try {
			let user = this.Search.users.get(argument);
			if (!user) throw 'No such user found';
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

}

module.exports = async (client, message) => {
	try {
		if (message.author.id === client.user.id) throw '';
		Object.assign(this, new Parse(message));
		try {
			if (!/[a-z]/i.test(this.content)) throw '';
			if (!this.prefix) throw '';
			if (keys.indexOf(this.command) === -1) throw '';
			const Module = new Quote(message);
			Module.run();
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	} catch (e) {
		if (e) Logger.error(e);
	}
};