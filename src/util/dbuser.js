const DataManager = require("./datamanager.js");
const config = require("../config.json");
const tally = DataManager.getData();
const sources = config.sources;

class DBuser {

  static setData (dbuser) {
    tally[DBuser.getfromid(dbuser.id)] = dbuser;
    DataManager.setData(tally);
  }

  static getfromuser(user) {
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
  
  static getfromusername(username) {
    return tally.find(dbuser => username === dbuser.username) || {};
  }
  
  static getfromid(id) {
    return tally.find(dbuser => id === dbuser.id) || {};
  }

  static getdbindex(dbuser) {
    return tally.findIndex(entry => dbuser.id === entry.id);
  }

  static getfromaliases(alias, exactmode) {
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