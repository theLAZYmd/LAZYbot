const DataManager = require("./datamanager.js");
const Logger = require("../util/logger.js");
const User = require("../templates/dbuser.js");
const config = require("../config.json");

class DBuser {

	constructor() {}

	get tally() {
		if (this._tally) return this._tally;
		return this._tally = DataManager.getData();
	}

    setData(dbuser) {
        let tally = this.tally;
        tally[this.getIndex(dbuser)] = dbuser;
		DataManager.setData(tally);
		this._data = tally;
        return true;
    }

    /**
     * 
     * @param {DBuserResolvable} searchstring - looks through the database and searches for a match based on Aliases, Username, ID, or index
     * @param {Boolean} exactmode 
     */
    get(searchstring, exactmode) {
        let dbuser = null;
        if (typeof searchstring === "string") {
            if (!dbuser) dbuser = this.byAliases(searchstring, exactmode);
            if (!dbuser) dbuser = this.byUsername(searchstring);
            if (!dbuser) dbuser = this.byID(searchstring);
        } else if (typeof searchstring === "number") {
            if (!dbuser) dbuser = this.byIndex(searchstring);
        }
        return dbuser;
    }

    getUser(user) {
		let dbuser = this.byID(user.id);
        if (dbuser) return dbuser;
        dbuser = new User(user);
        let tally = this.tally;
        tally.push(dbuser);
        DataManager.setData(tally);
        Logger.log("User " + dbuser.username + " has been logged in the database!");
        return dbuser;
    }

    getIndex(dbuser) {
        return this.tally.map(dbuser => dbuser.id).indexOf(dbuser.id);
    }    

	byID(snowflake) {
		let id = snowflake.match(/[0-9]{18}/);
		return id ? this.tally.find(user => id[0] === user.id) : null;
	}
    byUsername(string) {
		let tag = string.match(/[\S \t^@#:`]{2,32}#\d{4}/);
		return tag ? this.tally.find(user => tag[0].toLowerCase() === user.tag.toLowerCase()) : null;
	}

    byIndex(index) {
        if (index < 0) return null;
        return typeof index === "number" && this.tally[index] ? this.tally[index] : null;
    }

    byAliases(alias, exactmode) {
        return this.tally.find((dbuser) => {
            for (let source of Object.keys(config.sources)) {
                if (typeof dbuser[source] === "object") {
                    for (let account of Object.keys(dbuser[source]).filter(a => !a.startsWith("_"))) {
                        if (!exactmode && account.toLowerCase().startsWith(alias.toLowerCase())) return true;
                        else if (exactmode && account.toLowerCase() === alias.toLowerCase()) return true;
                    }
                }
            }
            return false;
        })
    }

}

module.exports = new DBuser();