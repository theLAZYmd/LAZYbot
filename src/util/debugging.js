const DataManager = require("./datamanager.js");
const config = require("../config.json");

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
      };
      duplicates[tally[i].id] = true;
    };
    DataManager.setData(tally);
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
      };
      if(tally[i].lastmessagedate) {
        tally[i].messages.lastSeen = tally[i].lastmessagedate;
        delete tally[i].lastmessagedate;
      }
    };
    DataManager.setData(tally);
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
          };
          if(tally[i][source + "ratings"]) {
            updated[username] = tally[i][source + "ratings"];
            if(tally[i][source + "ratings"].cheating) {
              updated._cheating = tally[i][source + "ratings"].cheating
              delete tally[i][source + "ratings"].cheating;
              console.log("Noted cheater " + tally[i].username + ".")
            };
            delete tally[i][source + "ratings"];
          };
          tally[i][source] = updated;
          console.log("Completed for " + tally[i].username + " with source " + source + ".");
        };
      }
    };
    DataManager.setData(tally);
  }

  duplicateMains () {
    let tally = DataManager.getData();
    for(let i = 0; i < tally.length; i++) {
      for(let source in config.sources) {
        if(tally[i][source] && tally[i][source]._main._main) {
          tally[i][source] = tally[i][source]._main;
          console.log("Completed procedure for " + tally[i].username + ".");
        };
      }
    };
    DataManager.setData(tally);
  }

}

module.exports = Debugging;