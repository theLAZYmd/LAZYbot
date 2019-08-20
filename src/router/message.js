const Parse = require('../util/parse');
const Logger = require('../util/logger');
const Permissions = require('../util/permissions');
const Commands = require('../util/commands');
const MessageCount = require('../modules/Profile/messagecount');
const config = require('../config.json');

class Message {

	constructor(argsInfo) {
		this.argsInfo = argsInfo;
	}

	async dm(key) {
		const { aliases, regexes, def  } = Commands.dm;
		let cmdInfo = aliases.get(key.toLowerCase());
		if (!cmdInfo) cmdInfo = aliases.get(this.argsInfo.message.content.toLowerCase());
		if (!cmdInfo) cmdInfo = regexes.get(Array.from(regexes.keys()).find((string) => {
			let regex = new RegExp(string.toString(), 'mg');
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
		if (!cmdInfo) cmdInfo = aliases.get(this.argsInfo.message.content.toLowerCase());
		if (!cmdInfo) return null;
		if (cmdInfo.active === false) throw 'This command is no longer active. Commands get removed for maintenance/safety reasons periodically.\nPlease DM <@!338772451565502474> for more information.';
		if (cmdInfo.prefix === 'none' && this.argsInfo.prefixes.get(cmdInfo.prefix)) return null;
		else if (cmdInfo.prefix === 'any' || this.argsInfo.prefixes.get(cmdInfo.prefix) !== this.argsInfo.prefix) return null;
		return cmdInfo;
	}

	async bot(embed) {
		if (!embed) return null;
		if (!embed.title) return null;
		let cmdInfo = Commands.bot.get(embed.title.toLowerCase());
		if (!cmdInfo) return null;
		if (cmdInfo.active === false) return null;
		return cmdInfo;
	}

	async all(argsInfo) {
		for (let cmdInfo of Commands.all) {
			Message.run(argsInfo, cmdInfo);
		}
	}

	static async run(argsInfo, cmdInfo) {
		try {
			if (cmdInfo.command) await Logger.trigger(argsInfo, cmdInfo);
			if (cmdInfo.requires) {
				let P = await Message.requires(argsInfo, cmdInfo);
				if (P !== true) throw P; //halts it if fails permissions test
			}
			cmdInfo.args = (cmdInfo.arguments || []).map(a => argsInfo[a]);
			await Commands.run(cmdInfo, argsInfo.message);
		} catch (e) {
			if (e) cmdInfo.command ? argsInfo.Output.onError(e) : Logger.error(e);
			return null;
		}
	}

	static async requires(argsInfo, cmdInfo) {
		for (let [type, value] of Object.entries(cmdInfo.requires)) try {
			if (!Array.isArray(value)) value = [value];
			if ((await Promise.all(value
				.map(async v => await Permissions[type](v, argsInfo))))
				.every(pass => !pass)) throw cmdInfo.method;
		} catch (e) {
			return Permissions.output(type, argsInfo) ? Permissions.output(type, argsInfo) + '\nUse `' + argsInfo.server.prefixes[cmdInfo.prefix] + 'help` followed by command name to see command info.' : ''; //if no Permissions, kill it
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
				type: 'server',
				options: guilds.map(guild => guild.name)
			});
			return guilds[index]; //and if valid input, send of modmail for that guild
		} catch (e) {
			if (e) argsInfo.Output.onError('incoming' + e);
		}
	}
    
}

module.exports = async (client, message) => {
	try {
		if (message.author.id === client.user.id) throw '';
		let argsInfo = new Parse(message);
		try {
			let Command = new Message(argsInfo);
			if (argsInfo.author.bot) {
				let cmdInfo = await Command.bot(message.embeds[0]);
				if (cmdInfo) await Message.run(argsInfo, cmdInfo);
				return;
			}
			if (!argsInfo.message.guild) {
				if (!/[a-z]/i.test(message.content)) throw '';
				let cmdInfo = await Command.dm(argsInfo.command);
				if (cmdInfo.guild) {
					argsInfo.message._guild = await Message.setGuild(argsInfo, cmdInfo.guild); //now passed, just check if it needs a guild
					if (!argsInfo.message._guild) throw '';
				}
				return await Message.run(argsInfo, cmdInfo);
			} else {
				Command.all(argsInfo);
				if (!/[a-z]/i.test(message.content)) throw '';
				let cmdInfo = await Command.command(argsInfo.command);
				if (cmdInfo) {
					cmdInfo.command = true;
					await Message.run(argsInfo, cmdInfo);
				} else new MessageCount(message).log();
			}
		} catch (e) {
			if (e && typeof e !== 'boolean') argsInfo.Output.onError(e);
		}
	} catch (e) {
		if (e) Logger.error(e);
	}
};

function beta(argsInfo, s, f) {
	argsInfo.Output.sender({
		color: config.colors.beta,
		description: ((f - s) / 1000).toLocaleString() + ' seconds to process command'
	});
}