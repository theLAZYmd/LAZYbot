const Main = require('./main');
const Config = require('./config');
const DataManager = require('../../util/datamanager');
const Embed = require('../../util/embed');
const config = require('../../config.json');

class Election extends Main {

	constructor(message) {
		super(message);
		this.properties = [ //default settings
			['date', Date.getMonth(Date.now()), 'Date'],
			['system', 'irv', 'Voting System', key => Main.Systems[key]],
			['type', 'server', 'Type of election'],
			['criteria', 'Everyone in the server', 'Electorate list'],
			['inactives', true, 'Inactive members voting', boolean => boolean.toString()],
			['dupes', true, 'Dupe members voting', boolean => boolean.toString()],
			['messages', 100, 'Required messages'],
			['sponsors', 3, 'Required sponsors'],
			['limit', 1, 'Running limit'],
			['elections', {
				server: {
					voters: {},
					candidates: {}
				}
			}, 'Elections', obj => '**' + Object.keys(obj).join('**\t|\t**') + '**'],
			['role', undefined, 'Corresponding role for voters']
		];
	}

	async generate(init) {
		try {
			let election = this.election;
			let emoji = this.Search.emojis.get(this.server.emoji);
			let embed = new Embed().setTitle((emoji ? emoji + ' ' : '') + 'Information for upcoming ' + (election._type ? election._type + ' ' : '') + 'election' + (election._type !== 'server' ? 's' : '') + ' on ' + this.guild.name);
			let value = ((states) => {
				if (typeof states !== 'object') return '\u200b';
				if (!election.type) return 'Election has not yet been initiated.';
				if (!states.register) return 'Voters have not yet been registered.';
				let string = 'Voters have been registered.\n';
				if (states.candidates) return string += 'Candidates are being registered.';
				if (states.voting) return string = 'Voting is currently taking place! Check your DMs.\nUse `' + this.server.prefixes.generic + 'eligible` to check for which channels you are eligible to vote.';
				if (states.results) return string = 'Results have been announced! Use `' + this.server.prefixes.generic + 'results` to view the results.';
				if (states.count) return string = 'Votes have been counted. Awaiting results announcement...';
				return string += 'Awaiting initialisation of candidate registration...';
			});
			embed.addField('Status', value(this.server.states.election), false);
			for (let [property, , name, f] of this.properties) {
				if (election[property] === undefined) continue;
				let value = typeof f === 'function' ? f(election[property]) : election[property];
				if (typeof election[property] === 'object') {
					if (Object.keys(election[property]).length > 2)
						while ((embed.fields.length - 1) % 3 !== 0 && embed.fields[embed.fields.length - 1].inline === true) embed.addBlankField(true);
					embed.addField(name, value, Object.keys(election[property]).length < 2);
				} else
				if (value !== undefined) embed.addField(name, value, true);
			}
			if (init) { //if this method was called from this.initiate() or this.config()
				embed.setFooter('Verify and set these values?');
				let set = await this.Output.confirm({
					embed,
					editor: typeof init === 'object' ? init : '',
					autodelete: false
				}, true);
				let msg = this.guild.me.lastMessage; //workround
				if (set) {
					embed.setFooter('');
					this.Output.editor(embed, msg);
					election.url = msg.url;
					this.election = election;
				}
				return !set;
			} else {
				if (embed.fields.length === 0) embed.setDescription('No upcoming election data found!');
				this.Output.sender(embed);
				return false;
			}
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	async initiate() {
		try {
			if (!this.message.content.includes('reset') && this.election.type) throw 'Election has already been initiated on server **' + this.guild.name + '**.';
			await this.Output.confirm();
			let election = this.election;
			for (let [property, value] of this.properties)
				election[property] = value;
			this.election = election;
			let msg = await this.generate(true);
			if (msg) this.config(msg);
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	async clear() {
		try {
			await this.Output.confirm();
			if (this.args[1]) {
				let guild = this.Search.guilds.get(this.args[1]) || '';
				if (!guild) throw 'Couldn\'t find guild';
				if (this.guild.id !== guild.id && !config.ids.owner.includes(this.author.id)) throw 'Insufficient server permissions to use this command.';
				this.guild = guild;
			}
			if (!this.election.type) throw 'No voting data found.';
			this.election = {
				_id: this.guild.id
			};
			for (let state of Object.keys(this.server.states.election)) {
				this.server.states.election[state] = false;
			}
			DataManager.setServer(this.server);
			this.Output.generic('Cleared voting data for server **' + (this.guild.name) + '**.');
		} catch (e) {
			if (e) this.Output.onError('**Couldn\'t clear voting data on server ' + (this.guild.name) + '**: ' + e);
		}
	}

	async config(msg = true) {
		try {
			let election = this.election,
				args = this.args.slice(1),
				data = {};
			if (args.length !== 0)
				for (let type in election) {
					if (!election.hasOwnProperty(type) || args.inArray(type)) continue;
					data[type] = election[type];
				}
			do {
				let econfig = new Config(data, this);
				for (let [property, def] of this.properties) {
					if (args.length > 0 && !args.inArray(property)) continue;
					let value = await econfig[property];
					if (value === undefined) value = def;
					election[property] = value;
				}
				args = [];
				data = {};
				this.election = election;
				msg = await this.generate(msg);
			} while (msg);
			this.server.states.election.register = false;
			DataManager.setServer(this.server);
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

}

module.exports = Election;