const config = require('../../config.json');
const DataManager = require('../../util/datamanager.js');
const Parse = require('../../util/parse.js');
const Embed = require('../../util/embed.js');
const Permissions = require('../../util/permissions.js');
const Logger = require('../../util/logger.js');

class Leaderboard extends Parse {

	constructor(message) {
		super(message);
	}

	async variant(channel, args) {
		try {
			let data = await require('../../util/variant.js')(this.message.content, channel, args, this); //variant, source, active
			data = data.variant.key === 'trivia' ? await Leaderboard.generateTrivia(data) : await Leaderboard.generate(data); //leaderboard
			if (!data.leaderboard || data.leaderboard.length === 0) throw 'Couldn\'t fetch players for **' + data.variant.name + '**.';
			let embedgroup = [];
			data.emoji = this.Search.emojis.get(data.variant.key);
			console.log(data.leaderboard.length);
			for (let i = 0; i < Math.ceil(data.leaderboard.length / 10); i++) {
				embedgroup.push(await Leaderboard.build(data, i));
			}
			this.Paginator.sender(embedgroup, 30000);
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	static async generate(data) {
		try {
			let tally = DataManager.getData();
			data.leaderboard = [];
			for (let dbuser of tally) {
				if (dbuser.left) continue; //skip ppl who have left
				if (data.active && Date.now() - dbuser.messages.lastSeen > 604800000) continue; //skip inactives
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
				if (dbuser.left) continue; //skip ppl who have left
				if (data.active && Date.now() - dbuser.messages.lastSeen > 604800000) continue; //skip inactives
				if (!dbuser.trivia || dbuser.trivia.games < data.argsInfo.server.trivia.provisional) continue;
				data.leaderboard.push({
					tag: dbuser.username,
					username: dbuser.username,
					id: dbuser.id,
					rating: dbuser.trivia.rating
				});
			}
			if (data.leaderboard.length) data.leaderboard.sort((a, b) => parseInt(b.rating) - parseInt(a.rating));
			delete data.source;
			return data;
		} catch (e) {
			if (e) throw e;
		}
	}

	static async build(data, page = 0) {
		try {
			let array = data.leaderboard.slice(10 * page, 10 * (page + 1)).map((entry) => {
				if (data.source) {
					let urllink = data.source.url.profile.replace('|', entry.username); //lichess.org/@/V2chess
					return ['[' + entry.tag + '](' + urllink + ') ' + entry.rating];
				} else {
					return [entry.tag + ' ' + entry.rating];
				}
			});
			console.log(array);
			let lbembed = array.toLeaderboard(page, 10, false); //Case 2 Leaderboard:
			lbembed.title = `${data.emoji} House leaderboard${data.source ? ' on ' + data.source.name : ''} for${data.active ? 'active ' : ' '}${data.variant.name} players`;
			return lbembed;
		} catch (e) {
			if (e) throw e;
		}
	}

}

module.exports = Leaderboard;