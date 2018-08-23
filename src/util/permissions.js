const Parse = require("./parse.js");
const DataManager = require("./datamanager.js");
const config = DataManager.getFile("./src/config.json");

class Permissions extends Parse {

  constructor(message) {
    super(message);
  }
  
  user (requirement, argsInfo) {
    for (let id in config.ids) {
      if (requirement === id) {
        let value = config.ids[id];
        if (typeof value === "string") {
          if(value === argsInfo.author.id) return true;
        } else {
          for(let i = 0; i < value.length; i++) {
            if (value[i] === argsInfo.author.id) return true; //if Array. No support for object.
          }
        }
      }
    };
    return false;
  }

  role (roleType, argsInfo) { //admin, {object}
    for(let _roleType in argsInfo.server.roles) { //
      if (roleType === _roleType) {
        let roleName = argsInfo.server.roles[_roleType];
        if (!this.guild.roles.some(role => role.name = roleName) || !roleName) return true;
        return argsInfo.member.roles.some(role => role.name.toLowerCase().startsWith(roleName));
      }
    };
    return false;
  }

  channels (channelName, data) {
    if (!this.guild.channels.some(channel => channel.name = channelName)) channelName === "general";
    return data.channel.name.toLowerCase() === data.server.channels[channelName].toLowerCase();
  }

  state (state, data) {
    return data.server.states[state.toLowerCase()];
  }

  bot (bot, data) {
    return data.author.bot === bot;
  }

  args (data, argsInfo) {
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

  output (key, argsInfo) {
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