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
      let tally = DataManager.getData();
      let duplicates = {};
      for(let i = 0; i < tally.length; i++) {
        if(duplicates[tally[i].id]) {
          tally.splice(i, 1);
          i--;
          continue;
        };
        duplicates[tally[i].id] = true;
        let count = tally[i].messages;
        tally[i].messages = {};
        if(typeof count === "number") tally[i].messages.count = count;
        if(tally[i].lastmessage) {
          tally[i].messages.last = tally[i].lastmessage;
          delete tally[i].lastmessage;
        };
        if(tally[i].lastmessagedate) {
          tally[i].messages.lastSeen = tally[i].lastmessagedate;
          delete tally[i].lastmessagedate;
        };
        count = 0;
        for(let source in config.sources) {
          if(tally[i][source]) {
            let username = tally[i][source];
            let updated = {};
            updated._main = username;
            updated[username] = tally[i][source + "ratings"];
            if(tally[i].title) {
              if(source === "lichess") updated._title = tally[i].title;
              delete tally[i].title;
            };
            if(tally[i][source + "ratings"]) {
              if(tally[i][source + "ratings"].cheating) {
                updated._cheating = tally[i][source + "ratings"].cheating
                delete tally[i][source + "ratings"].cheating;
                console.log("Noted cheater " + tally[i].username + ".")
              };
              delete tally[i][source + "ratings"];
            }
            tally[i][source] = updated;
            console.log("Completed for " + tally[i].username + " with source " + source + ".");
          };
        }
        if(tally[i].source) delete tally[i].source;
      };
      DataManager.setData(tally);
    });
    
    client.on("message", (message) => { //command handler
      data.message = message;
      Router.command(data);
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
