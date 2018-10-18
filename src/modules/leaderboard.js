const config = require("../config.json");
const DataManager = require("../util/datamanager.js");
const Parse = require("../util/parse.js");
const Embed = require("../util/embed.js");
const Permissions = require("../util/permissions.js");

class Leaderboard extends Parse {

	constructor(message) {
		super(message);
	}

	async variant(channel, args) {
		try {
			let data = await Leaderboard.find(this.message.content, channel, args, this); //variant, source, active
			data = data.variant.key === "trivia" ? await Leaderboard.generateTrivia(data) : await Leaderboard.generate(data); //leaderboard
			if (!data.leaderboard || data.leaderboard.length === 0) throw "Couldn't fetch players for **" + data.variant.name + "**.";
			let embedgroup = [];
			data.emoji = this.Search.emojis.get(data.variant.key);
			for (let i = 0; i < Math.ceil(data.leaderboard.length / 10); i++)
				embedgroup.push(await Leaderboard.build(data, i));
			this.Paginator.sender(embedgroup, 30000);
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	static async find(content, channel, args, argsInfo) { //this function finds input parameters and returns an embed. Needs source, variant, and active.
		try {
			let source = config.sources[(channel.name === "bughouse" || channel.topic.includes("bughouse") || content.includes("bughouse")) ? "chesscom" : "lichess"]; //bug channel exception, default source is chess.com
			sourceloop: //find source requested in the message, if none found, assume lichess
				for (let [key, _source] of Object.entries(config.sources))
					for (let arg of args)
						if (arg.toLowerCase().replace(/[^a-z]/gi, "") === key.toLowerCase()) {
							source = _source;
							break sourceloop;
						}
			let active = /-a|--active/gi.test(content); //active is just if the message contains the word
			let found = {}, variant; //variant found, and variant used. Running one
			for (let [key, _variant] of Object.entries(config.variants[source.key])) {
				if (content.includes(key)) found.args = _variant, variant = _variant; //if in args, match it.
				if (channel.topic && channel.topic.includes(key)) found.channel = _variant, variant = _variant; //if in topic match it.
				if (channel.name.includes(key)) found.channel = _variant, variant = _variant; //if in channel name, match it.
				if (found.channel) break;
			}
			if (found.args && found.channel && found.channel !== found.args) throw "Wrong channel to summon this leaderboard!"; //if no possibilities or match conflict, return.
			if (!variant && await Permissions.channels("trivia", argsInfo)) variant = {
				"name": "Trivia",
				"api": "trivia",
				"key": "trivia"
			};
			if (!variant) throw "Couldn't find matching variant";   //if none found, return.
			return {variant, source, active, argsInfo}; //data object for generating leaderboard
		} catch (e) {
			if (e) throw e;
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
					console.log("No main registered for " + dbuser.username + ".");
					continue; //trust that it will be fixed in updates
				}
				if (data.variant.key !== "all" && (!dbuser[data.source.key][username][data.variant.key] || dbuser[data.source.key][username][data.variant.key].endsWith("?"))) continue;
				data.leaderboard.push({
					"tag": dbuser.username,
					"username": username,
					"id": dbuser.id,
					"rating": data.variant.key === "all" ? dbuser[data.source.key][username] : dbuser[data.source.key][username][data.variant.key]
				});
			}
			if (data.leaderboard.length !== 0 && data.variant.key !== "all") data.leaderboard.sort((a, b) => parseInt(b.rating) - parseInt(a.rating));
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
					"tag": dbuser.username,
					"username": dbuser.username,
					"id": dbuser.id,
					"rating": dbuser.trivia.rating
				});
			}
			if (data.leaderboard.length !== 0 && data.variant.key !== "all") data.leaderboard.sort((a, b) => parseInt(b.rating) - parseInt(a.rating));
			delete data.source;
			return data;
		} catch (e) {
			if (e) throw e;
		}
	}

	static async build(data, page = 0) {
		try {
			let array = [];
			for (let i = 0; i < 10; i++) {
				let entry = data.leaderboard[i + 10 * page];
				if (!entry) continue;
				if (data.source) {
					let urllink = data.source.url.profile.replace("|", entry.username); //lichess.org/@/V2chess
					array[i] = ["[" + entry.tag + "](" + urllink + ") " + entry.rating];
				} else {
					array[i] = [entry.tag + " " + entry.rating]
				}
			}
			let lbembed = Embed.leaderboard(array, page, false, 10); //Case 2 Leaderboard:
			lbembed.title = `${data.emoji} House leaderboard${data.source ? " on " + data.source.name : ""} for${data.active ? "active " : " "}${data.variant.name} players`;
			return lbembed;
		} catch (e) {
			if (e) throw e;
		}
	}

}

module.exports = Leaderboard;