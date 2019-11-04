const Parse = require('../../util/parse');
const DataManager = require('../../util/datamanager');

class Main extends Parse {

	constructor(message) {
		super(message);
	}

	get election() {
		if (this._election) return this._election;
		return this.guild ? DataManager.getServer(this.guild.id, './src/data/votes.json') : null;
	}

	set election(election) {
		this._election = election;
		DataManager.setServer(election, './src/data/votes.json');
		return election;
	}

	async run(args) { //router
		try {
			let command = (args.shift() || '').toLowerCase();
			command = command.toLowerCase();
			if (command && command !== 'get' && (this.command !== 'candidates' && command !== 'register') && !this.Permissions.role('admin', this)) throw this.Permissions.output('role');
			if (/^(?:status)?$/.test(command)) command = 'generate';
			if (/^reset|init$/.test(command)) command = 'initiate';
			if (typeof this[command] === 'function') this[command](); //looks for, this.register(), this.get(), this.disqualify()
			else throw 'Invalid second parameter given **' + command + '**.';
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	static validate(election, user, type = 'voters') { //returns an array of channels
		return Object.entries(election.elections) //get rid of the extra properties. if a user object is provided, check if the user is in the voters data
			.filter(([channel, data]) => data[type] && (!user || Object.keys(data[type]).includes(user[type === 'voters' ? 'id' : 'tag'])))
			.map(([channel]) => channel);
	}

}

Main.Systems = {
	fptp: '[First Past the Post](https://www.electoral-reform.org.uk/voting-systems/types-of-voting-system/first-past-the-post/)',
	irv: '[Instant Run-Off](https://en.wikipedia.org/wiki/Instant-runoff_voting#Examples)',
	stv: '[Single-Transferable Vote](https://www.electoral-reform.org.uk/voting-systems/types-of-voting-system/single-transferable-vote/)'
};

module.exports = Main;