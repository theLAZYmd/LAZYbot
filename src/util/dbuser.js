const DataManager = require("./datamanager.js");
const config = require("../config.json");
const tally = DataManager.getData();

class DBuser {
  
  static setData (dbuser) {
    tally[DBuser.byID(dbuser.id)] = dbuser;
    DataManager.setData(tally);
  }

  static get(searchstring, exactmode) {
    let dbuser = "";
    if(!dbuser) dbuser = DBuser.byAliases(searchstring, exactmode);
    if(!dbuser) dbuser = DBuser.byUsername(searchstring);
    if(!dbuser) dbuser = DBuser.byID(searchstring);
    if(!dbuser) dbuser = DBuser.byIndex(searchstring);
    return dbuser;
  }

  static getUser(user) {
    let dbuser = tally.find(dbuser => dbuser.id === user.id);
    if(!dbuser) {
      console.log("No dbuser found, creating one...");
      let newuser = Object.assign({}, config.templates.dbuser);
      newuser.id = user.id;
      newuser.username = user.tag;
      tally.push(newuser);
      DataManager.setData(tally);
      console.log("User " + newuser.username + " has been logged in the database!");
      dbuser = tally.find(dbuser => user.id === dbuser.id);
    };
    return dbuser;
  }
  
  static byUsername(username) {
    return tally.find(dbuser => username === dbuser.username) || "";
  }
  
  static byID(id) {
    return tally.find(dbuser => id === dbuser.id) || "";
  }

  static byIndex(index) {
    if(typeof index === "number" && !!tally[index]) return tally[index];
    return "";
  }

  static byAliases(alias, exactmode) {
    for(let i = 0; i < tally.length; i++) {
      let dbuser = tally[i];
      for(let source in config.sources) {
        if(dbuser[source]) {
          for(let account in dbuser[source]) {
            if(!exactmode && account.toLowerCase().startsWith(alias.toLowerCase())) return dbuser;
            else if(exactmode && account.toLowerCase() === alias.toLowerCase()) return dbuser;
          }
        }
      }
    };
    return "";
  }

}

module.exports = DBuser;