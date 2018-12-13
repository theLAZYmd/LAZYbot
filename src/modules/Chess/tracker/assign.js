const DataManager = require("../../util/datamanager.js");
const Countries = new Map(Object.entries(DataManager.getFile("./src/data/countries.json")));

class Data {

    constructor(data, parsedData) {
        this.data = data;
        this.parsedData = parsedData;
        for (let [k, v] of Object.entries(data))
            if (!this[k])
                this[k] = v;
        this.successfulupdates.push(data.source.key); //and push it to the updates information
    }

    get dbuser() {
        if (this._dbuser) return this._dbuser;
        let dbuser = this.data.dbuser;
        let account = dbuser[this.data.source.key] || {
            "_main": this.parsedData.username
        }; //get the "account" set of rating data for that source
        account[this.parsedData.username] = this.parsedData.ratings;
        if (account._main === this.username) { //if it's the main one
            let properties = ["_name", "_country", "_language", "_title"];
            for (let p of properties) {
                if (this.parsedData[p]) account[p] = this.parsedData[p]; //grab info
                else if (account[p]) delete account[p]; //keeps it in sync - if excess data, delete it
            }
            if (this.parsedData._country && !dbuser.location) dbuser.location = Countries.get(this.parsedData._country.toLowerCase());
        }
        dbuser[this.data.source.key] = account;
        delete this.data;
        return this._dbuser = dbuser;
    }

    get username() {
        if (this._username) return this._username;
        return this._username = this.parsedData.username;
    }

    set username(u) {
        return this._username = u;
    }

}

module.exports = Data;