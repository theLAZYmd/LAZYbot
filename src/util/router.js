const Parse = require("./parse.js");
const DataManager = require("./datamanager.js");
const Commands = require("../data/commands/message.json");
const allMessageCommands = require("../data/commands/all.json");
const DMCommands = require("../data/commands/dm.json");
const IntervalCommands = require("../data/commands/interval.json");
const reactionCommands = require("../data/commands/reaction.json");
const botCommands = require("../data/commands/bot.json");
const Permissions = require("./permissions.js");
const DM = require("../modules/dm.js");
const winston = require("winston");
const logger = winston.createLogger({
	"level": "info",
	"format": winston.format.json(),
	"transports": [
		new winston.transports.Console(),
		new winston.transports.File({   "filename": "combined.log"  })
	]
})

class Router {

	static async presence(oldMember, newMember) {
		let Constructor = require("../modules/presence.js");
		let Instance = new Constructor({
			"guild": oldMember.guild,
			"_guild": oldMember.guild,
			"member": oldMember
		});
		if (oldMember.user.bot) Instance.bot(oldMember.presence, newMember.presence);
		Instance.streamer(oldMember.presence, newMember.presence);
	}

	static async reaction({messageReaction, user}) {
		try {
			if (user.bot) throw "";
			if (messageReaction.message.guild && messageReaction.message.author.bot) {
				let reactionmessages = DataManager.getFile("./src/data/reactionmessages.json")[messageReaction.message.guild.id];
				for (let [type, data] of Object.entries(reactionmessages)) {
					for (let messageID of Object.keys(data)) {
						if (messageReaction.message.id === messageID) {
							let Constructor = require("../modules/" + (type + (type === "modmail" ? "/action" : "")).toLowerCase() + ".js");
							let Instance = new Constructor(messageReaction.message);
							Instance.react(messageReaction, user, reactionmessages[type][messageID]);
						}
					}
				}
			}
			let f = Array.from(reactionCommands).find(cmdInfo => {
				if (cmdInfo.active === false) return false;
				if (cmdInfo.name === messageReaction.emoji.name) return true;
				if (cmdInfo.id === messageReaction.emoji.id) return true;
				return false;
			});
			if (f) {
				let Constructor = require("../modules/" + f.file.toLowerCase() + ".js");
				let Instance = new Constructor(messageReaction.message);
				Instance[f.method.toLowerCase()](messageReaction, user);
			}
		} catch (e) {
			if (e) console.log(e);
		}
	}

	static async intervals() {
		try {
			for (let cmdInfo of IntervalCommands) {
				if (!cmdInfo.file || !cmdInfo.method || !cmdInfo.args || !cmdInfo.interval) continue;
				setInterval(async () => {
					let Constructor = require("../modules/" + cmdInfo.file.toLowerCase() + ".js");
					await Constructor[cmdInfo.method](...cmdInfo.args);
				}, cmdInfo.interval)
			}
		} catch (e) {
			if (e) console.log(e);
		}
	}

	static async message(data) {
		try {
			let {  argsInfo  } = await Router.checkErrors(data);
			if (!argsInfo.author.bot) {
				if (argsInfo.message.channel.type === "dm" || argsInfo.message.channel.type === "group" || !argsInfo.message.guild) return Router.DM(argsInfo);
				Router.all(argsInfo);
				Router.command(argsInfo);
			} else Router.bot(argsInfo);
		} catch (e) {
			if (e && typeof e !== "boolean") console.log(e);
		}
	}

	static async checkErrors(data) {
		try {
			if (data.message.author.id === data.client.user.id) throw "";
			if (data.message.content.length === 1) throw "";
			data.client.reboot = data.readyTimestamp;
			data.argsInfo = new Parse(data.message);
			return data;
		} catch (e) {
			throw e;
		}
	}

	static async DM(argsInfo) {
		try {
			let f = Array.from(DMCommands).slice(1).find(command => {
				let cmdInfo = Object.assign({
					"prefix": ""
				}, command);
				if (cmdInfo.active === false) return false;
				if (!cmdInfo.regex && !cmdInfo.aliases) return false;
				if (cmdInfo.regex) {
					let regex = new RegExp(cmdInfo.regex.toString(), "mg");
					if (regex.test(argsInfo.message.content)) return true;
				}
				if (cmdInfo.aliases) {
					if (cmdInfo.prefix !== argsInfo.prefix) return false;
					if (cmdInfo.aliases.inArray(argsInfo.command)) return true;
					if (cmdInfo.aliases.inArray(argsInfo.message.content)) return true;
					return false;
				}
			})
			if (!f) f = DMCommands[0];
			else f.command = true;
			if (f.guild) {
				let guild = await DM.setGuild(argsInfo, f.guild); //now passed, just check if it needs a guild
				if (!guild) throw "";
				argsInfo.message._guild = guild;
			}
			let run = await Router.runCommand(argsInfo, f);
			if (run) await Router.logCommand(argsInfo, f);
		} catch (e) {
			if (e) argsInfo.Output.onError(e);
		}
	}

