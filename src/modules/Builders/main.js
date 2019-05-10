const Parse = require('../../util/parse');
const embedBuilder = require('./embedBuilder');

class Builder extends Parse{

	constructor(message) {
		super(message);
	}

	/**
	 * Initiates a new router
	 * @private
	 */
	async run (method = this.argument) {
		if (!method) {
			let options = Object.getOwnPropertyNames(Builder.prototype).filter(prop => !/^(?:run|constructor)$/.test(prop));
			let index = await this.Output.choose({
				options,
				option: 'object to begin building'
			});
			method = options[index];
		}
		await this.message.delete().catch(() => {});
		this[method]();
	}

	/**
	 * Routes the command to a new Embed Builder in that channel
	 * @private
	 */
	async embed () {
		const Instance = new embedBuilder(this.message);
		switch (this.command) {
			case ('new'):
				return Instance.build();
			case ('edit'):
				return Instance.edit();
			default:
				return this.Output.onError('Invalid command');
		}
	}
}

module.exports = Builder;