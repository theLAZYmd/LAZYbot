const Parse = require("../util/parse.js");
const Logger = require("../util/logger.js");
const Permissions = require("../util/permissions.js");
const CommandConstructor = require("../util/commands.js");
const Commands = new CommandConstructor();

const fs = require("fs");

class Message {

    constructor(argsInfo) {
        this.argsInfo = argsInfo;
    }

	async dm(key) {
        const { aliases, regexes, def  } = Commands.dm;
        let cmdInfo = aliases.get(key.toLowerCase());
        if (!cmdInfo) cmdInfo = aliases.get(Array.from(aliases.keys()).find(alias => alias.toLowerCase() === this.argsInfo.message.content.toLowerCase()));
        if (!cmdInfo) cmdInfo = regexes.get(Array.from(regexes.keys()).find((string) => {
            let regex = new RegExp(string.toString(), "mg");
            if (regex.test(this.argsInfo.message.content)) return true;
            return false;
        }));
        if (!cmdInfo) return def;
        if (cmdInfo.active === false) return def;
        if (cmdInfo.prefix !== this.argsInfo.prefix) return def;
        return cmdInfo;
	}
    
	async command(key) {
        const { commands, aliases  } = Commands.message;
        let cmdInfo = commands.get(key.toLowerCase());
        if (!cmdInfo) cmdInfo = aliases.get(this.argsInfo.message.content);
        if (!cmdInfo) return null;
        if (cmdInfo.active === false) return null;
        if (this.argsInfo.server.prefixes[cmdInfo.prefix] !== this.argsInfo.prefix) return null;
        return cmdInfo;
	}

	async bot(embed) {
        if (!embed) return null;
        if (!embed.title) return null;
        let cmdInfo = Commands.bot.get(title);
        if (!cmdInfo) return null;
        if (!cmdInfo.active) return null;
        return cmdInfo;
    }

    async all(argsInfo) {
        for (let cmdInfo of Commands.all) {
            cmdInfo.prefix = "";
            Message.run(argsInfo, cmdInfo);
        }
	}

    static async run(argsInfo, cmdInfo) {
		argsInfo.Output._onError = cmdInfo.command ? argsInfo.Output.onError : Logger.error;
		try {
            if (cmdInfo.command) Logger.command(argsInfo, cmdInfo);
			if (cmdInfo.requires) await Message.requires(argsInfo, cmdInfo);                        //halts it if fails permissions test
			let path = "modules/" + cmdInfo.module + "/" + cmdInfo.file.toLowerCase() + ".js";
			if (!fs.existsSync("./src/" + path)) path = path.replace(".js", ".ts");
			if (!fs.existsSync("./src/" + path)) throw "Couldn't find module ./src/" + path;
			let Constructor = require("../" + path); //Profile
			let Instance = new Constructor(argsInfo.message); //profile = new Profile(message);
			if (typeof Instance[cmdInfo.method] === "function") Instance[cmdInfo.method](...cmdInfo.arguments.map(a => argsInfo[a]));
			else return !!eval("Instance." + cmdInfo.method + "(...args)");
			return true;
		} catch (e) {
			if (e) argsInfo.Output._onError(e);
			return null;
		}
	}

	static async requires(argsInfo, cmdInfo) {
		for (let [type, value] of Object.entries(cmdInfo.requires)) try {
            if (!Array.isArray(value)) value = [value]; //if it's not array (i.e. multiple possible satisfactory conditions)
            let kill = true;
            for (let passable of value) try {
                kill = !(await Permissions[type](passable, argsInfo));
            } catch (e) {
                Logger.error(e); //THERE SHOULD NOT BE ERRORS HERE, SO IF WE'RE RECEIVING ONE, DEAL WITH IT
            }
            if (kill) throw cmdInfo.method;
        } catch (e) { //if it fails any of requirements, throw
            throw Permissions.output(type, argsInfo) ? Permissions.output(type, argsInfo) + "\nUse `" + cmdInfo.prefix + "help` followed by command name to see command info." : ""; //if no Permissions, kill it
        }
		return true;
    }
    
    static async setGuild(argsInfo, title) { //handles the input for dms
        try {
            let guilds = [];
            for (let guild of Array.from(argsInfo.client.guilds.values()))
                if (guild.members.has(argsInfo.author.id))
                    guilds.push(guild); //and fill it with all guilds the bot has access to that the user is a member of.
            let index = guilds.length === 1 ? 0 : await argsInfo.Output.choose({
                title,
                "type": "server",
                "options": guilds.map(guild => guild.name)
            });
            return guilds[index]; //and if valid input, send of modmail for that guild
        } catch (e) {
            if (e) argsInfo.Output.onError("incoming" + e);
        }
    }
    
}

module.exports = async (client, message) => {
    try {
        if (message.author.id === client.user.id) throw "";
        if (!/[a-z]+/.test(message.content)) throw "";
        let argsInfo = new Parse(message);
        let Command = new Message(argsInfo);
        if (argsInfo.author.bot) {
            let cmdInfo = await Command.bot(message.embeds[0]);
            if (cmdInfo) Message.run(argsInfo, cmdInfo);
        } else
        if (!argsInfo.message.guild) {
            let cmdInfo = await Command.dm(argsInfo.command);
            if (cmdInfo.guild) {
                argsInfo.message._guild = await Message.setGuild(argsInfo, cmdInfo.guild); //now passed, just check if it needs a guild
                if (!argsInfo.message._guild) throw "";
            }
            return Message.run(argsInfo, cmdInfo);
        } else {
            Command.all(argsInfo);
            let cmdInfo = await Command.command(argsInfo.command);
            if (cmdInfo) {
                cmdInfo.command = true;
                Message.run(argsInfo, cmdInfo);
            }
        }
    } catch (e) {
        if (e && typeof e !== "boolean") Logger.error(e);
    }
}