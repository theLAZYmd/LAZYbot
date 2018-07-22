const Parse = require("../util/parse.js");

class Shadowban extends Parse {

  constructor(message) {
    super(message)
  }

  log(server, user) {
    server.shadowbanned && server.shadowbanned[0] ? server.shadowbanned.push([user.id, false]) : server.shadowbanned = []; server.shadowbanned[0] = [user.id, false];
    DataManager.setServer(server);
  }
  
  ban(server, user) {
    for(let i = 0; i < server.shadowbanned.length; i++) {
      if(user.id === server.shadowbanned[i][0] && !server.shadowbanned[i][1]) {
        server.shadowbanned[i][1] = true;
        DataManager.setServer(server);
      }
    }
  }
  
  liberate(server, user) {
    for(let i = 0; i < server.shadowbanned.length; i++) {
      if(user.id === server.shadowbanned[i][0] && server.shadowbanned[i][1]) {
        server.shadowbanned[i][1] = false;
        DataManager.setServer(server);
      }
    }
  }
  
  execute(message, server) {
    var boolean;
    for(let i = 0; i < server.shadowbanned.length; i++) {
      if(message.author.id === server.shadowbanned[i][0] && server.shadowbanned[i][1]) {
        message.delete();
        boolean = true;
      }
    }
    return boolean;
  }

}

module.exports = Shadowban;