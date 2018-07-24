const config = require("../config.json")

class Permissions {
  
  static user (userID) {
    for(let id in config.ids) {
      let value = config.ids[id];
      if(typeof value === "string") {
        if(config.ids[i] === userID) return true;
      } else {
        for(let i = 0; i < value.length; i++) {
          if(value[i] === userID) return true; //if Array. No support for object.
        }
      }
    };
    return false;
  }

  static role (roleID, argsInfo) { //TO BE ADDED
  }

  static channel (channelName, data) {
    let id = data.server.channels[channelName];
    return data.channel.id === id;
  }

  static state (state, data) {
    return data.server.states[state.toLowerCase()];
  }

}

module.exports = Permissions;