//the permanent requires that access data files or modules
const Discord = require("discord.js");
const DataManager = require("./util/datamanager.js");
const Router = require("./util/router.js")
const config = require("./config.json");
const client = new Discord.Client();
const commands = require("./data/commands.json");
const http = require("http");
const express = require("express")();

//the additional modules for debugging or only used sometimes
const onStartup = require("./events/onStartup.js");
const DebuggingConstructor = require("./util/debugging.js");
const ModMailConstructor = require("./modules/modmail.js");

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
  ["message", ["message"], "command"],
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

class Bot {

  static ready() {
    return client.login(process.env.TOKEN ? process.env.TOKEN : require("./token.json").token)
  }

  static run() {

    let data;

    client.on("ready", () => { //console startup section
      try {
        data = new onStartup(client);
        if (data.modmail) () => {}; //used to cache the messages that might need to be reacted to
        for (let guildID in DataManager.getFile(config.guildFile)) {
          console.log(`Loaded client server ${client.guilds.get(guildID).name} in ${Date.now() - data.reboot}ms`);
        };
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
  }

}

Bot.run();
Bot.ready();

module.exports = {client};