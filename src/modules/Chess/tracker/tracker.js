const Parse = require('../../../util/parse');
const Embed = require('../../../util/embed');
const rp = require('request-promise');
const DataManager = require('../../../util/datamanager');
const DBuser = require('../../../util/dbuser');
const Logger = require('../../../util/logger');
const Assign = require('./assign');
const config = DataManager.getFile('./src/config.json');

const client = require('lichess');
const Lichess = new client();

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

    /**
     * @private
     */
	get output() {
		let OutputConstructor = require("./output.js");
		return new OutputConstructor(this.message, this.msg);
	}

    /**
     * @private
     */
	async updateCycle () {
		let dbuser = this.LUTDU;
        Tracker.lastDBuser = dbuser;
		if (!dbuser) {
            if (Tracker.lastDBuser) Logger.error("All users are up to date.");
            return;
        }
        let sources = Object.values(config.sources).filter(source => dbuser[source.key]);
        this.track({dbuser, sources});
    }

    /**
     * Creates a dialogue that allows a user to pick an account linked to their discord account and unlink it.
     * @param {DBUser} user
     * @prefix {generic}
     * @public
     */
    async remove(user = this.user) {
        try {
            if (this.argument) {
                if (!this.Permissions.role('admin', this)) throw this.Permissions.output('role');
                user = this.Search.users.get(this.argument);
                if (!user) throw new Error("Couldn't find user **" + this.argument + "** in this server");
            }
            let dbuser = DBuser.getUser(user);
            let accounts = [];
            for (let s of Object.keys(config.sources)) if (dbuser[s]) for (let a of Object.keys(dbuser[s])) {
                if (a.startsWith("_")) continue;
                accounts.push([s, a]);
            }
            let options = accounts.map(([source, username]) => this.Search.emojis.get(source) + " " + username);
            let val = await this.Output.choose({
                option: 'account to remove',
                options
            });
            let [source, account] = accounts[val];
            delete dbuser[source][account];
            if (dbuser[source]._main === account) for (let prop of dbuser[source]) if (prop.startsWith("_")) {
                delete dbuser[source][prop];
            }
            DBuser.setData(dbuser);
            this.Output.sender(new Embed()
                .setTitle(`Stopped tracking via ${this.prefix}remove command`)
                .setDescription(`Unlinked **${options[val]}** from ${user.tag}`)
                .setColor(config.colors.ratings)
            )
        } catch (e) {
            if (e) this.Output.onError(e);
        }
    }

    /**
     * Links a user's Discord account to an account on a specific API website, so-far support for Lichess.org and Chess.com
     * Called from {generic}lichess and {generic}chess.com commands
     * @param {string} command 
     */
	async run(command = this.command) { //both !remove and the linking commands start here
		try {
			let username, dbuser = this.dbuser;	//otherwise this.dbuser gets called by a getter every time. This way it gets cached
            let sources = Object.values(config.sources).filter(source => source.key === command.toLowerCase().replace(/\./g, ""));
            switch (this.args.length) {
                case (0):
                    username = this.author.username;
                    break;
                case (1):
                    username = this.args[0];
                    break;
                default:
                    if (!this.Permissions.role('admin', this)) throw this.Permissions.output('role');
                    let user = this.Search.users.get(this.argument);
                    username = this.args[0];
                    if (!user) throw new Error("Invalid user given **" + this.argument.slice(username.length) + "**");
                    this.user = user;
                    this.member = this.Search.members.byUser(user);
            }		
			username = username.replace(/[^\w-]+/g, "");			
			if (!username.match(/[a-z0-9][\w-]*[a-z0-9]/i)) throw new Error("Invalid syntax for a username.");
			for (let _username in dbuser[sources[0].key])
				if (_username.toLowerCase() === username.toLowerCase()) username = _username;
			await this.track({		dbuser, sources, username		});
			let newRole = this.Search.roles.get(this.server.roles.beta);
			if (!this.member.roles.has(newRole.id)) this.member.addRole(newRole).catch(this.Output.onError);
		} catch (e) {
			if (e) this.Output.onError(e);
		}
    }
    
    /**
     * Begins a new process to link accounts.
     * @param {Track} data 
     * @private
     */
    async track(data) {
		try {
			Object.assign(data, {
                successfulupdates: [],
                errors: {}
            });
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
			if (data.successfulupdates.length > 0) Logger.log(["Tracker", "update", "auto", "[" + [data.dbuser.username, ...data.successfulupdates].join(", ") + "]"]);
			if (this.command) this.output.track(data, this.msg);
		} catch (e) {
			if (e) throw e;
		}
    }

    async update(user = this.user) {
        try {
            if (this.argument) {
                if (!this.Permissions.role('admin', this)) throw this.Permissions.output('role');
                user = this.Search.users.get(this.argument);
                if (!user) throw new Error("Couldn't find user **" + this.argument + "** in this server");
            }
			let dbuser = DBuser.getUser(user);
			if (dbuser.username !== this.user.tag) dbuser.username = user.tag;
			let sources = Object.values(config.sources).filter(s => dbuser[s.key]);
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
            if (!user) return dbuser.left = true;	
			if (!/online|idle|dnd/.test(user.presence.status)) return false;
			if (!dbuser.lastupdate) return true;
			if (dbuser.lastupdate < currentValue && dbuser.lastupdate < Date.now() - config.delays.repeat) {
				currentValue = dbuser.lastupdate;
				return dbuser;
			}
        });      
	}

    /**
     * 
     * @param {Track} data 
     */
	static async handle(data) {
		try {
			if (!data.username) throw "Invalid username.";
			let sourceData = /lichess|bughousetest/.test(data.source.key) ? await Lichess.users.get(data.username) : await Tracker.request(data);
			if (!sourceData) throw new Error("No source data");
			let parsedData = /lichess|bughousetest/.test(data.source.key) ? sourceData : await new require('chesscom.js')(sourceData, data);
            data.dbuser = Tracker.assign(data, parsedData);
            data.successfulupdates.push(data.source.key);
			return data;
		} catch (e) {
			throw e;
		}
	}

    /**
     * Grabs JSON data from the API for all other (chess.com) sites
     * @param {Tracker} data 
     */
	static async request(data) {
        try {
            return await rp({
                "uri": config.sources[data.source.key].url.user.replace("|", data.username),
                "json": true,
                "timeout": 4000
            });
        } catch (e) {
            if (e) throw "Either request timed out or account doesn't exist. If account exists, please try again in 30 seconds.";
        }
    }    

    /**
     * Assigns parsed data from a chess website to the properties of the user in the database
     * @param {Track} data 
     * @param {LichessUser|ChesscomUser} parsedData 
     */
    static assign(data, parsedData) {
        console.log(parsedData.ratings);
        let dbuser = data.dbuser;
        let account = data.dbuser[data.source.key] || {
            "_main": parsedData.username
        };
        account[parsedData.username] = Tracker.parseRatings(parsedData.ratings);
        if (account._main === data.username) { //if it's the main one
            for (let prop of ["name", "country", "language", "title", "bio", "language"]) {
                if (parsedData[prop]) account["_" + prop] = parsedData[prop]; //grab info
                else if (account["_" + prop]) delete account["_" + prop]; //keeps it in sync - if excess data, delete it
            }
        }
        dbuser[data.source.key] = account;
        return dbuser;
    }

    /**
     * Transforms rating map into an object
     * @param {RatingStore} ratingObj 
     */
    static parseRatings(ratingObj) {
        return Array.from(ratingObj).reduce((acc, [key, value]) => {
            if (!value.rating) return acc;
            acc[key] = value.rating.toString() + (value.prov ? "?" : "");
            return acc;
        }, {})
    }

}

module.exports = Tracker;