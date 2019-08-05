const Parse = require('../../util/parse');
const DataManager = require('../../util/datamanager');
const config = require('../../config.json');
const Logger = require('../../util/logger');

class States extends Parse {

	constructor(message) {
		super(message);
	}

	au() {
		this.server.states.automaticupdates = !this.server.states.automaticupdates;
		DataManager.setServer(this.server);
	}

	tm(args) {
		if (this.client.user.id === config.ids.bot) return;
		if (!args || args.length !== 2) args = [true, true]; //default for selectivity not specified
		let [LAZYbot, bouncer] = [args[0] !== 'false', args[1] !== 'false']; //.tm true false, evaltes to [true, false]
		this.server.states.tm = !this.server.states.tm; //invert testingmode state 
		let channels = [
			this.Search.channels.get(this.server.channels.bot),
			this.Search.channels.get(this.server.channels.bot2)
		];
		for (let i = 0; i < channels.length; i++) { //selective toggle is only possible when enabling
			if (LAZYbot || !this.server.states.tm) channels[i].overwritePermissions(config.ids.bot, {
				READ_MESSAGES: this.server.states.tm ? false : null, //each set to the opposite
			});
			if (bouncer || !this.server.states.tm) channels[i].overwritePermissions(config.ids.bouncer, {
				READ_MESSAGES: this.server.states.tm ? false : null, //if testing mode is disabled, permissions are allowed
			});
		}
		DataManager.setServer(this.server);
		this.Output.sender({
			description: `**Testing mode ${this.server.states.tm ? 'enabled' : 'disabled'}.**`,
			color: this.server.states.tm ? config.colors.generic : config.colors.error
		});
	}

	async bcp(forced = false, channel = this.channel || this.Search.channels.get(this.server.channels.bot)) {
		try {
			let members = [
				this.Search.members.get(config.ids.bouncer), //bouncer member
				this.Search.members.get(config.ids.nadeko) //nadeko member
			];
			let role = this.Search.roles.get(this.server.roles.bot);
			let active = forced || members[1].roles.some(r => r.name === this.server.roles.bot); //does nadeko already have the role?
			members[active ? 0 : 1].addRole(role).catch(() => {}); //if 0, added to bouncer
			members[active ? 1 : 0].removeRole(role).catch(() => {}); //and remove from nadeko
			this.Output.generic(`**Bot Contingency Plan ${active ? 'disabled' : 'enabled'}.**`, channel);
		} catch (e) {
			if (e) Logger.error(e);
		}
	} //if so, then give it to bouncer and take it from nadeko, if not give to nadeko, take from bouncer

}

module.exports = States;