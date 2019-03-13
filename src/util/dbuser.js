const DataManager = require("./datamanager.js");
const Logger = require("../util/logger.js");
const User = require("../templates/dbuser.js");
const config = require("../config.json");

class DBuser {

    static async setData(dbuser) {
        let tally = DataManager.getData();
        tally[DBuser.getIndex(dbuser)] = dbuser;
        DataManager.setData(tally);
        return true;
    }

    static get(searchstring, exactmode) {
        let dbuser = "";
        if (!dbuser) dbuser = DBuser.byAliases(searchstring, exactmode);
        if (!dbuser) dbuser = DBuser.byUsername(searchstring);
        if (!dbuser) dbuser = DBuser.byID(searchstring);
        if (!dbuser) dbuser = DBuser.byIndex(searchstring);
        return dbuser;
    }

    static getUser(user) {
        let tally = DataManager.getData();
        let dbuser = tally.find(dbuser => dbuser.id === user.id);
        if (dbuser) return dbuser;
        dbuser = new User(user);
        tally.push(dbuser);
        DataManager.setData(tally);
        Logger.log("User " + dbuser.username + " has been logged in the database!");
        return dbuser;
    }

    static getIndex(dbuser) {
        return DataManager.getData()
            .map(dbuser => dbuser.id)
            .indexOf(dbuser.id);
    }

    static byUsername(username) {
        return DataManager.getData().find(dbuser => username === dbuser.username);
    }

    static byID(id) {
        return DataManager.getData().find(dbuser => id === dbuser.id);
    }

    static byIndex(index) {
        let tally = DataManager.getData();
        return typeof index === "number" && tally[index] ? tally[index] : null;
    }

    static byAliases(alias, exactmode) {
        return DataManager.getData().find((dbuser) => {
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

module.exports = DBuser;