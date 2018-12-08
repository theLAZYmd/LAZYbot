const DataManager = require("./datamanager.js");
const config = require("../config.json");
const Logger = require("./logger.js");

class Debugging {

  constructor(client) {
    this.client = client;
    this.guild = this.client.guilds.get(config.houseid);
  }

  get tally () {
    return DataManager.getData();
  }

  removeDuplicates () {
    let tally = DataManager.getData();
    let duplicates = {};
    for(let i = 0; i < tally.length; i++) {
      if(duplicates[tally[i].id]) {
        tally.splice(i, 1);
        i--;
        continue;
      }
	    duplicates[tally[i].id] = true;
    }
	  DataManager.setData(tally);
    return "Done!";
  }

  convertCounttoObject () {
    let tally = DataManager.getData();
    for(let i = 0; i < tally.length; i++) {
      let count = tally[i].messages;
      if(typeof count === "number") {
        tally[i].messages = {
          "count": count
        };
      }
      if(tally[i].lastmessage) {
        tally[i].messages.last = tally[i].lastmessage;
        delete tally[i].lastmessage;
      }
	    if(tally[i].lastmessagedate) {
        tally[i].messages.lastSeen = tally[i].lastmessagedate;
        delete tally[i].lastmessagedate;
      }
    }
	  DataManager.setData(tally);
    return "Done!";
  }

  updateDBUserFormat () {
    let tally = DataManager.getData();
    for(let i = 0; i < tally.length; i++) {
      for(let source in config.sources) {
        if(tally[i][source] && typeof tally[i][source] === "string") {
          let username = tally[i][source];
          let updated = {
            "_main": username
          };
          if(tally[i].title) {
            if(source === "lichess") updated._title = tally[i].title;
            delete tally[i].title;
          }
	        if(tally[i][source + "ratings"]) {
            updated[username] = tally[i][source + "ratings"];
            if(tally[i][source + "ratings"].cheating) {
              updated._cheating = tally[i][source + "ratings"].cheating;
              delete tally[i][source + "ratings"].cheating;
              Logger.log("Noted cheater " + tally[i].username + ".")
            }
	          delete tally[i][source + "ratings"];
          }
	        tally[i][source] = updated;
          Logger.log("Completed for " + tally[i].username + " with source " + source + ".");
        }
      }
    }
	  DataManager.setData(tally);
    return "Done!"
  }

  duplicateMains () { //there was an account._main._main issue going on for a while
    let tally = DataManager.getData();
    for(let i = 0; i < tally.length; i++) {
      for(let source in config.sources) {
        if(tally[i][source] && tally[i][source]._main._main) {
          tally[i][source] = tally[i][source]._main;
          Logger.log("Completed procedure for " + tally[i].username + ".");
        }
      }
    }
	  DataManager.setData(tally);
    return "Done!";
  }

  setField (arg, type) { //sets each dbuser[arg] to thing
    let tally = DataManager.getData();
    let newfield = arg.replace(/[^\w]/g,"");
    for(let dbuser of tally)
      dbuser[newfield] = type ? type : "";
    DataManager.setData(tally);
    return "New field **" + newfield + "** added to each user in db.";
  }

  deleteField (arg) { //deprecated
    let tally = DataManager.getData();
    let oldfield = arg.replace(/[^\w]/g,"");
    for(let dbuser of tally)
      delete dbuser[oldfield];
    DataManager.setData(tally);
    return "Field **" + newfield + "** deleted from each user in db.";
  }

}

module.exports = Debugging;