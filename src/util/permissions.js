const DataManager = require('./datamanager.js');
const config = DataManager.getFile('./src/config.json');

class Permissions {

	static house(requirement, argsInfo) {
		if (requirement && argsInfo.guild.id !== config.ids.house) return false;
		return true;
	}

	static user(requirement, argsInfo) {
		let value = config.ids[requirement];
		if (!value) return true;
		if (typeof value === 'string' && value === argsInfo.author.id) return true;
		else if (Array.isArray(value)) {
			for (let passable of value)
				if (passable === argsInfo.author.id) return true; //if Array. No support for object.
		}
		return false;
	}

	static role(roleType, argsInfo) { //admin, {object}
		if (roleType === 'owner') return (argsInfo.guild.ownerID === argsInfo.member.id || config.ids.owner.includes(argsInfo.author.id));
		let roleName = argsInfo.server.roles[roleType];
		if (!argsInfo.guild.roles.some(role => role.name === roleName) || !roleName) return true;
		return (argsInfo.member.roles.some(role => role.name.toLowerCase().startsWith(roleName)) || argsInfo.guild.ownerID === argsInfo.member.id);
	}

	static channels(channelResolvable, argsInfo) {
		let name;
		let id;
		if (typeof channelResolvable === 'string') name = argsInfo.server.channels[channelResolvable] || channelResolvable;
		else if (typeof channelResolvable === 'object') {
			if (channelResolvable.id) id = channelResolvable.id;
			if (channelResolvable.name) name = channelResolvable.name;
			else if (channelResolvable.type) return channelResolvable.type === argsInfo.channel.type;
		}
		let names = Array.isArray(name) ? name : [name];
		for (let n of names) {
			if (argsInfo.channel.id === id) return true;
			if (argsInfo.channel.id === n) return true;
			if (!argsInfo.guild.channels.some(channel => channel.name.toLowerCase() === n.toLowerCase())) name = 'general';
			if (argsInfo.channel.name.toLowerCase() === n.toLowerCase()) return true;
		}
		return false;
	}

	static state(state, data) {
		if (typeof state !== 'string') return true;
		return Object.getProp(data.server.states, state.toLowerCase());
	}

	static bot(bot, data) {
		return data.author.bot === bot;
	}

	static args(data, argsInfo) {
		if (data.length || data.length === 0) {
			if (typeof data.length === 'number') {
				if (argsInfo.args.length === data.length) return true;
			} else {
				for (let value of data.length) {
					if (argsInfo.args.length === value) return true;
					if (value === '++' && argsInfo.args.length > data.length[data.length.length - 2]) return true;
				}
			}
			return false;
		}
		return true;
	}

	static async response(recipient, argsInfo) {
		let i = true;
		if (recipient.startsWith('^')) {
			i = false;
			recipient.splice(0, 1);
		}
		let j = await argsInfo.channel.awaitMessages(m => m.author.id === config.ids[recipient] && m.embeds[0], {
			time: 2000,
			max: 1
		}).then(() => {return true;}).catch(() => {return false;});
		if (i) return j;
		else return !j;
	}

	static output(key) {
		switch (key) {
			case 'user':
				return 'That command is bot owner only.\nIf you are not an active developer on the bot, you cannot use this command.';
			case 'role':
				return 'Insufficient server permissions to use this command.';
			case 'channel':
				return 'Wrong channel to use this command.';
			case 'args':
				return 'Inapplicable number of parameters.';
			default:
				return false;
		}
	}

}

module.exports = Permissions;