const DataManager = require("./datamanager.js");
const config = DataManager.getFile("./src/config.json");

class Permissions {

	static house(requirement, argsInfo) {
		if (requirement && argsInfo.guild.id !== config.houseid) return false;
		return true;
	}

	static user(requirement, argsInfo) {
		let value = config.ids[requirement];
		if (!value) return true;
		if (typeof value === "string" && value === argsInfo.author.id) return true;
		else if (Array.isArray(value)) {
			for (let passable of value)
				if (passable === argsInfo.author.id) return true; //if Array. No support for object.
		}
		return false;
	}

	static role(roleType, argsInfo) { //admin, {object}
		if (roleType === "owner") return (argsInfo.guild.ownerID === argsInfo.member.id || config.ids.owner.includes(argsInfo.author.id));
		let roleName = argsInfo.server.roles[roleType];
		if (!argsInfo.guild.roles.some(role => role.name = roleName) || !roleName) return true;
		return (argsInfo.member.roles.some(role => role.name.toLowerCase().startsWith(roleName)) || argsInfo.guild.ownerID === argsInfo.member.id);
	}

	static channels(channelName, argsInfo) {
		if (!argsInfo.guild.channels.some(channel => channel.name = channelName)) channelName === "general";
		return argsInfo.channel.name.toLowerCase() === argsInfo.server.channels[channelName].toLowerCase();
	}

	static state(state, data) {
		if (typeof state !== "string") return true;
		return data.server.states._getDescendantProp(state.toLowerCase());
	}

	static bot(bot, data) {
		return data.author.bot === bot;
	}

	static args(data, argsInfo) {
		if (data.length || data.length === 0) {
			if (typeof data.length === "number") {
				if (argsInfo.args.length === data.length) return true;
			} else {
				for (let value of data.length) {
					if (argsInfo.args.length === value) return true;
					if (value === "++" && argsInfo.args.length > data.length[data.length.length - 2]) return true;
				}
			}
			return false;
		}
		return true;
	}

	static async response(recipient, argsInfo) {
		return argsInfo.channel.awaitMessages(m => m.author.id === config.ids[recipient] && m.embeds[0], {
			"time": 2000,
			"max": 1
		}).then(() => {return true}).catch(() => {return false})
	}

	static output(key, argsInfo) {
		switch (key) {
			case "user":
				return "That command is bot owner only.\nIf you are not an active developer on the bot, you cannot use this command.";
			case "role":
				return "Insufficient server permissions to use this command.";
			case "channel":
				return "Wrong channel to use this command.";
			case "args":
				return argsInfo.command === ".." ? "" : "Inapplicable number of parameters."
		}
	}

}

module.exports = Permissions;