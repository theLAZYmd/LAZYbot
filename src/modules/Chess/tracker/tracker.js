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
 * @property {string} username
 */
class Track {

    constructor(argsInfo, dbuser) {
        this.successes = [];
        this.errors = [];
        this.argsInfo = argsInfo;
        this.dbuser = dbuser;
    }

    /**
     * Returns whether this Track instance was initiated by a command (true) or automatically (false)
     * @name Track#command
     * @type {Boolean}
     */
    get command() {
        this._command = this.argsInfo.command
        return Boolean(this._command);
    }
    
    /**
     * Returns the list of sources for which the DBuser can validly be updated
     * @name Track#sources
     * @type {Array}
     */
    get sources() {
        if (this._sources) return this._sources;
        return this._sources = Object.values(config.sources).filter(s => this.dbuser[s.key]);
    }

    /**
     * Sets the source property of the Track instance to a source object ready to grab data from
     * @name Track#source
     * @param {Object} source 
     */
    setSource(source) {
        this.source = source;
        return this;
    }

    /**
     * Sets the username property of the Track instance to a given username
     * @name Track#username
     * @param {string} username 
     */
    setUsername(username) {
        username = username.replace(/[^\w-]+/g, "");			
        if (!username.match(/[a-z0-9][\w-]*[a-z0-9]/i)) throw new Error("Invalid syntax for a username.");
        for (let s of this.sources) {
            for (let u in this.dbuser[s.key]) {
                if (u.toLowerCase() === username.toLowerCase()) {
                    username = u;
                }
            }
        }
        this.username = username;
        return this;
    }

    /**
     * Sets a message to be edited in a command-called update embed
     * @name Track#message
     * @param {Message} message
     */
    setMessage(message) {
        this.message = message;
    }

    setError(e) {
        this.errors.push([this.source.key, this.username, e]);
        return this;
    }

    setSuccess() {
        this.successes.push([this.source.key, this.username]);
        return this;
    }

    /**
     * Edits a running embed for an update command
     * @private
     */
    async edit() {
        if (this.command) this.argsInfo.Output.editor({
            description: `Updating user ${this.dbuser.username}... on **${this.source.name}**`
        }, this.message);
    }
    
    /**
     * Logs the list of accounts that have been updated to the console
     * @private
     */
    async log() {
        if (this.successes.length === 0) return;
        Logger.log(["Tracker", "update", "auto", "[" + [this.dbuser.username, ...(this.successes.map(s => `${s[0]}: ${s[1]}`))].join(", ") + "]"]);
    }

    async getData() {
        let parsedData = /lichess|bughousetest/.test(this.source.key) ? await Lichess.users.get(this.username) : await (new require('chesscom.js'))(await Tracker.request(this), this);
        if (!parsedData) throw "No response received";
        this.assign(parsedData);
        this.setSuccess();
        return this;
    }
    
    /**
     * Assigns parsed data from a chess website to the properties of the user in the database. Follows on from getting data
     * @param {LichessUser|ChesscomUser} parsedData
     * @private
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
        this.dbuser[this.source.key] = account;
        return this;
    }
    
    /**
     * Sets the modified data for a DBuser to the database
     * @private
     */
    async setData() {
        if (this.dbuser.lastupdate) delete this.dbuser.lastupdate;
        this.dbuser.lastUpdate = Date.now();
        DBuser.setData(this.dbuser);
        this.log();        
        if (this.command) this.output();
        return this;
    }
    
    /**
     * Outputs the result of a new link or update
     * @private
     */
    async output() {
        try {
            const whitespace = "      \u200B";
            let errors = [];
            let embed = new Embed().setColor(this.argsInfo.server.colors.ratings);
            let sources = this._command === "update" ? this.sources : [this.source];
            for (let source of sources) {                
                let accounts = this._command === "update" ? Object.keys(this.dbuser[source.key]) : [this.username];
                for (let account of accounts) if (!account.startsWith("_")) {
                    if (this.successes.every(([s, a]) => s !== source.key && a !== account)) errors.push(`${this.argsInfo.Search.emojis.get(source.key)} Couldn't ${this._command === "update" ? "update" : "link to"} '${account}' on ${source.name}${this.errors.find(([s, a]) => s === source.key && a === account) ? `: ${this.errors[source.key]}` : "."}`);
                    else embed.addField(
                        `${this.argsInfo.Search.emojis.get(source.key)} ${this.command === "update" ? "Updated" : `Linked ${this.dbuser.username} to`} '${account}'`,
                        Parse.profile(this.dbuser, source, account) + "\nCurrent highest rating is **" + this.dbuser[source.key][account].maxRating + "**" + whitespace + "\n" + Parse.ratingData(this.dbuser, source, account),
                        true
                    )
                }
            }
            if (embed.fields.length > 0) this.argsInfo.Output[this.command === "update" ? "editor" : "sender"](embed, this.msg);
            if (errors.length) throw errors.join("\n");
        } catch (e) {
            if (e) this.argsInfo.Output.onError(e);
        }        
        return this;
    }

}

class Tracker extends Parse {

	constructor(message, guildID) {
		super(message);
		if (guildID) this.message.guild = this.Search.guilds.byID(guildID);
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
            if (dbuser[source.key] && dbuser[source.key][username]) throw "Already linked account.";
            let data = new Track(this, dbuser);
            await data.setSource(source).setUsername(username).getData();
            data.setData();
		} catch (e) {
			if (e) this.Output.onError(e);
		}
    }

    /**
     * 
     * @param {*} user 
     */
    async update(dbuser = this.dbuser) {
        try {
            if (this.argument) {
                if (!this.Permissions.role('admin', this)) throw this.Permissions.output('role');
                user = this.Search.users.get(this.argument);
                if (!user) throw new Error("Couldn't find user **" + this.argument + "** in this server");
                dbuser = DBuser.getUser(user);
            }
            if (this.user && dbuser.username !== this.user.tag) dbuser.username = user.tag;            
            let data = new Track(this, dbuser);
            try {
                if (data.sources.length === 0) throw `No linked accounts found.\nPlease link an account to your profile through \`${this.generic}lichess\`, \`${this.generic}chess.com\`, or \`${this.generic}bughousetest\`.`;
                if (this.command) data.msg = await this.Output.generic("Updating user " + dbuser.username + "...");
                for (let source of data.sources) for (let account of Object.keys(data.dbuser[data.source.key])) if (!account.startsWith("_")) {
                    if (data.command) data.edit();
                    await data.setSource(source).setUsername(account).getData();
                    data.setUsername();
                }
            } catch (e) {
                if (e) data.setError(e);
            }
		} catch (e) {
			if (e && this.command) this.Output.onError(e);
		}
    }
    
    /**
     * Grabs the least up to date user in the database and runs them through the update process, without outputting a result
     * @private
     */
	async updateCycle () {
		let dbuser = this.nextUpdate();
        Tracker.lastDBuser = dbuser;
		if (!dbuser) return this.error("All users are up to date.");
        this.update(dbuser);
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
                    let data = DataStore.get(id) || new Track(this, DBuser.byID(id));
                    data.assign(parsedData);
                    DataStore.set(id, dbuser);  
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
			if (!dbuser.lastUpdate) return true;
			if (dbuser.lastUpdate < currentValue && dbuser.lastUpdate < Date.now() - config.delays.repeat) {
				currentValue = dbuser.lastUpdate;
				return dbuser;
			}
        });      
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