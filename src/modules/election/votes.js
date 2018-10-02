const Main = require("./main.js");
const Embed = require("../../util/embed.js");
const DataManager = require("../../util/datamanager.js");
const Permissions = require("../../util/permissions.js");

class Votes extends Main {

	constructor(message) {
		super(message)
	}

	async open() {
		try {
			if (!Permissions.state("election.register", this)) throw "Cannot initiate voting without voter registration.";
			if (Permissions.state("election.candidates", this)) throw "Cannot initiate voting while candidate registration is still open.";
			this.server.states.election.voting = true;
			DataManager.setServer(this.server);
			this.Output.generic("Opened voting on server **" + this.guild.name + "**.");
		} catch (e) {
			if (e) this.Output.onError(e)
		}
	}

	async close() {
		this.server.states.election.voting = false;
		DataManager.setServer(this.server);
		this.Output.generic("Closed voting on server **" + this.guild.name + "**.");
	}

	async count() {
		try {
			if (!Permissions.state("election.register", this) || Permissions.states("election.candidates", this)) throw "Cannot begin voter count before voting has begun.";
			if (Permissions.state("election.voting", this)) throw "Cannot initiate count while voting is still open.";
			let election = this.election;
			let msg = await this.Output.generic("Initialised final vote count for " + Object.keys(election.elections).length + " elections...");
			if (!election.system) throw "Couldn't find valid electoral system by which to count up votes.";
			let Count = require("./" + election.system + "/main.js");
			if (!Count || typeof Count.rank !== "function") throw "Couldn't find valid process by which to count up votes.";
			await this.Output.editor("Counting up the votes...", msg);
			for (let [channel, data] of Object.entries(election.elections)) {
				if (!election.hasOwnProperty(channel)) continue;
				await this.Output.editor("Counting up the votes for election... **" + channel + "**", msg);
				let candidates = await this.parseCandidates(data);
				let votes = await this.parseVotes(data.voters, candidates);
				let raw = await require("./" + election.system.toLowerCase() + "./main.js").rank(candidates, votes);
				election.elections[channel].results = await this.parseResults(raw); //need to use 'in' iterator for setters
			}
			await this.Output.editor("Setting the result...");
			this.election = election;
			await this.Output.editor(`Ready for output from command \`${this.server.prefixes.generic}output\``);
		} catch (e) {
			if (e) this.Output.onError(e)
		}
	}

	async parseCandidates(data) { //returns an array with userIDs ["133249411303211008", "333586342275710978", "340160754936184832"]
		let array = Object.keys(data.candidates);
		for (let votes of Object.values(data.voters))
			for (let i = 1; i < votes.length; i++)
				if (!array.includes(votes[i])) array.push(votes[i]);
		return array.filter(candidate => candidate === "blank" || this.Search.members.get(candidate)) //excludes users who aren't part of the server anymore
			.map(candidate => candidate === "blank" ? "blank" : this.Search.users.get(candidate)[id]) //maps them all to their ids
	}

	async parseVotes(voters, candidates) {
		let array = [];
		for (let votes of Object.values(voters)) //votes are hereon anonymous
			if (votes[0]) array.push(votes
				.filter(vote => candidates.includes(vote))
				.map(vote => candidates.indexOf(vote))
				.join("")
			);
		return array;
	}

	async parseResults(resultsData) { //this method is currently the outputter. Really we just need the reverse of this.parseCandidates()
		for (let channel in resultsData) { //for each channel
			this.server.election[channel].results = [];
			for (let i = 0; i < resultsData[channel].length; i++) { //for each placing in that channel [ '2', '1', '3', '456' ]
				console.log(resultsData[channel]);
				let placing = {
					"title": "House Server #" + channel + " Mod Elections",
					"description": ""
				};
				for (let j = 0; j < resultsData[channel][i].length; j++) { //for each number in that result

				}
				console.log(placing);
				this.server.election[channel].results.push(placing);
			}
			this.server.election[channel].results.reverse();
		}
		DataManager.setServer(this.server);
	}

	async gen() {
		try {
			let channel = this.channel; //modified later
			let embed = new Embed()
				.setTitle("House Server #" + channel + " Mod Elections");
			for (let i = 0; i < this.election.elections[channel].results.length; i++) { //for all the candidates
				let candidate = this.election.elections[channel].results[i];
				let user = candidate === "blank" ? {
					"tag": "A blank vote entry"
				} : this.Search.members.get(candidate);
				let title = "#" + i + ": Election Candidate";
				if (i === 0) title += "🥇";
				if (i === 1) title += "🥈";
				embed.addField(title, user.tag, false);
			}
			this.Output.sender(embed);
		} catch (e) {
			if (e) this.Output.onError(e)
		}
	}

}

class Mock {

	static gen(args = [4, 10]) { //for simulations: used for generating an array of votes
		let array = Mock.genMockRange(args[0], args[1]); //[[4, 2, 3], [1, 2, 4], [1, 2], [1, 3, 4, 2]]
		let array2 = Mock.stringifyVotes(array); //[423, 124, 12, 1342]
		return array2;
	}

	static genMockRange(candidatelimit, voterlimit) {
		let range = [];
		for (let i = 0; i < voterlimit; i++) {
			//let newRange = Math.genRange(candidatelimit).shuffle()
			//range.push(newRange.splice(0, Math.randBetween(0, newRange.length))); //[4, 2, 3]
			range.push(Math.genRandomList(candidatelimit, true)); //alternative method
		}
		return range; //[[4, 2, 3], [1, 2, 4], [1, 2], [1, 3, 4, 2]]
	}

	static stringifyVotes(votes) { //votes input is a double array
		let range = [];
		for (let i = 0; i < votes.length; i++) {
			let string = '';
			for (let j = 0; j < votes[i].length; j++) {
				string += votes[i][j];
			}
			range.push(string); //[423, 124, 12, 1342]
		}
		return range;
	}

}

module.exports = Votes;