const Discord = require("discord.js");
const client = new Discord.Client();
const config = require("./config.json");
const fs = require("fs");

client.on("ready", () => {
  console.log("bleep bloop! It's showtime.");
});

const prefix = config.prefix;

client.on("message", (message) => {

  if (!message.content.startsWith(config.prefix) || message.author.bot) return;

  if (message.content.startsWith(config.prefix + "prefix" || config.prefix + "lazybotprefix")) {

    if(message.author.id !== config.ownerID) return;
    let newPrefix = message.content.split(" ").slice(1, 2)[0];
    config.prefix = newPrefix;
  
    fs.writeFile("./config.json", JSON.stringify(config), (err) => console.error);

    message.channel.send("Prefix has been updated to **" + newPrefix + "** !");
    console.log(message.author.username + " [" + message.author.id + "] has updated the prefix to " + newPrefix);
  } else
  
  if (message.content.startsWith(config.prefix + "ping")) {
    message.channel.send("pong!");
  } else

  if (message.content.startsWith(config.prefix + "who")) {
    message.channel.send("I am LAZYbot#2309");
  } else

  if (message.content.startsWith(config.prefix + "ready")) {
  message.channel.send("I am ready!");
  } else

  if (message.content.startsWith(config.prefix + "owner")) {
  message.channel.send("theLAZYmd#2353");
  }
  
});

client.login(config.token);