	static async all(argsInfo) {
		try {
			for (let cmdInfo of allMessageCommands) {
				cmdInfo.prefix = "";
				Router.runCommand(argsInfo, cmdInfo);
			}
		} catch (e) {
			if (e) argsInfo.Output.onError(e);
		}
	}

	static async command(argsInfo) {
		try {
			let f = Array.from(Commands).find(command => {
				let cmdInfo = Object.assign({}, command);
				if (cmdInfo.active === false) return false;
				if (argsInfo.prefix) {
					cmdInfo.prefix = argsInfo.server.prefixes[cmdInfo.prefix];
					if (cmdInfo.prefix !== argsInfo.prefix) return false;
					if (cmdInfo.aliases.inArray(argsInfo.command)) return true;
					if (cmdInfo.aliases.inArray(argsInfo.message.content)) return true;
					return false;
				} else {
					if (!cmdInfo.subcommands) return false;
					for (let [, type] of cmdInfo.subcommands) {
						if (!type || typeof type !== "object") continue;
						for (let [s, v] of Object.entries(type)) {
							if (!v.aliases) continue;
							for (let a of v.aliases) {
								if (!argsInfo.message.content.toLowerCase().includes(a.toLowerCase())) continue;
								argsInfo.message.content = argsInfo.message.content.replace(new RegExp(a, "gi"), argsInfo.server.prefixes[cmdInfo.prefix] + cmdInfo.aliases[0] + " " + s);
								return true;
							}
						}
					}
				}
			})
			if (f) {
				f.command = true;
				let run = await Router.runCommand(argsInfo, f);
				if (run) await Router.logCommand(argsInfo, f);
			}
		} catch (e) {
			if (e) argsInfo.Output.onError(e);
		}
	}

	static async bot(argsInfo) {
		try {
			for (let cmdInfo of botCommands) {
				if (cmdInfo.active === false || !argsInfo.message.embeds[0]) continue;
				let embed = argsInfo.message.embeds[0];
				if ((embed.title && embed.title === cmdInfo.title) || (embed.description && embed.description === cmdInfo.description)) {
					let run = await Router.runCommand(argsInfo, cmdInfo);
					if (run) await Router.logCommand(argsInfo, cmdInfo);
					throw "";
				}
			}
		} catch (e) {
			if (e) argsInfo.Output.onError(e);
		}
	}

	static async logCommand(argsInfo, cmdInfo) {
		try {
			let time = Date.getISOtime(Date.now()).slice(0, 24);
			let author = argsInfo.author.tag;
			let Constructor = cmdInfo.file.toProperCase();
			let command = (cmdInfo.command ? argsInfo.server.prefixes[cmdInfo.prefix] : cmdInfo.prefix) + argsInfo.command;
			let args = argsInfo.args;
			//logger.log({
			//	"level": "info",
			//	"message": time + " | " + author + " | " + Constructor + " | " + command + " | [" + args + "]"
			//});
			console.log(time + " | " + author + " | " + Constructor + " | " + command + " | [" + args + "]");
			return "";
		} catch (e) {
			if (e) console.log(e);
		}
	}

	static async runCommand(argsInfo, cmdInfo) {
		argsInfo.Output._onError = cmdInfo.command ? argsInfo.Output.onError : console.log;
		try {
			if (cmdInfo.requires) await Router.requires(argsInfo, cmdInfo); //halts it if fails permissions test
			let args = [];
			for (let i = 0; i < cmdInfo.arguments.length; i++)
				args[i] = argsInfo[cmdInfo.arguments[i]]; //the arguments we take for new Instance input are what's listed
			let Constructor = require("../modules/" + cmdInfo.file.toLowerCase() + ".js"); //Profile
			let Instance = new Constructor(argsInfo.message); //profile = new Profile(message);
			if (typeof Instance[cmdInfo.method] === "function") Instance[cmdInfo.method](...args);
			//else if (typeof Instance._getDescendantProp(cmdInfo.method) === "function") Instance._getDescendantProp(cmdInfo.method)(...args);
			else return !!eval("Instance." + cmdInfo.method + "(...args)");
			return true;
		} catch (e) {
			if (e) argsInfo.Output._onError(e);
			return false;
		}
	}

	static async requires(argsInfo, cmdInfo) {
		for (let [type, value] of Object.entries(cmdInfo.requires)) { //[channel: "spam"]
			try {
				if (!Array.isArray(value)) value = [value]; //if it's not array (i.e. multiple possible satisfactory conditions)
				let kill = true;
				for (let passable of value) {
					try {
						kill = !(await Permissions[type](passable, argsInfo));
					} catch (e) {
						console.log(e); //THERE SHOULD NOT BE ERRORS HERE, SO IF WE'RE RECEIVING ONE, DEAL WITH IT
					}
				}
				if (kill) throw cmdInfo.method;
			} catch (e) { //if it fails any of requirements, throw
				throw Permissions.output(type, argsInfo) ? Permissions.output(type, argsInfo) + "\nUse `" + cmdInfo.prefix + "help` followed by command name to see command info." : ""; //if no Permissions, kill it
			}
		}
		return true;
	}

}

module.exports = Router;