//the permanent requires that access data files or modules
const Discord = require("discord.js");
const config = require("./config.json");
const client = new Discord.Client();
const http = require("http");
const express = require("express")();

//the additional modules for debugging or only used sometimes
const onStartup = require("./events/onStartup.js"); //doesn't require Parse
const DebuggingConstructor = require("./util/debugging.js"); //doesn't require Parse

require('events').EventEmitter.prototype._maxListeners = 100;

const events = [
  ["channelCreate", ["channel"]],
  ["channelDelete", ["channel"]],
  ["channelPinsUpdate", ["channel", "time"]],
  ["channelUpdate", ["oldChannel", "newChannel"]],
  ["clientUserGuildSettingsUpdate", ["clientUserGuildSettings"]],
  ["clientUserSettingsUpdate", ["clientUserSettings"]],
  ["debug", ["info"]],
  ["disconnect", ["event"]],
  ["emojiCreate", ["emoji"]],
  ["emojiDelete", ["emoji"]],
  ["emojiUpdate", ["oldEmoji", "newEmoji"]],
  ["error", ["error"]],
  ["guildBanAdd", ["guild", "user"]],
  ["guildBanRemove", ["guild", "user"]],
  ["guildCreate", ["guild"]],
  ["guildDelete", ["guild"]],
  ["guildMemberAdd", ["member"]],
  ["guildMemberAvailable", ["member"]],
  ["guildMemberRemove", ["member"]],
  ["guildMembersChunk", ["member", "guild"]],
  ["guildMemberSpeaking", ["member", "speaking"]],
  ["guildMemberUpdate", ["oldMember", "newMember"]],
  ["guildUnavailable", ["guild"]],
  ["guildUpdate", ["oldGuild", "newGuild"]],
  ["message", ["message"], "message"],
  ["messageDelete", ["message"]],
  ["messageDeleteBulk", ["messages"]],
  ["messageReactionAdd", ["messageReaction", "user"]],
  ["messageReactionRemove", ["messageReaction", "user"]],
  ["messageReactionRemoveAll", ["message"]],
  ["messageUpdate", ["oldMessage", "newMessage"]],
  ["presenceUpdate", ["oldMember", "newMember"]],
  ["ready", []],
  ["reconnecting", []],
  ["resume", ["replayed"]],
  ["roleCreate", ["role"]],
  ["roleDelete", ["role"]],
  ["roleUpdate", ["oldRole", "newRole"]],
  ["typingStart", ["channel", "user"]],
  ["typingStop", ["channel", "user"]],
  ["userNoteUpdate", ["user", "oldNote", "newNote"]],
  ["userUpdate", ["oldUser", "newUser"]],
  ["voiceStateUpdate", ["oldMember", "newMember"]],
  ["warn", ["info"]]
];

class Dummy {
  constructor() {

  }

  get Router () {
    return require("./util/router.js");
  }
}
class Bot {

  static ready() {
    return client.login(process.env.TOKEN ? process.env.TOKEN : require("./token.json").token)
  }

  static run() {

    let data;
    let Router = (new Dummy()).Router;

    client.on("ready", () => { //console startup section
      try {
        data = new onStartup(client);
        if (data.modmail) () => {}; //used to cache the messages that might need to be reacted to
        for (let guild of Array.from(client.guilds.values()))
          console.log(`Loaded client server ${guild.name} in ${Date.now() - data.reboot}ms`);
        console.log(data.bouncerbot ? `Noticed bot user ${data.bouncerbot.tag} in ${Date.now() - data.reboot}ms` : `Bouncer#8585 is not online!`);
        console.log(data.nadekobot ? `Noticed bot user ${data.nadekobot.tag} in ${Date.now() - data.reboot}ms` : `Nadeko#6685 is not online!`);
        console.log(data.harmonbot ? `Noticed bot user ${data.harmonbot.tag} in ${Date.now() - data.reboot}ms` : `Harmonbot#4049 is not online!`);
        for (let owner of data.owners)
          console.log(`Noticed bot owner ${owner.tag} in ${Date.now() - data.reboot}ms`);
        console.log("bleep bloop! It's showtime.");
        if (data.autoupdates) console.log("Beginning update cycle...");
        Router.intervals();
        const Debugging = new DebuggingConstructor(client);
        if (config.states.debug) Bot.debug(data);
        //Debugging.removeDuplicates();
        //Debugging.convertCounttoObject();
        //Debugging.updateDBUserFormat();
        //Debugging.duplicateMains();
      } catch (e) {
        if (e) console.log(e);
      }
    });

    for (let event of events) {
      if (!event[2]) continue;
      client.on(event[0], function () {
        for (let i = 0; i < event[1].length; i++) {
          data[event[1][i]] = arguments[i];
          data.client = client;
        };
        Router[event[2]](data);
      });
    } /*

    client.on("message", (message) => { //command handler
      try {
        data.message = message;
        Router.command(data);
      } catch (e) {
        console.log(e);
      }
    }) */

    client.on("messageReactionAdd", (messageReaction, user) => {
      if (!messageReaction.message.guild) return;
      if (user.bot || !messageReaction.message.author.bot) {
        if (messageReaction.emoji.id === "481996881606475798" && !user.bot) return messageReaction.remove(user);
      } //For using emojis as "buttons". Only reactions done by users reacting to bot messages are of interest to us.
      else Router.reaction(messageReaction, user)
      .catch((e) => {
        if (e) console.log(e);
      });
    })

    client.on("presenceUpdate", (oldMember, newMember) => {
      Router.presence(oldMember, newMember)
      .catch((e) => {
        if (e) console.log(e);
      });
    })

    client.on("raw", async event => {
      if (event.t !== "MESSAGE_REACTION_ADD") return;
      let data = event.d;
      let user = client.users.get(data.user_id);
      let channel = client.channels.get(data.channel_id) || await user.createDM();
      if (channel.messages.has(data.message_id)) return;
      let message = await channel.fetchMessage(data.message_id);
      let emojiKey = (data.emoji.id) ? `${data.emoji.name}:${data.emoji.id}` : data.emoji.name;
      let reaction = message.reactions.get(emojiKey);
      client.emit("messageReactionAdd", reaction, user);
    });

    express.get("/", (request, response) => { //interacting with glitch.com
      response.sendStatus(200);
    });

    express.listen(process.env.PORT);

    setInterval(() => {
      http.get(`http://${process.env.lazybot || "houselazybot"}.glitch.me/`); //pinging glitch.com
    }, 280000);

  }
/*
  static debug(data) { //run through every command and try and run the examples to see if it throws errors
    config.states.debug = true;
    DataManager.setFile(config, "./src/config.json");
    for (let i = 0; i < commands.length; i++) {
      for (let j = 0; j < commands[i].usage.length; j++) {
        data.message = Object.assign({}, DataManager.getFile("./src/data/genericmessage.json"));
        if (commands[i].prefix === "generic") data.message.content = "!";
        if (commands[i].prefix === "nadeko") data.message.content = ".";
        data.message.content += commands[i].usage[j];
        console.log(data.message.content);
        Router.command(data);
      }
    }
  }

  static recordMessage(message) {
    let _message = require("circular-json").stringify(message, null, 4);
    console.log(_message);
    require("fs").writeFileSync("./src/data/genericmessage.json", _message);
  }*/

}

