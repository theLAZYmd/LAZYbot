const Parse = require('../../../util/parse');
const Embed = require('../../../util/embed');
const rp = require('request-promise');
const DataManager = require('../../../util/datamanager');
const DBuser = require('../../../util/dbuser');
const Logger = require('../../../util/logger');
const Commands = require('../../../util/commands');
const config = DataManager.getFile('./src/config.json');

const client = require('lichess');
const Lichess = new client();

/**
 * @typedef {object} TrackInput
 * @property {DBuser} dbuser
 * @property {Object[]} sources
 * @property {Object} source
 * @property {string} username
 */
class Track {

    constructor({argsInfo, dbuser, source, username}) {
        this.argsInfo = argsInfo;
        this.dbuser = dbuser;
        this.source = source;
        this.username = username;
        this.successfulUpdates = [];
        this.errors = [];
    }

    /**
     * Assigns parsed data from a chess website to the properties of the user in the database
     * @param {LichessUser|ChesscomUser} parsedData 
     */
    assign(parsedData) {
        let account = this.dbuser[this.source.key] || {    _main: parsedData.username      };
        account[parsedData.username] = Tracker.parseRatings(parsedData.ratings);
        if (account._main === parsedData.username) { //if it's the main one
            for (let prop of ["name", "country", "language", "title", "bio", "language"]) {
                if (parsedData[prop]) account["_" + prop] = parsedData[prop]; //grab info
                else if (account["_" + prop]) delete account["_" + prop]; //keeps it in sync - if excess data, delete it
            }
        }
        this.dbuser[data.source.key] = account;
        return this;
    }

    async output() {
        try {
            const whitespace = "      \u200B";
            let errors = "";
            let embed = new Embed()
                .setColor(this.argsInfo.server.colors.ratings);
            for (let source of this.sources) {
                for (let account of (this.command === "update" ? Object.keys(this.dbuser[source.key]) : [this.username])) try {
                    if (account.startsWith("_")) continue;
                    if (!data.successfulupdates.includes(source.key)) errors += this.argsInfo.Search.emojis.get(source.key) + " Couldn't " + (this.command === "update" ? "update '" : "link to '") + account + "' on " + source.name + (data.errors[source.key] ? ": " + data.errors[source.key] : ".") + "\n";
                    else embed.addField(
                        `${this.argsInfo.Search.emojis.get(source.key)} ${this.command === "update" ? "Updated" : `Linked ${this.user.username} to`} '${account}'`,
                        Parse.profile(data.dbuser, source, account) + "\nCurrent highest rating is **" + data.dbuser[source.key][account].maxRating + "**" + whitespace + "\n" + Parse.ratingData(data.dbuser, source, account),
                        true
                    )
                } catch (e) {
                    if (e) throw e;
                }
            }
            if (embed.fields.length > 0) this.Output[this.command === "update" ? "editor" : "sender"](embed, this.msg);
            if (errors) throw errors;
        } catch (e) {
            if (e) this.argsInfo.Output.onError(e);
        }
    }

    setError() {
        this.errors.push([this.source.key, this.username]);
        return this;
    }

    setSuccess() {
        this.successfulUpdates.push([this.source.key, this.username]);
        return this;
    }

    async setData () {
        DBuser.setData(this.dbuser);
    }

    set username (username) {
        username = username.replace(/[^\w-]+/g, "");			
        if (!username.match(/[a-z0-9][\w-]*[a-z0-9]/i)) throw new Error("Invalid syntax for a username.");
        for (let u in this.dbuser[this.sources[0].key]) {
            if (u.toLowerCase() === username.toLowerCase()) {
                username = u;
            }
        }
    }

    get sources() {
        if (this._sources) return this._sources;        
        return this._sources = Object.values(config.sources).filter(s => this.dbuser[s.key]);
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
     * Grabs 
     * @private
     */
	async updateCycle () {
		let dbuser = this.nextUpdate();
        Tracker.lastDBuser = dbuser;
		if (!dbuser) return Logger.error("All users are up to date.");
        this.track(new Track({argsInfo: this, dbuser}));
    }

    /**
     * Links a user's Discord account to an account on a specific API website, so-far support for Lichess.org and Chess.com
     * Called from {generic}lichess and {generic}chess.com commands
     * @param {string} command 
     */
	async run(command = this.command, dbuser = this.dbuser, username = "") {
		try {
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
                    dbuser = DBuser.getUser(user);
            }
            let source = Object.values(config.sources).find(s => s.key === command.toLowerCase().replace(/\./g, ""));
            let data = new Track({argsInfo: this, dbuser, source, username});
		} catch (e) {
			if (e) this.Output.onError(e);
		}
    }
    
    /**
     * Begins a new process to link accounts.
     * @param {TrackData} data 
     * @private
     */
    async track(data) {
		try {
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
            let data = new Track({argsInfo: this, dbuser});
			if (data.sources.length === 0) throw `No linked accounts found.\nPlease link an account to your profile through \`${this.generic}lichess\`, \`${this.generic}chess.com\`, or \`${this.generic}bughousetest\`.";
			if (this.command) this.msg = await this.Output.generic("Updating user " + dbuser.username + "...");
			await this.track({dbuser, sources});
		} catch (e) {
			if (e && this.command) this.Output.onError(e);
		}
    }
    
    async updateAll() {
        try {
            let accounts = Commands.accounts;
            let arr = Array.from(accounts.keys());
            let arrs = [];
            while (ids.length > 0) {
                arrs = arrs.concat(arr.splice(0, 48));
            }
            let DataStore = new Map();
            let msg = await this.Output.generic(`Updating data on ${arr.length} Lichess accounts...`);
            for (let i = 0; i < arrs.length; i++) {
                let ids = arrs[i];
                let users = await Lichess.users.get(ids);
                users.tap(async (id, parsedData) => {
                    let data = DataStore.get(id) || new Track({dbuser});
                    data.assign(parsedData);
                })
                await this.Output.editor({  description: `Updated data on ${Math.max(48 * (i + 1), arr.length)} / ${arr.length}`}, msg);
                await timeout(3000);
            }
            DataStore.forEach(data => data.setData());
        } catch (e) {
            if (e) this.Output.onError(e);
        }
    }

	nextUpdate() { //Least Up-to-Date User
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
     * @param {TrackData} data 
     */
	static async handle(data) {
		try {
			let sourceData = /lichess|bughousetest/.test(data.source.key) ? await Lichess.users.get(data.username) : await new require('chesscom.js')(await Tracker.request(data), data);
			if (!sourceData) throw data.setError('No responce received');
            data.assign(parsedData).setSuccess();
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
     * Transforms rating map into an object
     * @param {RatingStore} ratingObj 
     */
    static parseRatings(ratingObj) {
        return Array.from(ratingObj).reduce((acc, [key, value]) => {
            if (!value.rating) return acc;
            acc[key] = value.rating.toString() + (value.prov ? "?" : "");
            if (value.rating > acc.maxRating && !value.prov) acc.maxRating = value.rating;
            return acc;
        }, {
            maxRating: 0
        });
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

}

module.exports = Tracker;

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}