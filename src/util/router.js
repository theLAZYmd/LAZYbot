const Parse = require("./parse.js");

class Router {

  static command (message, data) {

    if(message.author.id === data.client.user.id) return;
    if(message.content.length === 1) return;
    if(!message.client) message.client = data.client;
    message.client.reboot = data.reboot;
    message.client.httpboolean = data.httpboolean;
    if(message.channel.type === "dm" || message.channel.type === "group" || !message.guild) {
      return Router.dmMessages(message);
    };
    let argsInfo = new Parse(message); //sets object with all like guild, channel (arguments for functions)
    Router.allMessages(message);
    if(!!data.commands[argsInfo.command]) { //checks if command appears on init-generated command listing
      let commands = require("../commands2.json");
      for(let i = 0; i < commands.length; i++) { //for command details breakdown
        if(commands[i].aliases.inArray(argsInfo.command)) { //if valid command has been received
          let cmdInfo = Object.assign({}, commands[i]); //sets object with constructor info
          cmdInfo.prefix = argsInfo.server.prefixes[cmdInfo.prefix];
          let args = [];
          for(let i = 0; i < cmdInfo.arguments.length; i++) {
            args[i] = argsInfo[cmdInfo.arguments[i]]; //the arguments we take for new Instance input are what's listed
            if(!args[i]) return argsInfo.Output.onError(`Command **${argsInfo.command}** requires the following piece of data which you have not provided: **${cmdInfo.arguments[i]}**.`)
          };
          if(cmdInfo.prefix === argsInfo.prefix) {
            console.log(Router.logCommand(argsInfo, cmdInfo))
            Router.commandMessages(message, argsInfo, cmdInfo, args);
            break;
          }
        }
      } 
    }
  }

  static logCommand(argsInfo, cmdInfo) {
    let time = Date.getISOtime(Date.now()).slice(0, 24);
    let author = argsInfo.author.tag;
    let Constructor = cmdInfo.file.toProperCase();
    let command = cmdInfo.prefix + argsInfo.command;
    let args = argsInfo.args;
    return time + " | " + author  + " | " + Constructor + " | " + command + " | [" + args + "]";
  }

  static dmMessages(message) {
    if(message.author.bot) return;
    let DMConstructor = require("../modules/dm.js");
    let DM = new DMConstructor(message);
    DM.route();
  }

  static allMessages(message) {
    let Tracker = require("../modules/tracker.js");
    let tracker = new Tracker(message);
    tracker.messagelogger();
    let CustomReactions = require("../modules/customreactions.js");
    let customreactions = new CustomReactions(message);
    customreactions.text();
    customreactions.emoji();
  }

  static commandMessages(message, argsInfo, cmdInfo, args) {
    if(cmdInfo && cmdInfo.file) {
      let Constructor = require("../modules/" + cmdInfo.file + ".js"); //Profile
      let Instance = new Constructor(message); //profile = new Profile(message);
      if(Instance[cmdInfo.method]) Instance[cmdInfo.method](...args);
      else {
        try {
          eval("Instance." + cmdInfo.method + "(...args)");
        }
        catch(e) {
          console.log(e);
          return argsInfo.Output.onError(`Couldn't find module **${cmdInfo.file}.${cmdInfo.method}()**!`);
        }
      }
    }
  }

}

module.exports = Router;

Object.byString = function(object, string, args) {
  string = string.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
  string = string.replace(/^\./, ''); // strip a leading dot
  let array = string.split(".");
  let method = array.pop();
  return method;
}

Array.prototype.inArray = function(string) { 
  for(let i = 0; i < this.length; i++) { 
      if(string.toLowerCase().replace(/[.,#!$%\^&;:{}<>=-_`\"~()]/g,"").trim() === this[i].toLowerCase().replace(/[.,#!$%\^&;:{}<>=-_`\"~()]/g,"").trim()) return true; 
  }
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