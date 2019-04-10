const Leaderboard = require('./leaderboard.js');
const Parse = require('../../util/parse.js');
const config = require('../../config.json');
const Embed = require('../../util/embed.js');
const DBuser = require('../../util/dbuser.js');

class Rank extends Parse {

	constructor(message) {
		super(message);
	}

	async variant(argument) {
		try {
			let data = await Rank.find(argument, this.author);
			let embed = new Embed()
				.setColor(this.server.colors.ratings)
				.setTitle('House Discord Server Rankings for ' + data.dbuser.username);
			for (let source of data.sources) try { //for each source which is applicable
				data.source = source;
				data = await Leaderboard.generate(data);
				if (!data.leaderboard || data.leaderboard.length === 0) throw 'Couldn\'t fetch players for variant **' + data.variant.name + '**.';
				data = await Rank.parse(Object.assign(data, {
					ranking: [],
					emoji: this.Search.emojis.get(data.variant.key),
					username: data.dbuser[source.key]._main
				}));
				let name = `${this.Search.emojis.get(source.key)} ${data.username} Rankings`;
				let value = data.ranking.toPairs();
				let inline = true;
				embed.addField(name + ' '.repeat(Math.max(0, 18 - data.username.length)) + '\u200B', value, inline);
			} catch (e) {
				if (e) this.Output.onError(e);
			}
			this.Output.sender(embed);
		}

		catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	static async find(argument, user) {
		try {
			let data = {
				active: /-a|--active/gi.test(argument),
				variant: {
					name: 'MyRank',
					key: 'all'
				},
				user: argument ? this.Search.users.get(argument) : user
			};
			if (!data.user && argument) throw 'Couldn\'t find **' + argument + '**!';
			data.dbuser = DBuser.getUser(data.user);
			data.sources = Object.values(config.sources).filter(source => data.dbuser[source.key]); //applicable sources are those on the dbuser
			if (data.sources.length === 0) throw 'No linked accounts found.\nPlease link an account to your profile through `!lichess` or `!chess.com`';
			return data;
		} catch (e) {
			if (e) throw e;
		}
	}

	static async parse(data) {
		try {
			data.account = data.dbuser[data.source.key][data.username];
			data.variants = Object.values(config.variants[data.source.key]).filter(variant => data.account[variant.key]);
			data.variants.unshift({
				key: 'maxRating',
				name: 'Overall'
			});
			for (let variant of data.variants) {
				let lb = data.leaderboard
					.filter(entry => entry.rating && entry.rating[variant.key] && !entry.rating[variant.key].toString().endsWith('?'))
					.sort((a, b) => parseInt(b.rating[variant.key]) - parseInt(a.rating[variant.key]))
					.map(entry => entry.id);
				let type = (variant.key === 'maxRating' ? '**' : '') + variant.name + (variant.key === 'maxRating' ? '**' : '');
				let rating = data.account[variant.key];
				let rank = lb.indexOf(data.user.id) + 1;
				data.ranking.push([type, '**' + rating + '** (#' + (rank ? rank : lb.length) + ')']);
			}
			return data;
		} catch (e) {
			if (e) throw (e);
		}
	}

}

module.exports = Rank;