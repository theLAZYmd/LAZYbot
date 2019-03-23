const Parse = require('../../../util/parse');
const rp = require('request-promise');
const DataManager = require('../../../util/datamanager');
const DBuser = require('../../../util/dbuser');
const Logger = require('../../../util/logger');
const Assign = require('./assign');
const config = DataManager.getFile('./src/config.json');

class Track {

    constructor(content, argsInfo) {
        this.content = content;
        this.server = argsInfo.server;
        this.argsInfo = argsInfo;
    }

    get command () {
        if (this._command) return this._command;
        return this._command = /remove/i.test(this.content) ? "remove" : "track";
    }

    get source () {
        if (this._source) return this._source;
        let regex = new RegExp("(?:" + Object.keys(config.sources).join("|") + ")");
        if (!regex.test(this.content)) throw "Please specify a source to remove linked account.";
        return this._source = this.content.match(regex)[0];
    }

    get sources() {
        if (this._sources) return this._sources;
        return this._sources = [Object.values(config.sources).find(s => s.key === this.source)];
    }

    get argument() {
        if (this._argument) return this._argument;
        let argument = this.content
            .replace(this.argsInfo.server.prefixes.generic, "")
            .replace(this.command, "")
            .replace(this.source, "")
            .trim();
        if (!argument) argument = this.argsInfo.author.username;
        if (!/(?:^|\b)([a-z0-9][\w-]*[a-z0-9])$/i.test(argument)) throw "Invalid username.";
        return this._argument = argument;
    }

    get username() {
        if (this._username) return this._username;
        let username = this.argument.match(/(?:^|\b)([a-z0-9][\w-]*[a-z0-9])$/i)[1];
        return this._username = username;
    }

    get user() {
        if (this._user) return this._user;
        let arg = this.argument.replace(this.username, "").trim();
        if (!arg) return this._user = this.argsInfo.user;
        if (!this.argsInfo.Check.role(this.argsInfo.member, this.argsInfo.server.roles.admin)) throw "Insufficient permissions to perform this command.";
        let user = this.argsInfo.Search.users.get(arg);
        if (!user) throw "Invalid user given.";
        this._user = user;
    }

    get dbuser() {
        if (this._dbuser) return this._dbuser;
        let dbuser = DBuser.getUser(this.user);
        for (let _username in dbuser[this.source]) {
            if (_username.toLowerCase() === this._username.toLowerCase()) {
                this._username = _username;
            }
        }
        return this._dbuser = dbuser;
    }

}

class Tracker extends Parse {

	constructor(message, guildID) {
		super(message);
		if (guildID) this.message.guild = this.Search.guilds.byID(guildID);
	}

	get output() {
		let OutputConstructor = require("./output.js");
		return new OutputConstructor(this.message, this.msg);
	}

	async updateCycle () {
		let dbuser = this.LUTDU;
		if (!dbuser) return Logger.error("All users are up to date.");
        let sources = Object.values(config.sources).filter(source => dbuser[source.key]);
        this.track({dbuser, sources});
    }

