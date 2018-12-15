
const config = require("../config.json");
const token = require("../token.json");
const Package = require("../../package.json");
const commands = require("../data/commands/message.json");

const rp = require('request-promise');
const DataManager = require("../util/datamanager.js");
const Logger = require("../util/logger.js");

class Ready {
/*
	static async get commands() {
		let commandlist = {};
		for (let cmdInfo of commands) {
			for (let alias of cmdInfo.aliases) {
				commandlist[alias.toLowerCase()] = true;
			}
		}
		return commandlist;
	}

	static async get sources() {
		let sources = new Map();
		for (let source of Object.values(config.sources)) try {
            let body = await rp(source.url.ping);
            if (!body) throw source + ": " + 404;
            Map.set(source, true);
        } catch (e) {
            if (e) Logger.error(error);
            Map.set(source, false);
        }
		return sources;
	}*/

	static async guilds() {
		for (let guild of Array.from(client.guilds.values()))
			Logger.log(`Loaded client server ${guild.name} in ${Date.now() - client.readyTimestamp}ms`);
	}

	static async bouncer() {
		let bouncerbot = client.users.get(config.ids.bouncer);
		Logger.log(bouncerbot ? `Noticed bot user ${bouncerbot.tag} in ${Date.now() - client.readyTimestamp}ms` : `Bouncer#8585 is not online!`);
	}

	static async nadeko() {
		let nadekobot = client.users.get(config.ids.nadekobot);
		Logger.log(nadekobot ? `Noticed bot user ${nadekobot.tag} in ${Date.now() - client.readyTimestamp}ms` : `Nadeko#6685 is not online!`);
	}

	static async owners() {
		let owners = config.ids.owner.map(owner => client.users.get(owner)) || "";
		for (let owner of owners)
			Logger.log(owner ? `Noticed bot owner ${owner.tag} in ${Date.now() - client.readyTimestamp}ms` : "");
	}

	static async setPresence() {
		let name = "!h for help or DM me";
		client.user.setPresence({
			"game": {
				name,
				"url": "https://twitch.tv/housediscord",
				"type": "STREAMING"
			}
		});
		Logger.log(`Set bot user presence to ${name} in ${Date.now() - client.readyTimestamp}ms.`);
	}

	static async setUsername() {
		let version = Package.version.match(/[0-9]+.[0-9]+.[0-9]/);
		if (!version) throw Logger.log("Invalid versioning in package.json, please review.");
		for (let guild of Array.from(client.guilds.values())) {
			let name = `LAZYbot${client.user.id === config.ids.betabot ? "beta" : ""} v.` + version;
			if (guild.me.nickname !== name) {
				await guild.me.setNickname(name);
				Logger.log(`Set bot nickname to ${name} in guild ${guild.name} in ${Date.now() - client.readyTimestamp}ms.`);
			}
		}
	}
	
	static async autoupdates() {
		let TrackerConstructor = require("../modules/tracker/tracker.js");
		for (let [id, server] of Object.entries(DataManager.getFile("./src/data/server.json"))) {
			if (server.states.au) {
				TrackerConstructor.initUpdateCycle(client, id)
				return Logger.log("Beginning update cycle...");
			}
		}
    }
    /*  
    static async reddit() {
        let str = Math.random().toString().replace(/[^a-z]+/g, '')
        let url = config.urls.reddit.oauth.replace("CLIENT_ID", config.ids.reddit).replace("TYPE", token.reddit).replace("RANDOM_STRING", str).replace("URL", "http://localhost").replace("SCOPE_STRING", "identity");
        Logger.log(await rp.get(url));
    }
    */
}

module.exports = async (client) => {
    try {
        let data = new Ready(client);
        for (let prop of Object.getOwnPropertyNames(Ready.prototype)) try {
            if (prop === "constructor") continue;
            if (typeof data[prop] === "function") await data[prop]();
        } catch (e) {
            if (e) Logger.error(e);
        }
        Logger.log("bleep bloop! It's showtime.");
        require("./intervals.js")();
    } catch (e) {
        if (e) Logger.error(e);
    }
};