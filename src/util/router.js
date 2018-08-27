const Parse = require("./parse.js");
const DataManager = require("./datamanager.js");
const Commands = require("../data/commands.json");
const allMessageCommands = require("../data/allmessagecommands.json");
const DMCommands = require("../data/dmcommands.json");

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

  static async command(data) {
    try {
      data = await Router.checkErrors(data);
      data.argsInfo = new Parse(data.message, data.client); //sets object with all like guild, channel (arguments for functions)
      if (data.message.channel.type === "dm" || data.message.channel.type === "group" || !data.message.guild) {
        for (let command of DMCommands)
          await Router.runCommand(data.message, data.argsInfo, command);
        throw "";
      }
      for (let command of allMessageCommands)
        await Router.runCommand(data.message, data.argsInfo, command);
      if (!data.commands[data.argsInfo.command]) throw ""; //checks if command appears on init-generated command listing
      for (let command of Commands) {
        let cmdInfo = Object.assign({}, command);
        cmdInfo.prefix = data.argsInfo.server.prefixes[cmdInfo.prefix];
        cmdInfo.command = true;
        if (cmdInfo.prefix === data.argsInfo.prefix && cmdInfo.aliases.inArray(data.argsInfo.command)) { //if valid command has been received
          let run = await Router.runCommand(data.message, data.argsInfo, cmdInfo);
          if (run) Router.logCommand(data.argsInfo, cmdInfo);
          return;
        }
      }
    } catch (e) {
      if (e) console.log(e);
    }
  }

  static async checkErrors(data) {
    try {
      if (data.message.author.id === data.client.user.id) throw "";
      if (data.message.content.length === 1) throw "";
      data.client.reboot = data.readyTimestamp;
      return data;
    } catch (e) {
      throw e;
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
    } catch (e) {
      if (e) console.log(e);
    }
  }

  static async runCommand(message, argsInfo, cmdInfo) {
    argsInfo.Output._onError = cmdInfo.command ? argsInfo.Output.onError : console.log;
    try {
      if (cmdInfo.requires) await Router.requires(argsInfo, cmdInfo); //halts it if fails permissions test
      let args = [];
      for (let i = 0; i < cmdInfo.arguments.length; i++) {
        args[i] = argsInfo[cmdInfo.arguments[i]]; //the arguments we take for new Instance input are what's listed
        //if(!args[i]) return argsInfo.Output.onError(`Command **${argsInfo.command}** requires the following piece of data which you have not provided: **${cmdInfo.arguments[i]}**.`)
      };
      let Constructor = require("../modules/" + cmdInfo.file + ".js"); //Profile
      let Instance = new Constructor(message); //profile = new Profile(message);
      if (Instance[cmdInfo.method]) Instance[cmdInfo.method](...args);
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
            kill = !(await argsInfo.Permissions[type](passable, argsInfo));
          } catch (e) {
            console.log(e); //THERE SHOULD NOT BE ERRORS HERE, SO IF WE'RE RECEIVING ONE, DEAL WITH IT
          }
        };
        if (kill) throw cmdInfo.method;
      } catch (e) { //if it fails any of requirements, throw
        throw argsInfo.Permissions.output(type, argsInfo) ? argsInfo.Permissions.output(type, argsInfo) + "\nUse `" + cmdInfo.prefix + "help` followed by command name to see command info." : ""; //if no argsInfo.Permissions, kill it
      }
    };
    return true;
  }

}

module.exports = Router;

Array.prototype.inArray = function (string) {
  for (let i = 0; i < this.length; i++) {
    if (string.toLowerCase().replace(/[.,#!$%\^&;:{}<>=-_`\"~()]/g, "").trim() === this[i].toLowerCase().replace(/[.,#!$%\^&;:{}<>=-_`\"~()]/g, "").trim()) return true;
  };
  return false;
}

Date.gettime = function (ms) {
  let time = new Date(ms);
  time.hours = time.getUTCHours();
  time.minutes = time.getUTCMinutes();
  time.seconds = time.getUTCSeconds();
  time.milliseconds = time.getUTCMilliseconds();
  time.days = Math.floor(time.hours / 24);
  time.hours = time.hours - (24 * time.days);
  return time;
}

Date.getISOtime = function (ms) {
  return Date.gettime(ms).toString().slice(0, 31);
}

String.prototype.toProperCase = function () {
  let words = this.split(/ +/g);
  let newArray = [];
  for (let i = 0; i < words.length; i++) {
    newArray[i] = words[i][0].toUpperCase() + words[i].slice(1, words[i].length).toLowerCase();
  };
  let newString = newArray.join(" ");
  return newString;
}