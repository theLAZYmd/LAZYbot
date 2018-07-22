const fs = require("fs");
const config = require("../config.json");

class DataManager {

  static getData() {
    return JSON.parse(fs.readFileSync(config.dataFile, "utf8"));
  }
  
  static setData(data) {
    fs.writeFileSync(config.dataFile, JSON.stringify(data, null, 4));
  }

  static getFile(newfilepath) {
    return JSON.parse(fs.readFileSync(newfilepath, "utf8"));
  }

  static setFile(data, newfilepath) {
    fs.writeFileSync(newfilepath, JSON.stringify(data, null, 4));
  }

  static getServer(guild) {
    let server = JSON.parse(fs.readFileSync(config.guildFile, "utf8"))[guild.id];
    if(!server) {
      console.log("No server found, creating one...");
      let newserver = config.servertemplate;
      newserver.id = serverid;
      DataManager.setServer(newserver);
      console.log("Server " + serverid + " has been logged in the database!");
      server = newserver[serverid];
    };
    return server;
  }

  static setServer(newServer) {
    let allServer = DataManager.getFile(config.guildFile);
    allServer[newServer.id] = newServer;
    fs.writeFileSync(config.guildFile, JSON.stringify(allServer, null, 4));
  }

}

module.exports = DataManager;