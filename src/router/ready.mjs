import rp from 'request-promise';
import DataManager from "../util/datamanager.js";
import Logger from "../util/logger";
import Commands from "../util/commands";

const config = DataManager.getFile("./src/config.json");
const Package = DataManager.getFile("./package.json");

class Ready {

    constructor(client) {
        this.client = client;
    }

	async getSources() {
		let sources = new Map();
		for (let source of Object.values(config.sources)) try {
            let body = await rp(source.url.ping);
            if (!body) throw source + ": " + 404;
            sources.set(source, true);
        } catch (e) {
            sources.set(source, false);
        }
		this.sources = sources;
	}

	async guilds() {
		for (let guild of Array.from(this.client.guilds.values()))
			Logger.log(`Loaded this.client server ${guild.name} in ${Date.now() - this.client.readyTimestamp}ms`);
	}

	async bouncer() {
		let bouncerbot = this.client.users.get(config.ids.bouncer);
		Logger.log(bouncerbot ? `Noticed bot user ${bouncerbot.tag} in ${Date.now() - this.client.readyTimestamp}ms` : `Bouncer#8585 is not online!`);
	}

	async nadeko() {
		let nadekobot = this.client.users.get(config.ids.nadekobot);
		Logger.log(nadekobot ? `Noticed bot user ${nadekobot.tag} in ${Date.now() - this.client.readyTimestamp}ms` : `Nadeko#6685 is not online!`);
	}

	async owners() {
		let owners = config.ids.owner.map(owner => this.client.users.get(owner)) || "";
		for (let owner of owners)
			Logger.log(owner ? `Noticed bot owner ${owner.tag} in ${Date.now() - this.client.readyTimestamp}ms` : "");
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
		Logger.log(`Set bot user presence to ${name} in ${Date.now() - this.client.readyTimestamp}ms.`);
	}

	async setUsername() {
		let version = Package.version.match(/[0-9]+.[0-9]+.[0-9]/);
		if (!version) throw Logger.log("Invalid versioning in package.json, please review.");
		for (let guild of Array.from(this.client.guilds.values())) {
			let name = `LAZYbot${this.client.user.id === config.ids.betabot ? "beta" : ""} v.` + version;
			if (guild.me.nickname !== name) {
				await guild.me.setNickname(name);
				Logger.log(`Set bot nickname to ${name} in guild ${guild.name} in ${Date.now() - this.client.readyTimestamp}ms.`);
			}
		}
	}
	/*
	async autoupdates() {
		let TrackerConstructor = require("../modules/tracker/tracker.js");
		for (let [id, server] of Object.entries(DataManager.getFile("./src/data/server.json"))) {
			if (server.states.au) {
				TrackerConstructor.initUpdateCycle(this.client, id)
				return Logger.log("Beginning update cycle...");
			}
		}
    }*/
    /*  
    async reddit() {
        let str = Math.random().toString().replace(/[^a-z]+/g, '')
        let url = config.urls.reddit.oauth.replace("this.client_ID", config.ids.reddit).replace("TYPE", token.reddit).replace("RANDOM_STRING", str).replace("URL", "http://localhost").replace("SCOPE_STRING", "identity");
        Logger.log(await rp.get(url));
    }
    */
}

export default async (client) => {
    try {
        const ready = new Ready(client);
        for (let prop of Object.getOwnPropertyNames(Ready.prototype)) try {            
            if (prop === "constructor") continue;
            if (typeof ready[prop] === "function") {
                ready[prop]();
            }
        } catch (e) {
            if (e) Logger.error(e);
        }
        Logger.log("bleep bloop! It's showtime.");
        //require("./intervals.js")();
        client.sources = ready.sources;
        return client;
    } catch (e) {
        if (e) Logger.error(e);
    }
};