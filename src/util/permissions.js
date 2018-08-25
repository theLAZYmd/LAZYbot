const Parse = require("./parse.js");
const DataManager = require("./datamanager.js");
const config = DataManager.getFile("./src/config.json");

class Permissions extends Parse {

  constructor(message) {
    super(message);
  }

  async house (requirement, argsInfo) {
    if (requirement && argsInfo.guild.id !== config.houseid) return false;
    return true;
  }
  
  async user (requirement, argsInfo) {
    let value = config.ids[requirement];
    if (!value) return true;
    if (typeof value === "string" && value === argsInfo.author.id) return true;
    else if (Array.isArray(value)) {
      for(let passable of value)
        if (passable === argsInfo.author.id) return true; //if Array. No support for object.
    }
    return false;
  }

  async role (roleType, argsInfo) { //admin, {object}
    for (let _roleType in argsInfo.server.roles) { //
      if (roleType === _roleType) {
        let roleName = argsInfo.server.roles[_roleType];
        if (!this.guild.roles.some(role => role.name = roleName) || !roleName) return true;
        return argsInfo.member.roles.some(role => role.name.toLowerCase().startsWith(roleName));
      }
    };
    return false;
  }

  async channels (channelName, data) {
    if (!this.guild.channels.some(channel => channel.name = channelName)) channelName === "general";
    return data.channel.name.toLowerCase() === data.server.channels[channelName].toLowerCase();
  }

  async state (state, data) {
    return data.server.states[state.toLowerCase()];
  }

  async bot (bot, data) {
    return data.author.bot === bot;
  }

  async args (data, argsInfo) {
    if (data.length) {
      if (typeof data.length === "number") {
        if (argsInfo.args.length === data.length) return true;
      } else {
        for (let value of data.length) {
          if (argsInfo.args.length === value) return true;
        }
      }
    }
    return false;
  }

  async response (recipient, argsInfo) {
    try {
      return !(await argsInfo.channel.awaitMessages((m) => m.author.id === config.ids[recipient] && m.embeds && m.embeds[0], {
        "time": 2000,
        "max": 1
      }))
    } catch (e) {
      if (e) console.log(e);
    }
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