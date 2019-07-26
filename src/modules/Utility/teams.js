const Parse = require('../../util/parse');
const Embed = require('../../util/embed');

class Teams extends Parse { //fairly miscelanneous functions

	constructor (message) {
		super(message);
	}

	/**
	 * Registers a new Team based on user nicknames
	 * @param {string} teamName 
	 * @public
	 */
	async register (argument = this.argument) {
		try {
			if (!this.Permissions.role('admin', this)) throw this.Permissions.output.role;
			let server = this.server;
			if (!server.teams) server.teams = {};
			if (!argument) argument = await this.Output.response({
				description: 'Please specify a new team name'
			});
			if (Object.keys(server.teams).map(t => t.toLowerCase()).includes(argument)) throw 'Team already registered!';
			let prefix = await this.Output.response({
				description: 'Please specify a prefix that will denote a team'
			});
			await this.Output.confirm({
				action: 'new team name ' + argument.bold() + ', prefix: ' + prefix
			});
			server.teams[argument] = prefix;
			this.server = server;
			this.list();
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	/**
	 * Returns a list of teams in the server based on username starting phrases
	 * @public
	 */
	async list (all = /-a|-all/.test(this.argument)) {
		try {
			let embed = new Embed();
			embed.setTitle('👥 List of registered teams on The House');
			for (let [name, t] of Object.entries(this.server.teams || {})) {
				let team = this.guild.members.filter(m => m.displayName.toLowerCase().startsWith(t.toLowerCase())).array();
				if (all) embed.addField(name + ' (' + team.length + ')', team.join('\n'), true);
				else embed.addField(name, team.length, true);
			}
			embed.fields = embed.fields.sort((a, b) => all ? b.value.split('\n').length - a.value.split('\n').length : b.value - a.value);
			this.Output.sender(embed);
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}
	
	/**
	 * Provides a mechanism to remove an item from the team registry
	 * @public
	 */
	async remove(argument = this.argument) {
		try {
			if (!this.Permissions.role('admin', this)) throw this.Permissions.output.role;
			let server = this.server;
			let keys = Object.keys(server.teams);
			let index = keys.map(t => t.toLowerCase()).indexOf(argument.toLowerCase());
			if (index < 0) index = await this.Output.choose({
				options: keys,
				type: 'team name to remove'
			});
			if (typeof index !== 'number' || index < 0 || index >= keys.length) throw new RangeError(index);
			delete server.teams[keys[index]];
			this.server = server;
			this.list();
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}


}

module.exports = Teams;