const Parse = require('../../util/parse');
const Embed = require('../../util/embed');

class Ban extends Parse {

	constructor(message) {
		super(message);
	}

	/**
	 * Generates a fake 'ban' embed and mutes a user
	 * @requires {Role: Owner}
	 * @public
	 */
	async fake() {
		try {
			let member = await this.generate();
			member.addRole(this.Search.roles.get(this.server.roles.muted));
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	/**
	 * Bans a user
	 * @param {string[]} args
	 * @requires {Role: Owner}
	 * @public
	 */
	async real(args = this.args, argument = this.argument) {
		try {
			let member = await this.generate();
			let days = Number(args.find(a => !isNaN(Number(a)))) || 0;
			let reason = argument.replace(days.toString(), '').trim();
			member.ban({
				days,
				reason
			});
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	/**
	 * Generates a 'ban' embed
	 * @param {string[]} args 
	 */
	async generate(args = this.args) {
		if (!args[0] || !await this.Permissions.role('owner', this)) throw this.Permissions.output('role');
		let member = this.Search.members.get(args[0], true);
		if (!member) throw 'No member found!';
		this.Output.sender(new Embed()
			.setTitle('⛔️ User Banned')
			.addField('Username', member.user.tag, true)
			.addField('ID', member.user.id, true)
		);
		return member;
	}

}

module.exports = Ban;