const Parse = require("../util/parse.js");
const Logger = require("../util/logger.js");
const Permissions = require("../util/permissions.js");
const DM = require("../modules/dm.js");

const fs = require("fs");

const CommandConstructor = require("../util/commands.json");
const Commands = new CommandConstructor();

class Message {

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
			let run = Message.run(argsInfo, f);
			if (run) Logger.command(argsInfo, f);
		} catch (e) {
			if (e) argsInfo.Output.onError(e);
		}
	}

	static async all(argsInfo) {
		try {
			for (let cmdInfo of allMessageCommands) {
				cmdInfo.prefix = "";
				Message.run(argsInfo, cmdInfo);
			}
		} catch (e) {
			if (e) argsInfo.Output.onError(e);
		}
	}

	static async command(argsInfo) {
		try {
            let f = ((key) => {
                let cmdInfo = Commands.message.get(key);
                if (cmdInfo.prefix !== argsInfo.prefix) return null;
                if (cmdInfo.active === false) return false;
            })(argsInfo.command);
            if (f) {
				f.command = true;
				let run = Message.run(argsInfo, f);
				if (run) Logger.command(argsInfo, f);
            }
			/*let f = Object.values(commands).flatten().find(command => {
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
				let run = Message.run(argsInfo, f);
				if (run) Logger.command(argsInfo, f);
            }*/
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
					let run = Message.run(argsInfo, cmdInfo);
					if (run) Logger.command(argsInfo, cmdInfo);
					throw "";
				}
			}
		} catch (e) {
			if (e) argsInfo.Output.onError(e);
		}
    }

    static async run(argsInfo, cmdInfo) {
		argsInfo.Output._onError = cmdInfo.command ? argsInfo.Output.onError : Logger.error;
		try {
			if (cmdInfo.requires) await Message.requires(argsInfo, cmdInfo); //halts it if fails permissions test
			let args = [];
			for (let i = 0; i < cmdInfo.arguments.length; i++) {
                args[i] = argsInfo[cmdInfo.arguments[i]]; //the arguments we take for new Instance input are what's listed
            }
			let path = "modules/" + cmdInfo.module + "/" + cmdInfo.file.toLowerCase() + ".js";
			if (!fs.existsSync("./src/" + path)) path = path.replace(".js", ".ts");
			if (!fs.existsSync("./src/" + path)) throw "Couldn't find module ./src/modules/" + cmdInfo.file.toLowerCase();
			let Constructor = require("../" + path); //Profile
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
						Logger.error(e); //THERE SHOULD NOT BE ERRORS HERE, SO IF WE'RE RECEIVING ONE, DEAL WITH IT
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

module.exports = async (client, message) => {
    try {
        if (message.author.id === client.user.id) throw "";
        if (message.content.length === 1) throw "";
        let argsInfo = new Parse(message);
        if (!argsInfo.author.bot) {
            if (argsInfo.message.channel.type === "dm" || argsInfo.message.channel.type === "group" || !argsInfo.message.guild) return Message.DM(argsInfo);
            Message.all(argsInfo);
            Message.command(argsInfo);
        } else Message.bot(argsInfo);
    } catch (e) {
        if (e && typeof e !== "boolean") Logger.error(e);
    }
}