	async run(command, args) { //both !remove and the linking commands start here
		try {/*
            let track = await new Track(this.message.content, this);
            this[track.command](track); /* */

			let username, _command, dbuser = this.dbuser;	//otherwise this.dbuser gets called by a getter every time. This way it gets cached
            if (command === "remove") _command = args.shift(); //it's all the same functions for `!remove just with one extra argument
			else {
				_command = command;
				command = "track";
			}
			let sources = Object.values(config.sources).filter(source => source.key === _command.toLowerCase().replace(/\./g, ""));
			if (args.length === 0) username = this.author.username;
			if (args.length === 1) username = args[0];
			if (args.length === 2) {
                if (!this.Permissions.role('admin', this)) throw this.Permissions.output('role');
				let user = this.Search.users.get(args[0]);
				if (!user) throw "Invalid user given.";
				this.user = user;
				this.member = this.Search.members.byUser(user);
				username = args[1];
			}			
			username = username.replace(/[^\w-]+/g, "");			
			if (!username.match(/[a-z0-9][\w-]*[a-z0-9]/i)) throw "Invalid username.";
			for (let _username in dbuser[sources[0].key])
				if (_username.toLowerCase() === username.toLowerCase()) username = _username;
			await this[command]({		dbuser, sources, username		});
			let newRole = this.Search.roles.get(this.server.roles.beta);
			if (!this.member.roles.has(newRole.id)) this.member.addRole(newRole).catch((e) => this.Output.onError(e));//*/
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	async update(argument) {
		try {
			let user = this.user;
			if (argument) {
				let _user = this.Search.users.get(argument);
				if (!_user) throw "Couldn't find user **" + argument + "**!";
				else user = _user;
			}
			let dbuser = DBuser.getUser(user);
			if (dbuser.username !== this.user.tag) dbuser.username = user.tag;
			let sources = Object.values(config.sources).filter(source => dbuser[source.key]);
			if (sources.length === 0) throw "No linked accounts found.\nPlease link an account to your profile through `!lichess\`, `!chess.com`, or `!bughousetest`.";
			if (this.command) this.msg = await this.Output.generic("Updating user " + dbuser.username + "...");
			await this.track({dbuser, sources});
		} catch (e) {
			if (e && this.command) this.Output.onError(e);
		}
    }
    
    async updateAll() {
        try {
            let mapper = [];
            let ids = [];
            let i = -1;
            let tally = DataManager.getFile();
            for (let dbuser of tally) {
                i++;
                if (!dbuser.lichess || !dbuser.lichess._main) continue;
                ids.push(dbuser.lichess._main);
                mapper.push(i);
            }
            let data = {
                "source": config.sources.lichess
            }
            let result = await Tracker.requestAll(data.source, ids);
            let successfulupdates = 0;
            for (let i = 0; i < result.length; i++) {
                let raw = result[i];
                if (!raw) continue;
                data.dbuser = tally[mapper[i]];
                let Constructor = require("./lichess.js");
                let parsedData = await new Constructor(raw, data);
                data = await new Assign(data, parsedData);                
                data.dbuser.lastupdate = Date.now(); //Mark the update time
                tally[mapper[i]] = data.dbuser;
                successfulupdates++;
            }            
            DataManager.setData(tally);
            this.Output.generic("Successfully updated " + successfulupdates + " users on " + data.sources.name + ".");
        } catch (e) {
            if (e) this.Output.onError(e);
        }
    }

	async track(data) {
		try {
			data.successfulupdates = [], data.errors = {};
			for (let source of data.sources) try {
				data.source = source;
				if (this.command && data.username && this.command !== "update") {
					if (data.dbuser[data.source.key] && data.dbuser[data.source.key][data.username]) throw `Already linked account.`;
					data = await Tracker.handle(data, this.msg);
				} else {
					for (let account in data.dbuser[data.source.key]) {
						if (account.startsWith("_") || !data.dbuser[data.source.key].hasOwnProperty(account)) continue;
						data.username = account;
						if (this.command) this.Output.editor({
							"description": "Updating user " + data.dbuser.username + "... on **" + data.source.name + "**"
						}, this.msg);
						data = await Tracker.handle(data, this.msg);
						data.username = "";
					}
				}
			} catch (e) {
				if (e) data.errors[data.source.key] = e;
			}
			data.dbuser.lastupdate = Date.now(); //Mark the update time
			DBuser.setData(data.dbuser); //set it
			if (data.successfulupdates.length > 0) {
				Logger.command({
					"author": {
						"tag": this.command ? this.author.tag : "auto"
					},
					"args": [data.dbuser.username, ...data.successfulupdates],
					"command": "update"
				}, {
					"file": "Tracker",
					"prefix": ""
				}); //log updates received as a command
			}
			if (this.command) this.output.track(data, this.msg);
		} catch (e) {
			if (e) throw e;
		}
	}

	async remove(data) {
		try {
			data.source = data.sources[0];
			let found = false, isMain = false, NoAccountsLeft = false;
			for (let account of Object.keys(data.dbuser[data.source.key])) {
				if (data.username && data.username.toLowerCase() === account.toLowerCase()) {
					found = true;
					delete data.dbuser[data.source.key][account];
					if (data.dbuser[data.source.key]._main === account) {
						isMain = true;
						data.dbuser[data.source.key]._main = "";
					}
					break;
				}
			}
			if (!found) throw this.Search.emojis.get(data.source.key) + "Couldn't remove " + data.username + "' on " + data.source.name + ": Couldn't find username linked to account.";
			for (let account of Object.keys(data.dbuser[data.source.key])) {
				if (account.startsWith("_")) {
					if (isMain) delete data.dbuser[data.source.key][account];
				} else {
					if (!data.dbuser[data.source.key]._main) data.dbuser[data.source.key]._main = account;
					NoAccountsLeft = true;
				}
			}
			if (!NoAccountsLeft) delete data.dbuser[data.source.key];
			DBuser.setData(data.dbuser);
			this.output.remove(data);
		} catch (e) {
			if (e) this.Output.onError(e);
		}
    }
     
    static async initUpdateCycle(client, guildID) {
		let Track = new Tracker({		client	}, guildID);
		Track.updateCycle();
	}

	get LUTDU() { //Least Up-to-Date User
        let currentValue = Infinity;
		return DataManager.getData().findd((dbuser) => {
			if (Object.values(config.sources).filter(source => dbuser[source.key]).length === 0) return false; //sources
            if (dbuser.left) return false;
            let user = this.Search.users.byID(dbuser.id);
            if (!user) return false;	
			if (!/^(?:online|idle|dnd)$/.test(user.presence.status)) return false;
			if (!dbuser.lastupdate) return true;
			if (dbuser.lastupdate < currentValue && dbuser.lastupdate < Date.now() - config.delays.repeat) {
				currentValue = dbuser.lastupdate;
				return true;
			}
        });      
	}

	static async handle(data) {
		try {
			let sourceData = await Tracker.request(data);
			if (!sourceData) throw "No source data.";
			let Constructor = require("./" + (data.source.key === "bughousetest" ? "lichess" : data.source.key) + ".js");
			let parsedData = await new Constructor(sourceData, {
					"source": data.source,
					"username": data.username
				});
			data = await new Assign(data, parsedData);
			return data;
		} catch (e) {
			throw e;
		}
	}

	static async request(data) {
		try {
			if (!data.username) throw "Invalid username.";
			try {
				let x = await
					rp({
						"uri": config.sources[data.source.key].url.user.replace("|", data.username),
						"json": true,
						"timeout": 2000
					});
				if (x) return x;
			} catch (e) {
				if (e) throw "Either request timed out or account doesn't exist. If account exists, please try again in 30 seconds.";
			}
		} catch (e) {
			if (e) throw e;
		}
    }
    
    static async requestAll(source, ids) {
		try {
            let options = {
                "method": "POST",
                "uri": config.sources[source.key].url.users,
                "body": {
                    "text": {
                        "plain": ids.join(",")
                    }
                },
                "timeout": 5000,
                "json": true
            };
            let data = await rp.post(options); //success, trainingSessionId, author, fen, whoseTurn, variant, additionalInfo, authorUrl, pocket, check
		} catch (e) {
			if (e) throw e;
		}
	}

}

module.exports = Tracker;