const Parse = require("./parse.js");
const DataManager = require("./datamanager.js");
const Commands = require("../data/commands.json");
const allMessageCommands = require("../data/allmessagecommands.json");
const DMCommands = require("../data/dmcommands.json");
const IntervalCommands = require("../data/intervalcommands.json");
const Permissions = require("./permissions.js");
const DM = require("../modules/dm.js");

class Router {

  static async presence(oldMember, newMember) {
    let Constructor = require("../modules/presence.js");
    let Instance = new Constructor({
      "guild": oldMember.guild,
      "member": oldMember
    });
    if (oldMember.user.bot) Instance.bot(oldMember.presence, newMember.presence);
    Instance.streamer(oldMember.presence, newMember.presence);
  }

  static async reaction(messageReaction, user) {
    const reactionmessages = DataManager.getFile("./src/data/reactionmessages.json")[messageReaction.message.guild.id];
    for (let type in reactionmessages) {
      for (let messageID in reactionmessages[type]) {
        if (messageReaction.message.id === messageID) {
          let Constructor = require("../modules/" + type + ".js")
          let Instance = new Constructor(messageReaction.message);
          Instance.react(messageReaction, user, reactionmessages[type][messageID]);
        }
      }
    }
  }

  static async intervals() {
    try {
      for (let cmdInfo of IntervalCommands) {
        if (!cmdInfo.file || !cmdInfo.method || !cmdInfo.args || !cmdInfo.interval) continue;
        setInterval(async () => {
          let Constructor = require("../modules/" + cmdInfo.file + ".js");
          await Constructor[cmdInfo.method](...cmdInfo.args);
        }, cmdInfo.interval)
      }
    } catch (e) {
      if (e) console.log(e);
    }
  }

  static async message(data) {
    try {
      data = await Router.checkErrors(data);
      if (!data.argsInfo.author.bot && (data.message.channel.type === "dm" || data.message.channel.type === "group" || !data.message.guild)) {
        await Router.DM(data);
        throw "";
      };
      Router.all(data);
      Router.command(data);
    } catch (e) {
      if (e && typeof e !== "boolean") console.log(e);
    }
  }

  static async checkErrors(data) {
    try {
      if (data.message.author.id === data.client.user.id) throw "";
      if (data.message.content.length === 1) throw "";
      data.client.reboot = data.readyTimestamp;
      data.argsInfo = new Parse(data.message);
      return data;
    } catch (e) {
      throw e;
    }
  }

  static async DM(_data) {
    try {
      for (let i = 1; i < DMCommands.length; i++) {
        let data = Object.assign({}, _data);
        let cmdInfo = Object.assign({
          "prefix": ""
        }, DMCommands[i]);
        if (cmdInfo.active === false) continue;
        if (!cmdInfo.regex && !cmdInfo.aliases) continue;
        if (cmdInfo.regex) {
          let regex = new RegExp(cmdInfo.regex, "mg");
          if (regex.test(data.argsInfo.message.content) === false) continue;
        };
        if (cmdInfo.aliases && (!cmdInfo.aliases.inArray(data.argsInfo.command) || data.argsInfo.prefix !== cmdInfo.prefix)) continue;
        if (cmdInfo.guild) {
          let guild = await DM.setGuild(data.argsInfo, cmdInfo.guild); //now passed, just check if it needs a guild
          if (!guild) throw "";
          data.message._guild = guild;
        };
        Router.runCommand(data.message, data.argsInfo, cmdInfo);
        throw "";
      };
      let data = Object.assign({}, _data);
      if (DMCommands[0].guild) {
        let guild = await DM.setGuild(_data.argsInfo, DMCommands[0].guild); //now passed, just check if it needs a guild
        if (!guild) throw "";
        data.message._guild = guild;
      };
      let run = await Router.runCommand(data.message, data.argsInfo, DMCommands[0]);
      if (run) await Router.logCommand(data.argsInfo, DMCommands[0]);
    } catch (e) {
      if (e) _data.argsInfo.Output.onError(e);
    }
  }

  static async all(data) {
    try {
      for (let cmdInfo of allMessageCommands) {
        cmdInfo.prefix = "";
        let run = await Router.runCommand(data.message, data.argsInfo, cmdInfo);
        throw "";
      }
    } catch (e) {
      if (e) data.argsInfo.Output.onError(e);
    }
  }

  static async command(data) {
    try {
      for (let command of Commands) {
        let cmdInfo = Object.assign({}, command);
        cmdInfo.prefix = data.argsInfo.server.prefixes[cmdInfo.prefix];
        if (cmdInfo.active !== false && cmdInfo.prefix === data.argsInfo.prefix && (cmdInfo.aliases.inArray(data.argsInfo.command) || cmdInfo.aliases.inArray(data.argsInfo.message.content))) { //if valid command has been received
          cmdInfo.command = true;
          let run = await Router.runCommand(data.message, data.argsInfo, cmdInfo);
          if (run) throw await Router.logCommand(data.argsInfo, cmdInfo);
          throw "";
        }
      }
    } catch (e) {
      if (e) data.argsInfo.Output.onError(e);
    }
  }

  static async logCommand(argsInfo, cmdInfo) {
    try {
      let time = Date.getISOtime(Date.now()).slice(0, 24);
      let author = argsInfo.author.tag;
      let Constructor = cmdInfo.file.toProperCase();
      let command = cmdInfo.prefix + argsInfo.command;
      let args = argsInfo.args;
      console.log(time + " | " + author + " | " + Constructor + " | " + command + " | [" + args + "]");
      return "";
    } catch (e) {
      if (e) console.log(e);
    }
  }

  static async runCommand(message, argsInfo, cmdInfo) {
    argsInfo.Output._onError = cmdInfo.command ? argsInfo.Output.onError : console.log;
    try {
      if (cmdInfo.requires) await Router.requires(argsInfo, cmdInfo); //halts it if fails permissions test
      let args = [];
      for (let i = 0; i < cmdInfo.arguments.length; i++)
        args[i] = argsInfo[cmdInfo.arguments[i]]; //the arguments we take for new Instance input are what's listed
      let Constructor = require("../modules/" + cmdInfo.file + ".js"); //Profile
      let Instance = new Constructor(message); //profile = new Profile(message);
      if (typeof Instance[cmdInfo.method] === "function") Instance[cmdInfo.method](...args);
      //else if (typeof Instance._getDescendantProp(cmdInfo.method) === "function") Instance._getDescendantProp(cmdInfo.method)(...args);
      else return !!eval("Instance." + cmdInfo.method + "(...args)");
      return true;
    } catch (e) {
      if (e) argsInfo.Output._onError(e);
      return false;
    }
  }

  static async requires(argsInfo, cmdInfo) {
    for (let [type, value] of Object.entries(cmdInfo.requires)) { //[channel: "spam"]
      try {
        if (!Array.isArray(value)) value = [value]; //if it's not array (i.e. multiple possible satisfactory conditions)
        let kill = true;
        for (let passable of value) {
          try {
            kill = !(await Permissions[type](passable, argsInfo));
          } catch (e) {
            console.log(e); //THERE SHOULD NOT BE ERRORS HERE, SO IF WE'RE RECEIVING ONE, DEAL WITH IT
          }
        };
        if (kill) throw cmdInfo.method;
      } catch (e) { //if it fails any of requirements, throw
        throw Permissions.output(type, argsInfo) ? Permissions.output(type, argsInfo) + "\nUse `" + cmdInfo.prefix + "help` followed by command name to see command info." : ""; //if no Permissions, kill it
      }
    };
    return true;
  }

}

module.exports = Router;