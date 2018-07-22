let start = Date.now(), data;

const Discord = require('discord.js');
const DataManager = require("./util/datamanager.js");
const Router = require("./util/router.js")
const onStartup = require("./events/onStartup.js");
const config = require("./config.json");
const client = new Discord.Client();

const http = require('http');
const express = require('express')();

class Bot {

  static ready () {
    return client.login(process.env.TOKEN ? process.env.TOKEN : require("./token.json").token)
  }

  static run () {

    client.on("ready", () => { //console startup section
      data = new onStartup(client);
      for(let guildID in DataManager.getFile(config.guildFile)) {
        console.log(`Loaded client server ${client.guilds.get(guildID).name} in ${Date.now() - data.reboot}ms`);
      };
      console.log(data.bouncerbot ? `Noticed bot user ${data.bouncerbot.tag} in ${Date.now() - data.reboot}ms` : `Bouncer#8585 is not online!`);
      console.log(data.nadekobot ? `Noticed bot user ${data.nadekobot.tag} in ${Date.now() - data.reboot}ms` : `Nadeko#6685 is not online!`);
      console.log(data.harmonbot ? `Noticed bot user ${data.harmonbot.tag} in ${Date.now() - data.reboot}ms` : `Harmonbot#4049 is not online!`);
      for(let i = 0; i < data.owners.length; i++) {
        console.log(`Noticed bot owner ${data.owners[i].tag} in ${Date.now() - data.reboot}ms`);
      };
      console.log("bleep bloop! It's showtime.");
    });
    
    client.on("message", (message) => { //command handler
      Router.command(message, data);
    });

    express.get("/", (request, response) => { //interacting with glitch.com
      response.sendStatus(200);
    });

    express.listen(process.env.PORT);

    setInterval(() => {
      http.get(`http://${process.env.lazybot || "houselazybot"}.glitch.me/`); //pinging glitch.com
    }, 280000);

  }

}

Bot.run();
Bot.ready() /*
.then(ready => {
  if(!!ready) Bot.run();
})
.catch(e => {
  console.log(e);
  setTimeout(Bot.ready(), 30000);
}); */
