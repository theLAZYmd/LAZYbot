const Parse = require("./parse.js");
const Permissions = require("./permissions.js");
const Commands = require("../data/commands.json");
const allMessageCommands = require("../data/allmessagecommands.json");
const DMCommands = require("../data/dmcommands.json");

class Router {

  static command (_data) {
    Router.checkErrors(_data)
    .then((data) => {
      data.argsInfo = new Parse(data.message); //sets object with all like guild, channel (arguments for functions)
      return data;
    })
    .then((data) => {
      if(data.message.channel.type === "dm" || data.message.channel.type === "group" || !data.message.guild) {
        for(let i = 0; i < DMCommands.length; i++) {
          Router.runCommand(data.message, data.argsInfo, DMCommands[i]);
        };
        throw "";
      };
      return data;
    })
    .then((data) => {
      for(let i = 0; i < allMessageCommands.length; i++) {
        Router.runCommand(data.message, data.argsInfo, allMessageCommands[i]);
      };
      return data;
    })
    .then((data) => {
      if(data.commands[data.argsInfo.command]) { //checks if command appears on init-generated command listing
        for(let i = 0; i < Commands.length; i++) {
          let cmdInfo = Object.assign({}, Commands[i]);
          cmdInfo.prefix = data.argsInfo.server.prefixes[cmdInfo.prefix];
          cmdInfo.command = true;
          if(cmdInfo.aliases.inArray(data.argsInfo.command) && cmdInfo.prefix === data.argsInfo.prefix) { //if valid command has been received
            Router.logCommand(data.argsInfo, cmdInfo);
            Router.runCommand(data.message, data.argsInfo, cmdInfo);
            throw "";
          }
        }
      }
    })
    .catch((error) => {
      if(error) console.log(error);
    })
  }

  static checkErrors(data) {
    return new Promise ((resolve, reject) => {
      if(data.message.author.id === data.client.user.id) return reject();
      if(data.message.content.length === 1) return reject ();
      if(!data.message.client) data.message.client = data.client;
      data.message.client.reboot = data.reboot;
      data.message.client.httpboolean = data.httpboolean;
      resolve(data);
    })
  }

  static logCommand(argsInfo, cmdInfo) {
    let time = Date.getISOtime(Date.now()).slice(0, 24);
    let author = argsInfo.author.tag;
    let Constructor = cmdInfo.file.toProperCase();
    let command = cmdInfo.prefix + argsInfo.command;
    let args = argsInfo.args;
    console.log(time + " | " + author  + " | " + Constructor + " | " + command + " | [" + args + "]");
  }

  static runCommand(message, argsInfo, cmdInfo) {
    let Output = {
      "onError": cmdInfo.command ? argsInfo.Output.onError : () => {}
    };
    if(cmdInfo.requires) {
      for(let type in cmdInfo.requires) { //such as channel, guild
        let value = cmdInfo.requires[type]; //such as mod, owner, bot, trivia
        let killboolean = false;
        if(typeof value === "string") {
          if(!Permissions[type](value, argsInfo)) killboolean = true; //if no permissions, kill it
        } else {
          let array = Array.from(value); //if array (i.e. multiple possible satisfactory conditions)
          killboolean = true; //assume it is to be killed
          for(let i = 0; i < array.length; i++) {
            if(Permissions[type](array[i], argsInfo)) killboolean = false; //but it satisfy just one condition, stop the kill
          };
        };
        if(killboolean) {
          if(cmdInfo.command) argsInfo.Output.onError(Permissions.output(type, argsInfo.server.prefixes.generic));
          return;
        };
      };
    };
    let args = [];
    for(let i = 0; i < cmdInfo.arguments.length; i++) {
      args[i] = argsInfo[cmdInfo.arguments[i]]; //the arguments we take for new Instance input are what's listed
      //if(!args[i]) return Output.onError(`Command **${argsInfo.command}** requires the following piece of data which you have not provided: **${cmdInfo.arguments[i]}**.`)
    };
    let Constructor = require("../modules/" + cmdInfo.file + ".js"); //Profile
    let Instance = new Constructor(message); //profile = new Profile(message);
    if(Instance[cmdInfo.method]) Instance[cmdInfo.method](...args);
    else {
      try {
        eval("Instance." + cmdInfo.method + "(...args)");
      }
      catch(e) {
        console.log(e);
        return Output.onError(`Couldn't find module **${cmdInfo.file}.${cmdInfo.method}()**!`);
      }
    }
  }

}

module.exports = Router;

Array.prototype.inArray = function(string) { 
  for(let i = 0; i < this.length; i++) { 
    if(string.toLowerCase().replace(/[.,#!$%\^&;:{}<>=-_`\"~()]/g,"").trim() === this[i].toLowerCase().replace(/[.,#!$%\^&;:{}<>=-_`\"~()]/g,"").trim()) return true; 
  };
  return false;
}

Date.gettime = function(ms) {
  let time = new Date(ms);
  time.hours = time.getUTCHours();
  time.minutes = time.getUTCMinutes();
  time.seconds = time.getUTCSeconds();
  time.milliseconds = time.getUTCMilliseconds();
  time.days = Math.floor(time.hours/24);
  time.hours = time.hours - (24 * time.days);
  return time;
}

Date.getISOtime = function(ms) {
  return Date.gettime(ms).toString().slice(0, 31); 
}

String.prototype.toProperCase = function() {
  let words = this.split(/ +/g);
  let newArray = [];
  for(let i = 0; i < words.length; i++) {
    newArray[i] = words[i][0].toUpperCase() + words[i].slice(1, words[i].length).toLowerCase();
  }
  let newString = newArray.join(" ");
  return newString;
}