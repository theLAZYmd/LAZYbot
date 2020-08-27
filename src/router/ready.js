const config = require('../config.json');
const Package = require('../../package.json');

const rp = require('request-promise');
const Logger = require('../util/logger');
const Commands = require('../util/commands');
const CustomReactions = require('../modules/Custom Reactions/customreactions');
const Shadowban = require('../modules/Administration/shadowban');

class Ready {

	constructor(client) {
		this.client = client;
	}

	async getGuilds() {
		Logger.load(this.client.readyTimestamp, [[this.client.guilds.keyArray().length, 'Client servers']]);
	}
    
	async getBots() {
		let list = this.client.users.array()
			.filter(u => u.bot)
			.partition(u => !/online|idle|dnd/.test(u.presence.status))
			.map((arr) => [arr.length]);
		list[0].push('Online bots');
		list[1].push('Offline bots');
		Logger.load(this.client.readyTimestamp, list);
	}

	async getOwners() {
		let list = config.ids.owner
			.filter((owner) => this.client.users.get(owner))
			.map((owner) => this.client.users.get(owner))
			.partition(u => !/online|idle|dnd/.test(u.presence.status))
			.map((arr) => [arr.length]);
		list[0].push('Online bot owners');
		list[1].push('Offline bot owners');
		Logger.load(this.client.readyTimestamp, list);
	}
       
	async getCommands() {
		let A = Commands.getAll();
		Logger.load(this.client.readyTimestamp, [[A.length, 'Processes']], 'All');
		let B = Commands.getBot(this.client.readyTimestamp);
		Logger.load(this.client.readyTimestamp, [[B.size, 'Title Keys']], 'Bot');
		let C = await Commands.getMessage(this.client.readyTimestamp);
		Logger.load(this.client.readyTimestamp, [[C.commands.size, 'Command Keys'], [C.aliases.size, 'Aliases']], 'Commands');
		let D = Commands.getDM(this.client.readyTimestamp);
		Logger.load(this.client.readyTimestamp, [[D.aliases.size, 'Command keys'], [D.regexes.size, 'Regexes']], 'DM');
		let E = Commands.getReaction(this.client.readyTimestamp);
		Logger.load(this.client.readyTimestamp, [[E.name.size, 'Command Keys'], [E.key.size, 'ID-constructor keys']], 'Emoji Reactions');
	}

	async getCustomReactions() {
		let CR = CustomReactions.getTrie();
		Logger.load(this.client.readyTimestamp, [[Object.keys(CR).length, 'Servers'], [Object.values(CR).reduce((acc, curr) => acc += curr.anyword.size + curr.whole.size, 0), 'Keys']], 'Custom Reactions');
	}

	async getShadowbanPhrases() {
		let servers = Object.keys(Shadowban.getTrie());
		Logger.load(this.client.readyTimestamp, [[servers.length, 'Servers']], 'Shadowban Phrases');
	}

	async getSources() {
		let time = Date.now();
		let sources = new Map();
		for (let source of Object.values(config.sources)) try {
			let body = await rp({
				method: 'GET',
				uri: source.url.ping,
				timeout: 1500,
			});
			if (!body) throw source + ': ' + 404;
			sources.set(source, true);
		} catch (e) {
			sources.set(source, false);
		}        
		Logger.load(time, [[Array.from(sources.values()).filter(v => v).length, 'Online sources'], [Array.from(sources.values()).filter(v => !v).length, 'Offline sources']]);
		this.sources = sources;
	}
   
	async setPresence() {
		let name = '!h for help or DM me';
		this.client.user.setPresence({
			game: {
				name,
				url: 'https://twitch.tv/housediscord',
				type: 'STREAMING'
			}
		});
		Logger.verbose(`Set bot user presence to ${name} in ${Date.now() - this.client.readyTimestamp}ms.`);
	}

	async setUsername() {   //Name in package.json + version number
		let version = Package.version.match(/[0-9]+.[0-9]+.[0-9]/);
		if (!version) throw Logger.error('Invalid versioning in package.json, please review.');
		this.client.guilds.forEach(async (guild) => {
			let name = `${Package.name.replace('lazy', 'LAZY')}${this.client.user.id === config.ids.betabot ? 'beta' : ''} v.${version}`;
			if (guild.me.nickname !== name) {
				await guild.me.setNickname(name);
				Logger.verbose(`Set bot nickname to ${name} in guild ${guild.name} in ${Date.now() - this.client.readyTimestamp}ms.`);
			}
		});
	}

	async intervals() {
		for (let [_time, cmds] of Commands.interval) {
			let time = Number(_time);
			for (let cmdInfo of cmds) {
				if (config.ids.betabot === this.client.user.id) break;
				if (cmdInfo.active === false) continue;
				if (cmdInfo.once !== true) continue;
				this.client.emit('interval', cmdInfo);
			}
			setInterval(() => {
				for (let cmdInfo of cmds) {
					if (cmdInfo.active === false) continue;
					this.client.emit('interval', cmdInfo);
				}
			}, time);
		}
	}

}

module.exports = async (client) => {
	try {
		const ready = new Ready(client);
		for (let prop of Object.getOwnPropertyNames(Ready.prototype)) try {            
			if (prop === 'constructor') continue;
			if (typeof ready[prop] === 'function') await ready[prop]();
		} catch (e) {
			if (e) Logger.error(e);
		}
		Logger.verbose('bleep bloop! It\'s showtime.');
		client.sources = ready.sources;
		return client;
	} catch (e) {
		if (e) Logger.error(e);
	}
};