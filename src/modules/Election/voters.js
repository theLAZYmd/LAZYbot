const Main = require('./main');
const DataManager = require('../../util/datamanager');
const Search = require('../../util/search');
const Embed = require('../../util/embed');
const Logger = require('../../util/logger');

class Voters extends Main {

	constructor(message) {
		super(message);
	}

	async get() {
		try {
			let election = this.election, instance;
			if (!(await this.Permissions.state('election.register', this) || await this.Permissions.state('election.voting', this))) throw 'Registering for voters has not yet begun on server ' + this.guild.name + '.';
			if (this.channel.name !== this.server.channels.bot && await !this.Permissions.role('owner', this)) throw 'Wrong channel to use this command. Requires: #spam channel.';
			if (!Object.keys(election.elections).length === 0) throw 'No elections registered. Use `' + this.server.prefixes.generic + 'election config` to register a new election.';
			if (this.args.length === 2) {
				if (!election.elections.hasOwnProperty(this.args[1])) throw 'Couldn\'t find matching election from name **' + this.args[1] + '**.';
				instance = this.args[1];
			} else if (Object.keys(election.elections).length === 1) instance = Object.keys(election.elections)[0];
			else if (election.type === 'channel') {
				instance = await this.Output.response({
					description: 'Please state the election for which you would like to view the voting list.',
					filter: m => election.elections.hasOwnProperty(m.content)
				});
			} else instance = '';
			if (!instance) throw 'Couldn\'t find matching election. Use `' + this.server.prefixes.generic + 'election config` to configure elections.';
			let array = Object.keys(election.elections[instance].voters);
			this.Output.sender(new Embed()
				.setTitle(`Eligble voters for election ${election.type === 'channel' ? '#' : ''}${instance.toProperCase()}`)
				.setDescription(array.map(id => this.Search.users.get(id).tag || '\u200B').join('\n'))
				.setFooter(`Found ${array.length} eligible voters.`)
			);
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	async generate(msg) {
		try {
			let embed = new Embed();
			let votingBegun = this.Permissions.state('election.voting', this);
			let election = this.election;
			let registered = false;
			for (let [name, data] of Object.entries(election.elections || {})) {
				let voters = Object.keys(data.voters);
				let voted = Object.values(data.voters).filter(array => array[0]);
				if (voters.length > 0) registered = true;
				embed.addField((election.type === 'channel' ? '#' : '') + name, voters.length + ' voters ' + (votingBegun ? '(' + voted.length + ' voted)' : ''), true);
			}
			embed.setTitle(`Voters for upcoming ${election.type ? election.type + ' ' : ''}election${embed.fields.length > 1 ? 's' : ''} on ${this.guild.name}`)
				.setFooter(registered ? `Use '${this.server.prefixes.generic}voters get' to view individual voters for an election. '${this.server.prefixes.generic}h ${this.server.prefixes.generic}voters' for more info.` : `Use '${this.server.prefixes.generic}voters register' to register voters for the elections.`)
				.setDescription(embed.fields.length === 0 ? 'No upcoming elections found.' : '');
			msg ? this.Output.editor(embed, msg) : this.Output.sender(embed);
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	async register() {
		try {
			if (this.server.states.election.register === true) throw 'Voters have already been registered!';
			let msg = await this.Output.generic('Finding eligible voters... ');
			try {
				let data = {}, election = this.election;
				data = await Voters['by' + election.type.toProperCase()](election, this);
				data = await Voters.filter(data, msg, this);
				this.election = data;
				this.generate(msg);
				this.server.states.election.register = true;
				this.server.states.election.candidates = true;
				DataManager.setServer(this.server);
			} catch (e) {
				if (msg) msg.delete();
				throw e;
			}
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	async deregister() {
		try {
			if (this.server.states.election.register !== true) throw 'Voters have not yet been registered!';
			let election = this.election;
			for (let key of Object.keys(election.elections)) {
				if (this.args.length === 0 || this.args.inArray(key))
					election.elections[key] = {
						voters: {},
						candidates: {}
					};
			}
			this.generate();
			this.election = election;
			this.server.states.election.register = false;
			this.server.states.election.candidates = false;
			DataManager.setServer(this.server);
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	static async byServer(data, argsInfo) {
		try {
			let collection;
			if (data.criteria.includes('server')) collection = argsInfo.guild.members;
			else if (data.criteria.includes('role')) {
				let response = data.role.server;
				let role = argsInfo.Search.roles.get(response);
				while (!role) {
					let emsg = argsInfo.Output.onError('Couldn\'t find role **' + response + '&**.');
					response = await argsInfo.Output.response({
						description: await argsInfo.criteria === 'role-choose' ? 'Please write the name of the role to find eligible members.' : 'Please write the name of the role for the list of eligible voters.'
					});
					role = argsInfo.Search.roles.get(response);
					emsg.delete();
				}
				collection = role.members;
			} else if (data.criteria.includes('channel')) {
				let channel = argsInfo.Search.channels.byID(data.criteria);
				if (!channel) throw 'Invalid criteria given!';
				collection = channel.members;
			}
			else throw 'Invalid criteria given!';
			data.elections[argsInfo.guild.name].voters = Array.from(collection.keys());
			return data;
		} catch (e) {
			if (e) argsInfo.Output.onError(e);
			throw e;
		}
	}

	static async byChannel(data, argsInfo) {
		try {
			for (let channelName in data.elections) {
				if (!data.elections.hasOwnProperty(channelName)) continue;
				let channel = argsInfo.Search.channels.get(channelName);
				try {
					let collection;
					if (data.criteria.includes('server')) collection = argsInfo.guild.members;
					else if (data.criteria.includes('role')) {
						let response;
						if (data.criteria === 'role-identical') response = channel.name;
						else if (data.criteria === 'role-choose') response = data.role[channel.name];
						let role = argsInfo.Search.roles.get(response);
						while (!role) {
							let emsg = await argsInfo.Output.onError('Couldn\'t find role **' + response + '**.');
							response = await argsInfo.Output.response({
								description: await argsInfo.criteria === 'role-choose' ? 'Please write the name of the role for channel **' + channel + '**.' : 'Please write the name of the role for the list of eligible voters.'
							});
							role = argsInfo.Search.roles.get(response);
							emsg.delete();
						}
						collection = role.members;
					} else if (data.criteria.includes('channel')) {
						let channel = argsInfo.Search.channels.byID(data.criteria);
						if (!channel) throw 'Invalid criteria given!';
						collection = channel.members;
					} else throw 'Invalid criteria given!';
					data.elections[channel.name.toLowerCase()].voters = collection;
				} catch (e) {
					if (e) argsInfo.Output.onError(e);

				}
			}
			return data;
		} catch (e) {
			throw e;
		}
	}

	static async filter(data, msg, argsInfo) {
		try {
			for (let type in data.elections) {
				if (!data.elections.hasOwnProperty(type)) continue;
				await argsInfo.Output.editor({
					description: 'Finding eligible voters for... **' + (data.type === 'channel' ? argsInfo.Search.channels.get(type) : type) + '**'
				}, msg);
				let voters = data.elections[type].voters.filter((member) => {
					if (!data.dupes && member.roles.some(role => role.name === argsInfo.server.roles.bank)) return false;
					let dbuser = new Search().dbusers.getUser(member);
					if (!data.inactives && (Date.now() - (dbuser.messages.lastSeen || 0) > 1210000000)) return false;
					if (dbuser.messages.count < data.messages) return false;
					Logger.command(`[Register, ${type}, ${member.user.tag}]`);
					return true;
				});
				data.elections[type].voters = voters.reduce((acc, cur) => { //converts the collection to an object with keys as items and values []
					acc[cur.id] = [];
					return acc;
				}, {});
			}
			await argsInfo.Output.editor({
				description: 'Compiling voters to database... '
			}, msg);
			return data;
		} catch (e) {
			throw e;
		}
	}

	/*
	  static async compile(data) {
		try {
		  let election = {
			"elections": {}
		  };
		  for (let [property, value] of Object.entries(data)) {
			if (property !== "elections") {
			  election[property] = value;
			  continue;
			};
			for (let type in value) {
			  election.elections[type] = { //if it's a non-native property, just add it
				"voters": data.elections[type].reduce((acc, cur) => { //converts the array to an object with keys as items and values []
				  acc[cur] = [];
				  return acc
				}, {}),
				"candidates": {}
			  }
			}
		  };
		  return election;
		} catch (e) {
		  throw e;
		}
	  }
	*/
	async findChannel(argument) {
		try {
			let election = this.election;
			if (election[argument.toLowerCase()]) return argument.toLowerCase();
			let channel = this.Search.channels.get(argument);
			if (!channel || !election[channel.name.toLowerCase()]) throw '';
			return channel.name.toLowerCase();
		} catch (e) {
			throw 'Couldn\'t find channel **' + argument + '**.';
		}
	}

	async disqualify() {
		let embed = {description: ''}, count = 0, election = this.election;
		let args = (await this.Output.response({
			description: 'Please list the users to disqualify, separated by spaces.'
		})).split(/\s+/g);
		for (let arg of args) {
			try {
				let user;
				if (arg) {
					let _user = this.Search.users.get(arg);
					if (_user) user = _user;
					else throw 'Couldn\'t find user **' + arg + '.';
				} else user = this.author;
				for (let type in election.elections) {
					if (!election.hasOwnProperty(type)) continue;
					if (election.elections[type].voters[user.id]) delete election.elections[type].voters[user.id];
				}
				embed.description += user + '\n';
				count++;
			} catch (e) {
				if (e) this.Output.onError(e);

			}
		}
		this.election = election;
		embed.title = `Successfully removed the following user${count > 1 ? 's' : ''} from the ballot:`;
		if (!embed.description) embed.description = 'None.';
		this.Output.sender(embed);
	}

	async eligible(argument) {
		try {
			let user, count = 0, embed = {description: ''}, election = this.election;
			if (argument) {
				let _user = this.Search.users.get(argument);
				if (_user) user = _user;
				else throw 'Couldn\'t find user **' + argument + '.';
			} else user = this.author;
			for (let type in election.elections) {
				if (!election.elections.hasOwnProperty(type)) continue;
				if (election.elections[type].voters[user.id]) embed.description += election.type === 'channel' ? this.Search.channels.get(type) + '\n' : type + '\n';
			}
			embed.title = user.tag + ' is eligible to vote in election' + (count > 1 ? 's' : '') + ':';
			if (!embed.description) embed.description = 'None.';
			this.Output.sender(embed);
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

}

module.exports = Voters;