Bot.run();
Bot.ready();

//UNIVERSAL FUNCTIONS

Date.getTime = function (ms) {
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
  return Date.getTime(ms).toString().slice(0, 31);
}

Date.getMonth = function (ms) {
  let string = Date.getTime(ms).toString();
  return string.slice(4, 7) + " " + string.slice(11, 15);
}

Array.prototype.inArray = function (string) {
  for (let i = 0; i < this.length; i++) {
    if (string.toLowerCase().replace(/[^\s\w$.\?£?@!]/g, "").trim() === this[i].toLowerCase().replace(/[^\s\w?$.?£.@!]/g, "").trim()) return true;
  }
  return false;
}

Array.prototype.findAllIndexes = function(conditions) {
  let indexes = [];
  for(let i = 0; i < this.length; i++) {
    if(conditions(this[i])) {
      indexes.push(i)
    }
  };
  return indexes;
}

Array.prototype.swap = function(dbindex1, dbindex2) {
  let user = this[dbindex1];
  this[dbindex1] = this[dbindex2];
  this[dbindex2] = user;
  return this;
}

String.prototype.occurrences = function(subString, allowOverlapping) {
  subString += "";
  if(subString.length <= 0) return (this.length + 1);
  let n = 0;
  let position = 0;
  let step = allowOverlapping ? 1 : subString.length;
  while(true) {
      position = this.indexOf(subString, position);
      if (position >= 0) {
          ++n;
          position += step;
      } else break;
  }
  return n;
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

Array.prototype.toProperCase = function() {
  for(let i = 0; i < this.length; i++)
    this[i] = this[i].toProperCase();
  return this;
}

Array.prototype.clean = function () {
  for (let i = 0; i < this.length; i++) {
    if (!this[i]) {
      this.splice(i, 1);
      i--;
    }
  }
  return this;
}

Array.prototype.shuffle = function () {
  let currentIndex = this.length,
    temporaryValue, randomIndex;
  while (0 !== currentIndex) { // while there remain elements to shuffle...
    randomIndex = Math.randBetween(0, currentIndex); // pick a remaining element...
    currentIndex--;
    temporaryValue = this[currentIndex]; // and swap it with the current element.
    this[currentIndex] = this[randomIndex];
    this[randomIndex] = temporaryValue;
  }
  return this.clean();
}

Array.prototype.remove = function (index) {
  if (index === 0) return;
  if (Array.isArray(index)) {
    index.sort(function (a, b) {
      return b - a;
    })
    for (let i = 0; i < index.length; i++) {;
      this.splice(index[i], 1);
    }
  } else {
    this.splice(index, 1);
  }
  return this;
}

Math.randBetween = function (min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

Math.genRange = function (number) {
  let range = [];
  for (let i = 0; i < number; i++) {
    range.push(i + 1);
  }
  return range;
}

Math.genRandomList = function (number, independentvariables) {
  let range = Math.genRange(number); //[1, 2, 3, 4, 5] up to number
  let randomrange = [];
  let limit = independentvariables ? Math.randBetween(0, number) : number; //length of randomrange is independent from number of voters
  for (let i = 0; i < limit; i++) {
    let randIndex = Math.randBetween(0, range.length - 1); //extract a random number from the array
    randomrange.push(range.splice(randIndex, 1)[0]); //and push it, reducing the number of the original arrray
  };
  return randomrange; //[4, 2, 3]
}

Object.prototype._getDescendantProp = function (desc) {
  let arr = desc.split('.'), obj = this;
  while (arr.length) {
    obj = obj[arr.shift()];
  }
  return obj;
}

Object.prototype._setDescendantProp = function (desc, value) {
  let arr = desc.split('.'), obj = this;
  while (arr.length > 1) {
    obj = obj[arr.shift()];
  }
  return obj[arr[0]] = value;
}
