const DataManager = require("./datamanager.js");
const config = require("../config.json");
const tally = DataManager.getData();
const sources = config.sources;

class DBuser {
  
  static setData (dbuser) {
    tally[DBuser.byID(dbuser.id)] = dbuser;
    DataManager.setData(tally);
  }

  static get(searchstring, message) {
    let dbuser = "";
    if(message) dbuser = (new require("./search.js"))(message).get(searchstring).id || "";
    if(!dbuser) dbuser = DBuser.byUser(searchstring);
    if(!dbuser) dbuser = DBuser.byUsername(searchstring);
    if(!dbuser) dbuser = DBuser.byID(searchstring);
    if(!dbuser) dbuser = DBuser.byIndex(searchstring);
    if(!dbuser) dbuser = DBuser.byAliases(searchstring);
    return dbuser;
  }

  static byUser(user) {
    let dbuser = tally.find(dbuser => dbuser.id === user.id);
    if(!dbuser) {
      console.log("No dbuser found, creating one...");
      let newuser = config.templates.dbuser;
      newuser.id = user.id;
      newuser.username = user.tag;
      if(tally[0]) tally.push(newuser);
      else tally[0] = newuser;
      DataManager.setData(tally);
      console.log("User " + newuser.username + " has been logged in the database!");
      dbuser = tally.find(dbuser => user.id === dbuser.id);
    };
    return dbuser;
  }
  
  static byUsername(username) {
    return tally.find(dbuser => username === dbuser.username) || {};
  }
  
  static byID(id) {
    return tally.find(dbuser => id === dbuser.id) || {};
  }

  static byIndex(dbuser) {
    return tally.findIndex(entry => dbuser.id === entry.id);
  }

  static byAliases(alias, exactmode) {
    for(let i = 0; i < tally.length; i++) {
      for(let j = 0; j < sources.length; j++) {
        let dbuser = tally[i]
        let source = sources[j][1];
        if(dbuser[source]) {
          if(!exactmode && dbuser[source].toLowerCase().startsWith(alias.toLowerCase())) return dbuser;
          else if(exactmode && dbuser[source].toLowerCase() === alias.toLowerCase()) return dbuser;
        }
      }
    };
    return "";
  }

}

module.exports = DBuser;