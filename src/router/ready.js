const config = require("../config.json");
const Package = require("../../package.json");

const rp = require('request-promise');
const Logger = require("../util/logger");
const Commands = require("../util/commands");
const Tries = require("../util/tries");

class Ready {

    constructor(client) {
        this.client = client;
    }

	async getGuilds() {
        Logger.load(this.client.readyTimestamp, [[this.client.guilds.keyArray().length, "Client servers"]]);
    }
    
    async getBots() {
        let list = this.client.users.array()
            .filter(u => u.bot)
            .partition(u => !/online|idle|dnd/.test(u.presence.status))
            .map((arr) => [arr.length])
        list[0].push("Online bots");
        list[1].push("Offline bots");
        Logger.load(this.client.readyTimestamp, list)
    }

	async getOwners() {
        let list = config.ids.owner
            .filter((owner) => this.client.users.get(owner))
            .map((owner) => this.client.users.get(owner))
            .partition(u => !/online|idle|dnd/.test(u.presence.status))
            .map((arr) => [arr.length])
        list[0].push("Online bot owners");
        list[1].push("Offline bot owners");
        Logger.load(this.client.readyTimestamp, list)
	}
       
    async getCommands() {
        Tries.getMessage(this.client.readyTimestamp);
        Commands.getAll(this.client.readyTimestamp);
        Commands.getBot(this.client.readyTimestamp);
        Commands.getDM(this.client.readyTimestamp);
        Commands.getMessage(this.client.readyTimestamp);
        Commands.getReaction(this.client.readyTimestamp);
    }

	async getSources() {
        let time = Date.now();
		let sources = new Map();
		for (let source of Object.values(config.sources)) try {
            let body = await rp({
                "method": "GET",
                "uri": source.url.ping,
                "timeout": 1500,
            });
            if (!body) throw source + ": " + 404;
            sources.set(source, true);
        } catch (e) {
            sources.set(source, false);
        }        
        Logger.load(time, [[Array.from(sources.values()).filter(v => v).length, "Online sources"], [Array.from(sources.values()).filter(v => !v).length, "Offline sources"]]);
		this.sources = sources;
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

    async intervals() {
        for (let [_time, cmds] of Commands.interval) {
            let time = Number(_time);
            setInterval(() => {
                for (let cmdInfo of cmds) {
                    this.client.emit("interval", cmdInfo)
                }
            }, time)
        }
    }

}

module.exports = async (client) => {
    try {
        const ready = new Ready(client);
        for (let prop of Object.getOwnPropertyNames(Ready.prototype)) try {            
            if (prop === "constructor") continue;
            if (typeof ready[prop] === "function") await ready[prop]();
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
}