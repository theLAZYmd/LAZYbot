const commands = require("../data/commands/message.json");
const config = require("../config.json");
const request = require('request');
const rp = require('request-promise');
const DataManager = require("../util/datamanager.js");
const Package = require("../../package.json");
const Logger = require("../util/logger.js");
const token = require("../token.json");

class onStartup {

	constructor(client) {
		this.client = client;
	}

	get reboot() {
		return this.client.readyTimestamp;
	}

	get commands() {
		let commandlist = {};
		for (let cmdInfo of commands) {
			for (let alias of cmdInfo.aliases) {
				commandlist[alias.toLowerCase()] = true;
			}
		}
		return commandlist;
	}

	get sources() {
		let sources = {};
		for (let i = 0; i < config.sources.length; i++) {
			request.get(config.sources[i][2], (error, response, body) => {
				if (error) {
					Logger.error(error);
					Logger.log(`data.${config.sources[i][1]}: ` + sources[config.sources[i][1]]);
				} else {
					sources[config.sources[i][1]] = true;
					Logger.log(`Set data.${config.sources[i][1]}: ` + sources[config.sources[i][1]])
				}
			});
		}
		return sources;
	}

	async guilds() {
		for (let guild of Array.from(this.client.guilds.values()))
			Logger.log(`Loaded client server ${guild.name} in ${Date.now() - this.reboot}ms`);
	}

	async bouncer() {
		let bouncerbot = this.client.users.get(config.ids.bouncer);
		Logger.log(bouncerbot ? `Noticed bot user ${bouncerbot.tag} in ${Date.now() - this.reboot}ms` : `Bouncer#8585 is not online!`);
	}

	async nadeko() {
		let nadekobot = this.client.users.get(config.ids.nadekobot);
		Logger.log(nadekobot ? `Noticed bot user ${nadekobot.tag} in ${Date.now() - this.reboot}ms` : `Nadeko#6685 is not online!`);
	}

	async harmon() {
		let harmonbot = this.client.users.get(config.ids.harmon);
		Logger.log(harmonbot ? `Noticed bot user ${harmonbot.tag} in ${Date.now() - this.reboot}ms` : `Harmonbot#4049 is not online!`);
	}

	async owners() {
		let owners = config.ids.owner.map(owner => this.client.users.get(owner)) || "";
		for (let owner of owners)
			Logger.log(owner ? `Noticed bot owner ${owner.tag} in ${Date.now() - this.reboot}ms` : "");
	}

	async setPresence() {
		let name = "!h for help or DM me";
		this.client.user.setPresence({
			"game": {
				name,
				"url": "https://twitch.tv/housediscord",
				"type": "STREAMING"
			}
		});
		Logger.log(`Set bot user presence to ${name} in ${Date.now() - this.reboot}ms.`);
	}

	async setUsername() {
		let version = Package.version.match(/[0-9]+.[0-9]+.[0-9]/);
		if (!version) throw Logger.log("Invalid versioning in package.json, please review.");
		for (let guild of Array.from(this.client.guilds.values())) {
			let name = `LAZYbot${this.client.user.id === config.ids.betabot ? "beta" : ""} v.` + version;
			if (guild.me.nickname !== name) {
				await guild.me.setNickname(name);
				Logger.log(`Set bot nickname to ${name} in guild ${guild.name} in ${Date.now() - this.reboot}ms.`);
			}
		}
	}
	
	async autoupdates() {
		let TrackerConstructor = require("../modules/tracker/tracker.js");
		for (let [id, server] of Object.entries(DataManager.getFile("./src/data/server.json"))) {
			if (server.states.au) {
				TrackerConstructor.initUpdateCycle(this.client, id)
				return Logger.log("Beginning update cycle...");
			}
		}
    }
    /*  
    async reddit() {
        let str = Math.random().toString().replace(/[^a-z]+/g, '')
        let url = config.urls.reddit.oauth.replace("CLIENT_ID", config.ids.reddit).replace("TYPE", token.reddit).replace("RANDOM_STRING", str).replace("URL", "http://localhost").replace("SCOPE_STRING", "identity");
        Logger.log(await rp.get(url));
    }
    */
}

module.exports = onStartup;