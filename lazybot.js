const Discord = require("discord.js");
const client = new Discord.Client();
const config = require("./config.json");
const fs = require("fs");

//pinging glitch.com

const http = require('http');
const express = require('express');
const app = express();
app.get("/", (request, response) => {
  console.log(Date.now() + " Ping Received");
  response.sendStatus(200);
});
app.listen(process.env.PORT);
setInterval(() => {
  http.get(`http://${process.env.lazybot}.glitch.me/`);
}, 280000);

//console startup section

client.on("ready", () => {
  console.log("bleep bloop! It's showtime.");
});

const nadekoprefix = config.nadekoprefix;
const prefix = config.prefix;
const nadekoid = config.nadekoid;
var i;
var j;
var k;

//section for commands that integrate with Nadeko

client.on("message", (message) => {

  if (!message.content.startsWith(config.nadekoprefix) || message.author.bot) return;

  const args = message.content.slice(config.nadekoprefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  //@here command
   
  var notifycommand = [
    "notify",
    "here",
    "tournamentstarting"
  ];

  var domain = [
    "http://lichess.org",
    "http://www.chess.com",
    "http://bughousetest.com",
    "https://lichess.org",
    "https://www.chess.com",
    "https://bughousetest.com"
  ];

  for (i = 0; i < 3; i++) {
    for (j = 0; j < 6; j++) {
        if(message.content.startsWith (config.nadekoprefix + notifycommand[i] + " " + domain[j])) {
          message.channel.send("@here");
        let [link] = args;
          console.log(`${message.author.username} has sent out a ping for ${link}.`);
  }}}

  //change nadekoprefix

  if (command === "nadekoprefix") {

    if(message.author.id !== config.ownerID) return;

    let [newNadekoPrefix] = args;  
    config.nadekoprefix = newNadekoPrefix
    fs.writeFile("./config.json", JSON.stringify(config), (err) => console.error);

    message.channel.send(`Nadeko-Integration Prefix has been updated to **${newNadekoPrefix}** !`);
    console.log(`${message.author.username} [${message.author.id}] has updated NadekoPrefix to ${newNadekoPrefix}`);
  } else

  if (command === "mf") {

  let [games,time,increment] = args
  message.channel.send({embed: {
    title: "House Match Reward",
    color: 53380,
    description: Math.floor(7/12 * parseInt(games) * (parseInt(time) + 2/3 * parseInt(increment))) + " :cherry_blossom:"
  }});

  } else

  if (command === "tf") {

  let [games,time,increment] = args
  message.channel.send({embed: {
    title: "House Tournament Reward",
    color: 53380,
    description: Math.floor(1/10 * parseInt(games) * (parseInt(time) + 2/3 * parseInt(increment))) + " :cherry_blossom:"
  }});

  } else

  //Conversion functions

  if (command === "decimaltous") {

    let [decimalodds] = args

    if (decimalodds < 1) {
      message.channel.send({embed: {
        title: "Decimal to US Odds",
        color: 431075,
        description: "Error: Decimal odds must be greater or than 1."
      }});
    } else

    if (1 <= decimalodds && decimalodds < 2) {
      message.channel.send({embed: {
        title: "Decimal to US Odds",
        color: 431075,
        description: parseInt(-100/(decimalodds-1))
      }});
    } else

    if (2 < decimalodds) {
      message.channel.send({embed: {
        title: "Decimal to US Odds",
        color: 431075,
        description: "+" + parseInt(100*(decimalodds-1))
      }});
    }
  } else

  if (command === "ustodecimal") {

    let [usodds] = args

    if (usodds < 0) {
      message.channel.send({embed: {
        title: "US to Decimal Odds",
        color: 16738560,
        description: "" + Math.round(100*(1 - 100/usodds))/100
      }});
    } else

    if (0 < usodds) {
      message.channel.send({embed: {
        title: "US to Decimal Odds",
        color: 16738560,
        description: "" + Math.round(100*(1 + usodds/100))/100
      }});
    }
  } else

  if(command === "everyone") {
    message.channel.send("Why would you try and do that tho");
  }

});

client.on("message", (message) => {

  if (!message.content.startsWith(config.prefix) || message.author.bot) return;

  const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  if (command === "prefix" || command === "lazybotprefix") {

    if(message.author.id !== config.ownerID) return;

    let [newPrefix] = args;
    config.prefix = newPrefix
    fs.writeFile("./config.json", JSON.stringify(config), (err) => console.error);

    message.channel.send(`Prefix has been updated to **${newPrefix}** !`);
    console.log(`${message.author.username} [${message.author.id}] has updated the prefix to ${newPrefix}`);
  } else

  if(command === "asl") {
    let [age,sex,location] = args;
    message.channel.send(`Hello **${message.author.username}**, I see you're a **${age}** year old **${sex}** from **${location}**.`);
  } else

  if(command === "ping") {
    message.channel.send("pong!");
  } else

  if(command === "marco") {
    message.channel.send("polo!");
  } else

  if(command === "ready") {
    message.channel.send("I am ready!");
  } else

  if(command === "owner") {
    message.channel.send("theLAZYmd#2353");
  } else

  if(command === "who") {
    message.channel.send("I am LAZYbot#2309");
  } else

  if(command === "help") {
    message.channel.send("This is a pretty basic bot, there isn't much it can help you with.");
  }

});

//trivia give commands

client.on('message', (message) => {

  if (message.author.bot || !message.content.includes ("Trivia Game Ended")) return;

  var args  = message.content.split("\n");
    name = [];
  var payoutoptions = [6,4,2,0];
  var claimoptions = [null,null,13,11,9,5,0];
  var payoutmsg = ["--","--","--","--"];

  for (i = 2; i < args.length; i++)

    {name[i-2] = args[i].split(/ +/g).shift()}

    if (name.length < 1) return;

    if (5 < name.length) {
      for (k = 1; k < 4; k++) {
      var payout = (parseInt(payoutoptions[k]) + 1) + "";
      payoutmsg[k-1] = `.give ` + payout + ` ` + name[k]
      }} else

    for (j = 0; j < Math.ceil(0.5 + name.length/2); j++) {

      var payout = (parseInt(name.length) + parseInt(payoutoptions[j]) - 5) + "";
      payoutmsg[j] = `.give ` + payout + ` ` + name[j]
      }

  if (name.length < 2) {
    message.channel.send({embed: {
    title: `House Trivia ${name.length}-player Game`,
    color: 53380,
    description:  `.give 13 housebank#5970`,
      }});
    } else

  if (5 < name.length) {
    message.channel.send({embed: {
    title: `House Trivia ${name.length}-player Game`,
    color: 53380,
    description:  `.give 8 ` + name[0] + `\n` + 
                  payoutmsg[0] + `\n` + 
                  payoutmsg[1] + `\n` + 
                  payoutmsg[2] + `\n` + 
                  `.give 0 housebank#5970`,
  
      }});
    } else {

    message.channel.send({embed: {
      title: `House Trivia ${name.length}-player Game`,
      color: 53380,
      description:  payoutmsg[0] + `\n` + 
                    payoutmsg[1] + `\n` + 
                    payoutmsg[2] + `\n` + 
                    `.give ` + claimoptions[name.length] + ` housebank#5970`,
    
        }});
      }
  });

client.on("message", (message) => {

  //reddit links section

  if (!(message.content.startsWith("/r/") || message.content.startsWith("r/")) || message.author.bot) return;

  const args = message.content.split(/ +/g);
  const command = args.shift().toLowerCase();

  if(command.startsWith("/r/")) {
    message.channel.send({embed: {
      color: 53380,
      description: `[${command}](http://www.reddit.com${command})`
    }});
  } else

  if(command.startsWith("r/")) {
    message.channel.send({embed: {
      color: 53380,
      description: `[/${command}](http://www.reddit.com/${command})`
    }});
  }
  
});

/*client.on("presence", function (pUser, pStatus, pGameID) {

  if (!pUser === "116275390695079945") return;

  if (pStatus === "offline")
  {
      {
          GuildMember.addrole("365938486534209536")
      }
  }
});*/

client.login(config.token);

