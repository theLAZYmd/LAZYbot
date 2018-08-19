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

  static output (key, prefix) {
    let data = [

    ];
    for(let i = 0; i < data.length; i++) {
      if(key === data[0]) return "Wrong permissions to use this command! " + data[1] + "\nPlease use the `" + prefix + "help` command to view information about a command.";
    }
  }

}

module.exports = Permissions;