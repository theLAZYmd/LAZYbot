const Main = require("./main");
const DataManager = require("../../util/datamanager");
const Embed = require("../../util/embed");

class Candidates extends Main {

	constructor(message) {
		super(message);
	}

	async generate() {
		try {
			let election = this.election;
			let embed = new Embed()
				.setDescription(`Use \`${this.server.prefixes.generic}candidates sponsor\` to sponsor a candidate for an election, mentioning both channel and candidate.`)
				.setFooter(election.sponsors ? "A candidate requires " + election.sponsors + " sponsors to be included on the ballot." : "");
			let registeringBegun = this.Permissions.state("election.candidates", this);
			for (let [name, data] of Object.entries(election.elections)) {
				let arr = [], eligibles = [];
				for (let [candidate, sponsors] of Object.entries(data.candidates || {})) { //["candidate#1024", [Array: List of Sponsors]]
					let e = sponsors.length >= (election.sponsors || 0);
					arr.push(candidate + (registeringBegun ? " (" + (e ? "**" + sponsors.length + "**" : sponsors.length) + ")" : ""));
					if (e) eligibles.push(candidate.id);
				}
				embed.addField((election.type === "channel" ? "#" : "") + name + (registeringBegun ? " (" + eligibles.length + ")" : ""), arr.join("\n") || "None.", true);
			}
			embed.setTitle(`Candidates for upcoming ${election.type ? election.type + " " : ""}election${embed.fields.length > 1 ? "s" : ""} on ${this.guild.name}`)
				.setDescription(embed.fields.length === 0 ? "No upcoming elections found." : "");
			this.Output.sender(embed);
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	async handler() {
		try {
			if (!this.Permissions.state("election.candidates", this)) {
				if (this.Permissions.state("election.voting", this)) throw "Registering for candidates has closed on server " + this.guild.name + ".";
				else throw "Registering for candidates has not yet begun on server " + this.guild.name + ".";
			}
			let args = this.args, type = args[0], channel = type ? this.Search.channels.get(type) : "",
				user = this.author, election = this.election;
			if (channel) type = channel.name;
			if (args[1]) {
				if (!this.Permissions.role("owner", this)) throw "Insufficient server permissions to use this command.";
				user = this.Search.users.get(args[1]);
				if (!user) throw "Couldn't find user **" + args[1] + "**!";
			}
			if (!election.elections[type]) throw `Couldn't find election${type ? " **" + type + "**" : "" }!\nPlease use command \`${this.server.prefixes.generic}candidates\` to view list of elections.`;
			if (!election.elections[type].candidates) election.elections[type].candidates = {};
			if (!election.elections[type].voters[user.id] && !this.Permissions.role("owner", this)) throw "User **" + user.tag + "** is not a member of the electorate for election **" + type + "**.";
			return [type, user];
		} catch (e) {
			if (e) throw e;
		}
	}

	async register() {
		try {
			let election = this.election;
			let [type, user] = await this.handler();
			if (type === undefined) throw "";
			if (election.elections[type].candidates[user.tag]) throw `Already registered candidate **${user.tag}** for channel **${type}**.`;
			let channels = Main.validate(election, user, "candidates");
			if (election.limit && channels.length >= election.limit) throw `Already registered candidate **${user.tag}** for channels **${channels.join(", ")}**!\nCannot run for more than ${election.limit} channels.`;
			election.elections[type].candidates[user.tag] = []; //register it as an empty array ready to add sponsors
			this.election = election;
			this.Output.generic(`Registered candidate **${user.tag}** for election **${type}**.`)
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	async withdraw() {
		try {
			let election = this.election;
			let [type, user] = await this.handler();
			if (!election.elections[type].candidates[user.tag]) throw `**${user.tag}** has not registered as candidate for channel **${type}**.`;
			delete election.elections[type].candidates[user.tag]; //if can, then find it
			this.election = election;
			this.Output.generic(`Withdrew candidate **${user.tag}** from ballot for channel **${type}**.`)
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	async getSponsor(channel, args, argument) { //assumes the channel you are in
		try {
			let election = this.election, user = this.user;
			if (!election.elections[channel.name]) throw `Couldn't find election for channel ${channel}!\nPlease use command \`${this.server.prefixes.generic}candidates\` to view list of elections.`;
			let candidate, type = channel.name;
			if (!args[0]) candidate = this.Search.users.get(await this.Output.response({
				"description": "Please write the name of your chosen candidate to sponsor below.",
				"filter": m => this.Search.users.get(m.content)
			}));
			else candidate = this.Search.users.get(argument);
			if (!candidate) throw `**${argument}** has not registered as candidate for channel **${type}**.`;
			if (args[1]) {
				if (!this.Permissions.role("owner", this)) throw "Insufficient server permissions to use this command.";
				user = this.Search.users.get(args[1]);
				if (!user) throw "Couldn't find user **" + args[1] + "**!";
			}
			await this.runSponsor(user, type, candidate);
		} catch (e) {
			if (e) this.Output.onError(e)
		}
	}

	async sponsor() { //[channel, user]
		try {
			let [type, user] = await this.handler();
			if (type === undefined) throw "";
			let candidate = this.Search.users.get(await this.Output.response({
				"description": "Please write the name of your chosen candidate to " + this.command + " below.",
				"filter": m => this.Search.users.get(m.content)
			}));
			await this["run" + this.command.toProperCase()](user, type, candidate);
		} catch (e) {
			if (e) this.Output.onError(e)
		}
	}

	async runSponsor (user, type, candidate) {
		try {
			let election = this.election;
			if (candidate.id === user.id) throw `**${user.tag}** You may not sponsor yourself.`;
			if (!election.elections[type].candidates[candidate.tag]) throw `**${candidate.tag}** has not registered as candidate for channel **${type}**.`;
			if (!election.elections[type].voters[user.id] && !this.Permissions.role("owner", this)) throw "**" + user.tag + "** You are not a member of the electorate.\nYou may not declare sponsorship for a candidate for election **" + type + "**.";
			if (election.elections[type].candidates[candidate.tag].includes(user.id)) throw `Already registered sponsor **${user.tag}** for candidate **${candidate.tag}** in election **${type}**!`;
			for (let [c, sponsors] of Object.entries(election.elections[type].candidates)) {
				if (sponsors.includes(user.id)) throw `Already registered **${user.tag}** as sponsor for candidate **${c}** for election **${type}**.`;
			}
			election.elections[type].candidates[candidate.tag].push(user.id); //register it as an empty array ready to add sponsors
			this.election = election;
			this.Output.generic(`**${user.tag}** Registered as sponsor for **${candidate.tag}** for channel **${type}**.`)
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	async runUnsponsor (user, type, candidate) {
		try {
			let election = this.election;
			if (!election.elections[type].candidates[candidate.tag]) throw `**${candidate.tag}** has not registered as candidate for channel **${type}**.`;
			if (!election.elections[type].candidates[candidate.tag].includes(user.id)) throw `You were not registered sponsor **${user.tag}** for candidate **${candidate.tag}** in election **${type}**!`;
			election.elections[type].candidates.splice(election.elections[type].candidates.indexOf(candidate.tag), 1); //register it as an empty array ready to add sponsors
			this.election = election;
			this.Output.generic(`**${user.tag}** Unregistered as sponsor for **${candidate.tag}** for channel **${type}**.`)
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	async open() {
		this.server.states.election.candidates = true;
		DataManager.setServer(this.server);
		this.Output.generic("Opened candidate registration on server **" + this.guild.name + "**.");
	}

	async close() {
		this.server.states.election.candidates = false;
		DataManager.setServer(this.server);
		this.Output.generic("Closed candidate registration on server **" + this.guild.name + "**.");
	}

}

module.exports = Candidates;