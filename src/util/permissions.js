const config = require("../config.json")

class Permissions {
  
  static user (requirement, argsInfo) {
    for(let id in config.ids) {
      if(requirement === id) {
        let value = config.ids[id];
        if(typeof value === "string") {
          if(value === argsInfo.author.id) return true;
        } else {
          for(let i = 0; i < value.length; i++) {
            if(value[i] === argsInfo.author.id) return true; //if Array. No support for object.
          }
        }
      }
    };
    return false;
  }

  static role (roleType, argsInfo) { //admin, {object}
    for(let _roleType in argsInfo.server.roles) { //
      if(roleType === _roleType) {
        let roleName = argsInfo.server.roles[_roleType];
        if(argsInfo.member.roles.some(role => role.name.toLowerCase().startsWith(roleName))) return true;
      }
    };
    return false;
  }

  static channel (channelName, data) {
    return data.channel.name.toLowerCase() === data.server.channels[channelName].toLowerCase();
  }

  static state (state, data) {
    return data.server.states[state.toLowerCase()];
  }

  static args (data, argsInfo) {
    if (data.length) {
      if (typeof data.length === "number") {
        if (argsInfo.args.length === data.length) return true;
      } else {
        for(let i = 0; i < data.length.length; i++) {
          if (argsInfo.args.length === data.length[i]) return true;
        }
      }
    }
    return false;
  }

  static output (key, argsInfo) {
    switch (key) {
      case "role":
        return "Insufficient server permissions to use this command."
      case "channel":
        return "Wrong channel to use this command."
      case "args":
        return "Unapplicable number of parameters."
    }
  }

}

module.exports = Permissions;