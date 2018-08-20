const fs = require("fs");
const config = require("../config.json");

class DataManager {

  static getFile(newfilepath) { //basic file management. All files come through here
    return JSON.parse(fs.readFileSync(newfilepath, "utf8"));
  }

  static setFile(data, newfilepath) { //All files set through here
    fs.writeFileSync(newfilepath, JSON.stringify(data, null, 4));
  }

  static getData() { //get tally
    return DataManager.getFile(config.dataFile);
  }
  
  static setData(data) { //get tally
    return DataManager.setFile(data, config.dataFile);
  }

  static getServer(id, newfilepath) { //get server by:
    let filepath = newfilepath ? newfilepath : config.guildFile; //if a path is specified, it's not server.json
    let server = DataManager.getFile(filepath)[id]; //get the specific info for that server
    if(!server) { //if there's no data for that server
      let object = newfilepath ? {id} : Object.assign(config.servertemplate, {id}); //create a new object with object.id === the id in question
      DataManager.setServer(object, filepath); //set it
      console.log("Server " + object.id + " has been logged in the database!");
      return object; //and return the object
    };
    return server; //and return the object
  }

  static setServer(newServer, newfilepath) {
    let filepath = newfilepath ? newfilepath : config.guildFile; //if a path is provided, use it
    let allServer = DataManager.getFile(filepath); //get the file (the meta object)
    allServer[newServer.id] = newServer; //metaobject.id === the object
    DataManager.setFile(allServer); //and set it
  }

}

module.exports = DataManager;