const Parse = require('../util/parse');
const Embed = require('../util/embed');
const ModMailConstructor = require('./modmail.js');
const TicketsConstructor = require('./tickets.js');

class TypeContest extends Parse {
	constructor(message) {
		super(message);
		this.Modmail = new ModMailConstructor(message);
		this.Tickets = new TicketsConstructor(message);
	}

	async run (args, argument) {
		try {
			let [text, source] = await this.input(args, argument);
			this.Output.generic('Quote added, up for review');
			this.process(text, source);
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	async input(args, argument) {
		try {
			let index = -1;
			let invalids = argument.match(/[^a-zA-Z0-9.!?',;:"£$%~+=()\s\u200B-\u200D\uFEFF-]+/g);
			if (invalids) {
				invalids.shift();
				throw `Invalid characters **${invalids.join(' ')}**. Please reformat your quote.`;
			}
			for (let i = args.length - 1; i >= 0; i--)
				if (args[i].startsWith('-'))
					index = i;
			if (index === -1) throw 'No source provided/Incorrect format!';
			let text = args.slice(0, index).join(' ');
			let source = args.slice(index, args.length).join(' ').slice(1).trim();
			if (text.startsWith('"') && text.endsWith('"')) text = text.slice(1, -1);
			if (text.length < 265) throw 'Entry **${265 - text.length}** characters too short! Please try again.';
			if (text.length > 529) throw 'Entry **${text.length - 529}** characters too long! Please try again.';
			return [this.author, text, source];
		} catch (e) {
			if (e) throw e;
		}
	}

	async process(text, source) {
		try {
			let msg = this.Output.confirm({
				embed: new Embed()
					.setTitle('New TypeAdd, ' + this.author.tag + ', from ' + source)
					.setDescription(text)
					.setFooter('Submitted: ' + Date.getISOtime(Date.now()) + ', ' + text.length + ' characters.'),
				channel: this.Search.channels.get(this.server.channels.modmail),
				role: 'admin'
			}, true);
			TicketsConstructor.set(msg.id, {
				source,
				text,
				author: this.author,
				type: 'typeadd'
			});
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

}

module.exports = TypeContest;