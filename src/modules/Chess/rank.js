const Leaderboard = require('./leaderboard');
const Parse = require('../../util/parse');
const Embed = require('../../util/embed');

const config = require('../../config.json');

class Rank extends Parse {

	constructor(message) {
		super(message);
	}

	async variant() {
		try {
			this.find();
			let embed = new Embed()
				.setColor(this.server.colors.ratings)
				.setTitle('House Discord Server Rankings for ' + this.dbuser.username);
			for (let source of this.sources) try { //for each source which is applicable
				this.source = source;
				let {leaderboard} = await Leaderboard.generate(this);
				if (!leaderboard || leaderboard.length === 0) throw 'Couldn\'t fetch players to form rank object.';
				if (!this.dbuser[source.key]) continue;
				let ranking = await this.parse(leaderboard, source);
				let username = this.dbuser[source.key]._main;
				let accounts = Object.keys(this.dbuser[source.key]).filter(a => !a.startsWith('_'));
				while (!username) {
					if (accounts.length === 0) break;
					username = accounts.shift();
				}
				let name = `${this.Search.emojis.get(source.key)} ${username} Rankings`;
				let value = ranking.toPairs() || '\u200b';
				let inline = true;
				embed.addField(name + ' '.repeat(Math.max(0, 18 - username.length)) + '\u200B', value, inline);
			} catch (e) {
				if (e) this.Output.onError(e);
			}
			this.Output.sender(embed);
		}

		catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	/**
	 * Assigns values to a rank instance
	 * @param {string} argument 
	 * @param {User} user 
	 * @returns {leaderboardData}
	 */
	find(argument = this.argument) {
		try {
			this.active = /-a|--active/gi.test(argument);
			this.variant = {
				name: 'MyRank',
				key: 'all'
			};
			argument = argument.replace('--active', '').replace('-a', '');
			if (argument) this.user = this.Search.users.get(argument.trim());
			if (!this.user && argument) throw 'Couldn\'t find **' + argument + '**!';
			let dbuser = this.dbuser;
			this.dbuser = dbuser;
			this.sources = Object.values(config.sources).filter(source => this.dbuser[source.key]); //applicable sources are those on the dbuser
			if (this.sources.length === 0) throw 'No linked accounts found.\nPlease link an account to your profile through `!lichess` or `!chess.com`';
			return this;
		} catch (e) {
			if (e) throw e;
		}
	}

	/**
	 * 
	 * @param {Object[]} leaderboard - The leaderboard data generated
	 * @param {Object} source - The source 
	 * @returns {string[][]} Double array of rankings ready to be convered into a leaderboard
	 */
	parse(leaderboard = [], source) {
		try {
			if (!source) throw new Error('Can\'t compute leaderboard rankings without source');
			let username = this.dbuser[source.key]._main;
			let account = this.dbuser[source.key][username];
			let accounts = Object.keys(this.dbuser[source.key]).filter(a => !a.startsWith('_'));
			while (!account) {
				if (accounts.length === 0) break;
				account = this.dbuser[source.key][accounts.shift()];
			}
			if (!account) throw new Error('Invalid main value');
			let variants = Object.values(config.variants).filter(variant => account[variant.key]);
			variants.unshift({
				key: 'maxRating',
				name: 'Overall'
			});
			let ranking = [];
			for (let variant of variants) {
				if (!account[variant.key]) continue;
				let type = variant.name === 'maxRating' ? variant.name.bold() : variant.name;
				let lb = leaderboard
					.filter(entry => {
						if (!entry.rating) return false;
						if (!entry.rating[variant.key]) return false;
						if (entry.rating[variant.key].toString().endsWith('?')) return false;
						return true;
					})
					.sort((a, b) => parseInt(b.rating[variant.key]) - parseInt(a.rating[variant.key]))
					.map(entry => entry.id);
				let rank = lb.indexOf(this.user.id);
				rank = rank !== -1 ? rank + 1 : lb.length;
				let rating = account[variant.key].toString();
				ranking.push([type, `${rating.bold()} (#${rank})`]);
			}
			return ranking;
		} catch (e) {
			if (e) throw (e);
		}
	}

}

module.exports = Rank;