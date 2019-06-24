const Parse = require('../../util/parse');

class Trophy extends Parse {
	constructor(message) {
		super(message);
	}

	run(args) {
		try {
			let command = args.shift();
			if (!this[command]) throw 'Invalid function on trophy command.';
			let username = this.argument.slice(command.length).trim();
			let user = this.Search.users.get(username);
			if (!user) throw 'No user found!';
			let dbuser = this.Search.dbusers.getUser(user);
			if (!dbuser.trophy) dbuser.trophy = [];
			this[command](dbuser);
		} catch (e) {
			if (e) return this.Output.onError(e);
		}
	}

	async add(dbuser) {
		let trophy = await this.Output.response({
			description: 'Please specify name of trophy.'
		});
		if (!trophy) throw '';
		if (dbuser.trophy.includes(trophy)) return this.Output.onError('**' + dbuser.username + '** already had trophy **' + trophy + '**.');
		dbuser.trophy.push(trophy);
		this.Output.generic(`Awarded :trophy: **${trophy}** to **${dbuser.username}**!\n**${dbuser.username}** now has **${dbuser.trophy.length}** trophies.`);
		dbuser.setData();
	}

	async update(dbuser) {
		try {
			if (dbuser.trophy.length === 0) throw dbuser.username + ' has no trophies yet.';
			let index = await this.Output.choose({
				title: dbuser.username + ' has the following trophies. Please specify which to update.',
				options: dbuser.trophy
			});
			if (index === undefined) throw '';
			let oldTrophy = dbuser.trophy[index];
			let newTrophy = await this.Output.response({
				description: 'Please specify name of trophy.'
			});
			if (oldTrophy === undefined || !newTrophy === undefined) throw '';
			dbuser.trophy.splice(index, 1, newTrophy);
			this.Output.generic(`Updated :trophy: **${oldTrophy}** to :trophy: **${newTrophy}** for **${dbuser.username}**.\n**${dbuser.username}** now has **${dbuser.trophy.length}** trophies.`);
			dbuser.setData();
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	async remove(dbuser) {
		try {
			if (dbuser.trophy.length === 0) throw dbuser.username + ' has no trophies yet.';
			let index = dbuser.trophy.length === 1 ? 0 : await this.Output.choose({
				title: dbuser.username + ' has the following trophies. Please specify which to remove.',
				options: dbuser.trophy
			});
			if (!index === undefined) throw '';
			let trophy = dbuser.trophy[index];
			if (index === dbuser.trophy.length - 1) dbuser.trophy.length--;
			this.Output.generic(`Removed :trophy: **${trophy}** from **${dbuser.username}**.\n**${dbuser.username}** now has **${dbuser.trophy.length}** trophies.`);
			dbuser.setData();
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

}

module.exports = Trophy;