const config = require('../config.json');
const Package = require('../../package.json');
const Logger = require('../util/logger');

class Ready {

	constructor(client) {
		this.client = client;
	}

	async getGuilds() {
		Logger.load(this.client.readyTimestamp, [[this.client.guilds.keyArray().length, 'Client servers']]);
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

	async setRole() {
		if (this.guild.me.displayColor === config.colors.background) return;
		let role = await this.guild.me.roles.find(r => r.name === this.client.user.username);
		if (!role) role = await this.guild.createRole({
			name: this.client.user.username,
			position: this.guild.me.colorRole.position + 1
		}); else role.setPosition(this.guild.me.colorRole.position + 1);
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
		Logger.log(`Set bot user presence to ${name} in ${Date.now() - this.client.readyTimestamp}ms.`);
	}

	async setUsername() {   //Name in package.json + version number
		let version = Package.version.match(/[0-9]+.[0-9]+.[0-9]/);
		if (!version) throw Logger.log('Invalid versioning in package.json, please review.');
		this.client.guilds.forEach(async (guild) => {
			let name = `${Package.name.replace('lazy', 'LAZY')}${this.client.user.id === config.ids.betabot ? 'beta' : ''} v.${version}`;
			if (guild.me.nickname !== name) {
				await guild.me.setNickname(name);
				Logger.log(`Set bot nickname to ${name} in guild ${guild.name} in ${Date.now() - this.client.readyTimestamp}ms.`);
			}
		});
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
		Logger.log('bleep bloop! It\'s showtime.');
		return client;
	} catch (e) {
		if (e) Logger.error(e);
	}
};