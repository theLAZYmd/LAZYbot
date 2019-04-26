const DataManager = require('../../util/datamanager');
const Parse = require('../../util/parse');
const Embed = require('../../util/embed');
const Logger = require('../../util/logger');
const commands = require('../../util/commands');
const client = require('lichess');
const lila = new client();

class Leaderboard extends Parse {

	constructor(message) {
		super(message);
	}

	/**
	 * Gets a leaderboard of results in a tournament on Lichess and filters them to players from the database
	 * @param {string} id - The tournamnet ID on Lichess to get
	 * @param {Number} nb - The number of players to check against the database
	 */
	async tournament(id = '', nb = 30) {
		try {
			if (!id) [id, nb = 30] = this.args;
			if (!id) throw this.Permissions.output('args');
			const data = await lila.tournaments.results(id, {nb, fetchUser: false});
			if (!data) throw 'Invalid ID, couldn\'t fetch Lichess tournament data';
			const lb = data.array().reduce((acc, user, i) => {
				let DiscordID = commands.accounts.accounts.get(user.username);
				if (DiscordID) acc.push([
					('#' + (i + 1)).bold(),
					`[${user.username}](https://lichess.org/@/${user.username}) ${this.Search.users.byID(DiscordID)} ${user.score}`
				]);
				return acc;
			}, []);
			this.Output.sender(new Embed()
				.setTitle('Lichess Tournament')
				.setURL('https://lichess.org/tournament/' + id)
				.setDescription(lb.toPairs())
			);
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	/**
	 * Sends a leaderboard to a given channel
	 * @param {Channel} channel
	 * @param {string[]} args
	 * @public
	 */
	async variant(channel, args) {
		try {
			let data = await require('../../util/variant.js')(this.message.content, channel, args, this); //variant, source, active
			data = data.variant.key === 'trivia' ? await Leaderboard.generateTrivia(data) : await Leaderboard.generate(data); //leaderboard
			if (!data.leaderboard || data.leaderboard.length === 0) throw 'Couldn\'t fetch players for **' + data.variant.name + '**.';
			let embedgroup = [];
			data.emoji = this.Search.emojis.get(data.variant.key);
			for (let i = 0; i < Math.ceil(data.leaderboard.length / 10); i++) {
				embedgroup.push(await Leaderboard.build(data, i));
			}
			this.Paginator.sender(embedgroup, 30000);
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	/**
	 * Populates leaderboard data with rankings from the database
	 * @param {leaderboardData} data
	 * @property {object} variant
	 * @property {object} source
	 * @property {Boolean} active
	 * @property {Parse} argsInfo
	 * @property {object[]} leaderboard
	 * @returns {Promise<leaderboardData>}
	 */
	static async generate(data) {
		try {
			let tally = DataManager.getData();
			data.leaderboard = [];
			for (let dbuser of tally) {
				if (data.active && dbuser.messages && Date.now() - dbuser.messages.lastSeen > 604800000) continue; //skip inactives
				if (!dbuser[data.source.key] || dbuser[data.source.key]._cheating) continue; //skip ppl not tracked on that source and cheaters
				let username = dbuser[data.source.key]._main;
				if (!username || !dbuser[data.source.key][username]) {
					Logger.error('No main registered for ' + dbuser.username + '.');
					continue; //trust that it will be fixed in updates
				}
				if (data.variant.key !== 'all' && (!dbuser[data.source.key][username][data.variant.key] || dbuser[data.source.key][username][data.variant.key].endsWith('?'))) continue;
				data.leaderboard.push({
					tag: dbuser.username,
					username: username,
					id: dbuser.id,
					rating: data.variant.key === 'all' ? dbuser[data.source.key][username] : dbuser[data.source.key][username][data.variant.key]
				});
			}
			if (data.leaderboard.length !== 0 && data.variant.key !== 'all') data.leaderboard.sort((a, b) => parseInt(b.rating) - parseInt(a.rating));
			return data;
		} catch (e) {
			if (e) throw e;
		}
	}

	static async generateTrivia(data) {
		try {
			data.leaderboard = [];
			for (let dbuser of DataManager.getData()) {
				if (data.active && Date.now() - dbuser.messages.lastSeen > 604800000) continue; //skip inactives
				if (!dbuser.trivia || dbuser.trivia.games < data.argsInfo.server.trivia.provisional) continue;
				data.leaderboard.push({
					tag: dbuser.username,
					username: dbuser.username,
					id: dbuser.id,
					rating: dbuser.trivia.rating
				});
			}
			if (data.leaderboard.length) data.leaderboard.sort((a, b) => b.rating - a.rating);
			delete data.source;
			return data;
		} catch (e) {
			if (e) throw e;
		}
	}

	static async build(data, page = 0) {
		try {
			let array = data.leaderboard.slice(10 * page, 10 * (page + 1)).map((entry) => {
				if (!data.source) return [entry.tag + ' ' + entry.rating];
				let uri = data.source.url.profile.replace('|', entry.username);
				return [`[${entry.tag}](${uri}) ${entry.rating}`];
			});
			let lbembed = array.toLeaderboard(page, 10, false); //Case 2 Leaderboard:
			lbembed.title = `${data.emoji} House leaderboard${data.source ? ' on ' + data.source.name : ''} for${data.active ? 'active ' : ' '}${data.variant.name} players`;
			return lbembed;
		} catch (e) {
			if (e) throw e;
		}
	}

}

module.exports = Leaderboard;