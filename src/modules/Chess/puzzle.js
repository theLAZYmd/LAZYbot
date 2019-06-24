const client = require('lichess');
const Lichess = new client();
const rp = require('request-promise');

const Parse = require('../../util/parse');
const Embed = require('../../util/embed');
const DataManager = require('../../util/datamanager');
const config = require('../../config.json');
const FEN = require('./fen');

class P {
	constructor (imageURL, argument, channel, author) {
		this.authorid = author.id;
		this.title = `${author.tag} #${channel.name}`;
		this.description = argument || '\u200b';
		this.image = imageURL;
		this.dateAdded = Date.now();
	}
}

class Puzzle extends Parse {

	constructor(message) {
		super(message);
		this.puzzles = this.server.puzzles || [];
	}

	async daily() {
		try {
			let {fen} = await Lichess.puzzles.daily();
			let url = config.sources.lichess.url.puzzle.replace('|', 'daily');
			let fenConstructor = new FEN(this.message, `${fen} ${url}`);
			fenConstructor.run();
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	async random() {
		try {
			let {fen, id} = await Lichess.puzzles.get();
			let url = config.sources.lichess.url.puzzle.replace('|', id);
			let fenConstructor = new FEN(this.message, `${fen} ${url}`);
			fenConstructor.run();
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	async variant() {
		try {
			let {   variant   } = await require('../../util/variant')(this.message.content, this.channel, this.args, this);
			if (/^(?:chess|puzzles)$/.test(variant.key)) return this.random();
			if (!config.variants[variant.key].cvt) throw 'Invalid variant with which to summon a puzzle from [CVT](https://chessvariants.training)';
			let body = JSON.parse((await rp(config.sources.cvt.url.api.replace('|', config.variants[variant.key].cvt))).toString());
			if (!body.success) throw JSON.stringify(body, null, 4);
			if (!body.id) throw 'Not given an ID property!';
			let options = {
				method: 'POST',
				uri: config.sources.cvt.url.setup,
				headers: {
					Origin: 'https://chessvariants.training'
				},
				form: {
					id: body.id
				},
				timeout: 5000,
				json: true
			};
			let data = await rp.post(options); //success, trainingSessionId, author, fen, whoseTurn, variant, additionalInfo, authorUrl, pocket, check
			let {   fen   } = data;
			let fenConstructor = new FEN(this.message, fen + ' ' + config.sources.cvt.url.puzzle.replace('|', body.id));
			fenConstructor.run();
			return data;
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	async add(message, argument) {
		try {
			let imageURL;
			let fen = new FEN(this.message, argument);
			if (message.attachments.first()) imageURL = message.attachments.first().url;
			else if (fen.fenArray && fen.imageURL) imageURL = fen.imageURL;
			else if (/(https?:\/\/[\S\.]+\.\w+\/?)\s?/.test(argument)) imageURL = argument.match(/(https?:\/\/[\S\.]+\.\w+\/?)\s?/)[0];
			else throw 'Incorrect format! No link or image provided.';
			let puzzle = new P(imageURL, argument, this.channel, this.author);
			this.puzzles.push(puzzle);
			puzzle.content = this.Search.roles.get('puzzles') + ''; //ping puzzles when posted
			this.Output.sender(puzzle);
			this.server.puzzles = this.puzzles;
			DataManager.setServer(this.server);
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	async view(fetchboolean) {
		try {
			let embed = this.puzzles
				.map(p => [p.title, p.description])
				.toLeaderboard(0, 0, false); //generates fields probably
			embed.title = 'Active Puzzles. ' + fetchboolean ? 'Type the index of the puzzle you would like to view below.' : 'Use `!puzzle [index]` to view a puzzle.'; //informs about the await
			this.message.delete(); //deletes unnecessary command message
			this.Output.sender(embed);
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	async fetch(args) {
		try {
			if (args.length === 1) this.fetchfromindex(Number(args[0]) - 1); //if '!puzzle 0' take args[0] as index
			else {
				this.fetchfromindex(this.Output.choose({
					options: this.puzzles.map(p => p.title + ' ' + p.description),
					type: 'puzzle to view'
				}));
			}
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	async fetchfromindex(index) {
		try {
			let puzzle = this.puzzles[index];
			if (!puzzle) throw 'No puzzle found!';
			else {
				if (puzzle.content) delete puzzle.content;
				this.Output.sender(puzzle);
				this.message.delete();
			}
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	async close() {
		try {
			let index = await this.Output.choose({
				options: this.puzzles,
				type: 'puzzle to remove'
			});
			if (this.puzzles[index].authorid !== this.message.author.id) throw 'You did not create this puzzle!';
			Puzzle.stored.remove(index); //use it using array remover
			this.Output.generic(`**${this.author.tag}**: successfully closed puzzle number ${index + 1}.`);
			this.message.delete();
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

}

module.exports = Puzzle;