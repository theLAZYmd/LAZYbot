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
			if ((server.teams || []).map(t => t.toLowerCase()).includes(argument)) throw 'Team already registered!';
			await this.Output.confirm({
				action: 'new team name ' + argument.bold()
			});
			if (server.teams) server.teams.push(argument);
			else server.teams = [argument]; 
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
			for (let t of this.server.teams || []) {
				let team = this.guild.members.array().filter(m => m.displayName.toLowerCase().startsWith(t.toLowerCase()));
				if (all) embed.addField(t + ' (' + team.length + ')', team.join('\n'), true);
				else embed.addField(t, team.length, true);
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
			let index = server.teams.map(t => t.toLowerCase()).indexOf(argument.toLowerCase());
			if (index < 0) index = await this.Output.choose({
				options: server.teams,
				type: 'team name to remove'
			});
			if (typeof index !== 'number' || index < 0 || index >= Object.keys(server.teams).length) throw new RangeError(index);
			server.teams.remove(index);
			this.server = server;
			this.list();
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}


}

module.exports = Teams;