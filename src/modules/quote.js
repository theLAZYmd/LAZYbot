const Parse = require('../util/parse');

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

module.exports = Quote;