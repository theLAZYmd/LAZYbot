const Parse = require("../util/parse.js");
const Embed = require("../util/embed.js");
const DBuser = require("../util/dbuser.js");
const DataManager = require("../util/datamanager.js");
const Permissions = require("../util/permissions.js");
const config = require("../config.json");

class Trivia extends Parse {

	constructor(message) {
		super(message)
	}

	async init(args) {
		if (this.server.states.trivia) return;
		for (let i = 0; i < args.length; i++) {
			if (args[i] === "--pokemon" || args[i] === "-p") return;
		}
		this.server.states.trivia = true;
		DataManager.setServer(this.server);
	}

	async end() {
		if (!this.server.states.trivia) return;
		this.server.states.trivia = false;
		this.server.trivia.players = {};
		DataManager.setServer(this.server);
	}

	async onNewMessage() {
		try {
			let trivia = this.server.trivia || {};
			let players = trivia.players || {};
			if (players[this.author.id] || players[this.author.id] === false) return;
			players[this.author.id] = true;
			DataManager.setServer(this.server);
			let playing = await this.Output.confirm({
				"description": `**${this.author.tag}**: joined rated trivia.\nType \`cancel\` or press ❎ in 10s to cancel.`
			}, true);
			if (!playing) players[this.author.id] = false;
			trivia.players = players;
			this.server.trivia = trivia;
			DataManager.setServer(this.server);
		} catch (e) {
			if (e) this.Output.onError(e)
		}
	}

	async ratingUpdate(embed) {
		const lines = embed.description.split("\n");
		let data = lines.map(line => {
			let [name,, score] = line.match(/[^\s]+/gi); //[**ObiWanBenoni#3488**, has, 3, points]
			let user = this.Search.users.byTag(name); //byTag filters out the **
			let dbuser = DBuser.getUser(user);
			if (!dbuser.trivia) dbuser.trivia = {
				"rating": 1500,
				"games": 0,
				"provisional": true
			}
			let estimate = Math.pow(10, (dbuser.trivia.rating - config.trivia.initial) / config.trivia.spread); //ex: (2000 - 1500) / 1589 or (1400 - 1500 / 1589
			return [dbuser, estimate, score]; //a number from 0 to 10. If less than 1500, it's between 0 and 1. Realistically not above 5
		})
		let totalEstimate = data.reduce((a, [, estimate]) => a + estimate, 0);
		let totalScore = data.reduce((a, [,, score]) => a + score, 0);
		if (totalScore < this.server.trivia.min) return setTimeout(this.Output.onError("**Only 10+ Point Games Are Rated**"), 5000);
		let description = "";
		for (let [dbuser, estimate, score] of data) {
			let shareEstimate = (estimate / totalEstimate) * totalScore;
			let RD = Math.max(50 - (dbuser.trivia.games || 0) * 3, 10);
			let difference = RD * (score - shareEstimate);
			dbuser.trivia.rating = Math.round(difference + dbuser.trivia.rating);
			dbuser.trivia.games++;
			if (dbuser.trivia.games >= this.server.trivia.provisional) dbuser.trivia.provisional = false;
			description += "**" + dbuser.username + "** " + score + (dbuser.trivia.provisional ? "?" : "") + " (" + difference.toSign() + ")\n";
			DBuser.setData(dbuser);
		}
		await this.Output.sender(new Embed()
			.setTitle("Trivia Rating Update")
			.setDescription(description)
		)
		await this.end();
	}


	async rank(message, args, command, argument) {
		if (args.length === 0) {
			let user = message.author;
			let dbuser = getdbuserfromuser(user);
			message.channel.send({
				embed: {
					title: "**Trivia Rating**",
					description: `**${dbuser.username}** ${dbuser.triviarating || 1500}${!dbuser.triviaprovisional ? "?" : ""}`,
					color: 53380
				}
			});
		} else {
			let user = getuser(message.channel, args[0]);
			let dbuser = getdbuserfromuser(user);
			if (dbuser) {
				message.channel.send({
					embed: {
						title: "**Trivia Rating**",
						description: `**${dbuser.username}** ${dbuser.triviarating}${!dbuser.triviaprovisional ? "?" : ""}`,
						color: 53380
					}
				});
			} else {
				message.channel.send({
					embed: {
						title: "**Trivia Rating**",
						description: `**User Not Found**`,
						color: 53380
					}
				});
			}
		}
	}

}

module.exports = Trivia;