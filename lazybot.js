const Discord = require("discord.js");
const client = new Discord.Client();
const fs = require("fs");

const config = require("./config.json");
const package = require("./package.json");
const tally = JSON.parse(fs.readFileSync("./messagelog.json", "utf8"));

var guild;
var bouncerbot;
var nadekobot;
var owner;
var reboot;

var bcpboolean;
var testingmodeboolean;

  var i;
      embedinput = {};
      embedoutput = {};

//console startup section

client.on("ready", () => {

  reboot = Date.now();  
  console.log ("bleep bloop! It's showtime.");
  guild = client.guilds.get(config.guild);
  console.log (`Loaded client server ${guild.name} in ${Date.now() - reboot}ms`);
  bouncerbot = guild.members.get(config.bouncerID);
  console.log (`Noticed bot user ${bouncerbot.user.tag} in ${Date.now() - reboot}ms`);
  nadekobot = guild.members.get(config.nadekoID);
  console.log (`Noticed bot user ${nadekobot.user.tag} in ${Date.now() - reboot}ms`);
  owner = guild.members.get(config.ownerID);
  console.log (`Noticed bot owner ${owner.user.tag} in ${Date.now() - reboot}ms`);
  bcpboolean = false;

});

//pinging glitch.com

const http = require('http');
const express = require('express');
const app = express();
app.get("/", (request, response) => {
  console.log (Date.now() + " Ping Received");
  response.sendStatus(200);
});
app.listen(process.env.PORT);
setInterval(() => {
  http.get(`http://${process.env.lazybot}.glitch.me/`);
}, 280000);

var acceptedlinkdomains = [
  "http://lichess.org",
  "http://www.chess.com",
  "http://bughousetest.com",
  "https://lichess.org",
  "https://www.chess.com",
  "https://bughousetest.com"
];

//section for message logging

client.on("message", message => {
  
  if (message.author.bot) return;
  let user = message.author;
  let dbuser = getdbuserfromuser (user);
  let dbindex = getdbindexfromdbuser (dbuser)
  if (dbindex == -1) return;

  tally[dbindex].messages++;
  if (tally == undefined) return;
  fs.writeFile("./messagelog.json", JSON.stringify(tally, null, 4), (err) => {
    if (err) console.error(err)
  });
});

//leave message 

client.on("guildMemberRemove", (member) => {

  clearvar();
  let channel = getchannelfromname ("off-topic");
  let dbuser = getdbuserfromuser (user);
  if (dbuser == undefined) return;
  embedoutput.description = `**${member.user.tag}** has left **${guild.name}**. Had **${dbuser.messages ? dbuser.messages.toLocaleString() : 0}** messages.`;
  embedoutput.color = 15406156;
  channel.send ({embed: embedoutput});

});

//section for commands that integrate with Nadeko

client.on("message", (message) => {

  if (!message.content.startsWith(config.nadekoprefix) || message.author.bot) return;

  const args = message.content.slice(config.nadekoprefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();
  const argument = message.content.slice(command.length + config.nadekoprefix.length).trim();

  //@here command

  if (command === "notify"){

    let link = args[0]
 
    for (let i = 0; i < acceptedlinkdomains.length; i++) {
      if (link == acceptedlinkdomains[i]) {
        message.channel.send("@here");
        console.log (`${message.author.username} has sent out a ping for ${link}.`);
      };
    };
  };

  //change nadekoprefix

  if (command === "nadekoprefix") {

    if (message.author.id !== owner.id) return;

    let [newNadekoPrefix] = args;  
    config.nadekoprefix = newNadekoPrefix
    fs.writeFile("./config.json", JSON.stringify(config, null, 4), (err) => console.error);

    message.channel.send(`Nadeko-Integration Prefix has been updated to **${newNadekoPrefix}** !`);
    console.log (`${message.author.username} [${message.author.id}] has updated NadekoPrefix to ${newNadekoPrefix}`);
  } else

  if (command === "mf") {

    let [games,time,increment] = args;
    message.channel.send({embed: {
      title: "House Match Reward",
      color: 53380,
      description: Math.floor(7/12 * parseInt(games) * (parseInt(time) + 2/3 * parseInt(increment))) + " :cherry_blossom:"
    }});

  } else

  if (command === "tf") {

  let [games,time,increment] = args;
    message.channel.send({embed: {
      title: "House Tournament Reward",
      color: 53380,
      description: Math.floor(1/10 * parseInt(games) * (parseInt(time) + 2/3 * parseInt(increment))) + " :cherry_blossom:"
    }});

  } else

  //Conversion functions

  if (command === "decimaltous") {

    let decimalodds = Number(args[0]);
    if (decimalodds == NaN) return;
    clearvar();
    embedoutput.title = "Decimal to US Odds";
    embedoutput.color = 431075;
    if (decimalodds < 1) {embedoutput.description = "Error: Decimal odds must be greater than or equal to 1."};
    if (1 <= decimalodds < 2) {embedoutput.description = (-100/(decimalodds-1)).toString()};
    if (2 < decimalodds) {embedoutput.description = "+" + (100*(decimalodds-1)).toString()};
    embedsender (message.channel, embedoutput);

  } else

  if (command === "ustodecimal") {

    let usodds = Number(args[0]);
    if (usodds == NaN) return;
    clearvar();
    embedoutput.title = "US to Decimal Odds";
    embedoutput.color = 16738560;
    if (usodds < 0) {embedoutput.description = (1 - 100/usodds).toFixed(1)};
    if (usodds > 0) {embedoutput.description = (1 + usodds/100).toFixed(1)};
    embedsender (message.channel, embedoutput);

  } else
  
  if (command === "fetch") {

    let channel = message.channel;
    returnmessagefromid (channel, args[0]);

  } else

  if (command === "fb") {
    if ((args[0] == null) || (message.author.id !== owner.id)) return;
    clearvar ();
    console.log ("I'm here");
    let user = getuser (args[0]);
    let member = getmemberfromuser (user);
    embedoutput.title = "⛔️ User Banned";
    embedoutput.fields = [];
    embedfielder ("Username", user.tag, true);
    embedfielder ("ID", user.id, true);
    embedsender (message.channel, embedoutput);
    let role = getrolefromname ("muted")
    let boolean1 = checkrole (member, role.name)
    if (boolean1 == true) return;
    member.addRole(role);
  } else

  if ((command === "botcontingencyplan" || command === "bcp")) {
    if (!checkrole (message.member, "mods")) return;
    console.log ("Is Mod.")
    let role = getrolefromname ("Bot-In-Use");
    nadekobot.removeRole(role);
    if (!checkrole (nadekobot, role.name) || args[0] == "enable") {
      nadekobot.addRole(role);
      sendgenericembed (message.channel, `**Bot Contingency Plan enabled.**`)
      bcpboolean = true;
    } else
    if (checkrole (nadekobot, role.name) || args[0] == "disable") {
      nadekobot.removeRole(role);
      sendgenericembed (message.channel, `**Bot Contingency Plan disabled.**`)
      bcpboolean = false;
    };
  } else

  if ((command === "testingmode") || (command === "tm")) {
    if (client.user.id != config.betabotID) return;
    let author = message.author;
    let member = getmemberfromuser(author);
    if (!checkrole (member, "dev")) return;
    let user = getuser ("LAZYbot");
    let channel = getchannelfromname ("devs");
    if (!testingmodeboolean || args[0] == "enable") {
      channel.overwritePermissions(bouncerbot, { 'SEND_MESSAGES': false })
      channel.overwritePermissions(user, { 'SEND_MESSAGES': false })
      channel = getchannelfromname ("spam");
      channel.overwritePermissions(bouncerbot, { 'SEND_MESSAGES': false })
      channel.overwritePermissions(user, { 'SEND_MESSAGES': false })
      sendgenericembed (message.channel, `**Testing mode enabled.**`)
      testingmodeboolean = true;
    } else
    if (testingmodeboolean || args[0] == "disable") {
      channel.overwritePermissions(bouncerbot, { 'SEND_MESSAGES': true })
      channel.overwritePermissions(user, { 'SEND_MESSAGES': true })
      channel = getchannelfromname ("spam");
      channel.overwritePermissions(bouncerbot, { 'SEND_MESSAGES': true })
      channel.overwritePermissions(user, { 'SEND_MESSAGES': true })
      sendgenericembed (message.channel, `**Testing mode disabled.**`)
      testingmodeboolean = false;
    };
  }

});

client.on("message", (message) => {

  if (!message.content.startsWith(config.prefix) || message.author.bot) return;

  const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();
  const argument = message.content.slice(command.length + config.nadekoprefix.length).trim();

  if (command === "prefix" || command === "lazybotprefix") {

    if (message.author.id !== owner.id) return;

    let newPrefix = argument;
    config.prefix = newPrefix
    fs.writeFile("./config.json", JSON.stringify(config, null, 4), (err) => console.error);

    message.channel.send(`Prefix has been updated to **${newPrefix}** !`);
    console.log (`${message.author.username} [${message.author.id}] has updated the prefix to ${newPrefix}`);
  } else

  if (command === "setusername") {
    if (message.author.id !== config.ownerID) return;
    let newUsername = args[0];
    clearvar()
    if (!newUsername == client.user.username) {
      client.user.setUsername(newUsername);
      sendgenericembed (message.channel, `Bot username has been updated to **${client.user.tag}**`);
    } else {
      senderrormessage (message, `Bot username was already **${client.user.tag}**!`)
    };
  } else

  if (command === "asl") {
    let [age,sex,location] = args;
    message.channel.send (`Hello **${message.author.username}**, I see you're a **${age}** year old **${sex}** from **${location}**.`);
  } else

  if (command === "ping") {
    sendgenericembed (message.channel, `** ${message.author.tag}** :ping_pong: ${parseInt(client.ping)}ms`)
  } else

  if (command === "uptime") {
    let time = gettime(Date.now() - reboot);
    sendtime (message, time);
  } else

  if (command === "messages") {
    if (args == null) {
      //let boolean1 = checkrole (message.member, "silver")
      //if (boolean1 == null) return;
      let user = message.author;
      messagecount (message, user);
    } else {
      clearvar()
      let user = getuser (argument);
      messagecount (message, user);
    };
  } else

  if ((command === "updatemessagecount") || (command === "updatemessages")) {
    
    if (message.author.id !== config.ownerID) return;
    clearvar()
    let user = getuser (args[0])
    let newcount = parseInt(args[1]);
    let dbuser = user ? getdbuserfromuser (user) : getdbuserfromusername (args[0]);
    if (!dbuser) return;
    let dbindex = getdbindexfromdbuser (dbuser)
    if (dbindex == -1) return;

    if (dbuser.messages == newcount) {
      senderrormessage (message, `Message count for **${user.tag}** was already **${dbuser.messages.toLocaleString()}** messages.`);
    } else {
      tally[dbindex].messages = newcount;
      if (tally == undefined) return;
      fs.writeFile("./messagelog.json", JSON.stringify(tally, null, 4), (err) => {
        if (err) console.error(err)
      });
      messagecount (message, user, true);
    };
  } else

  if (command === "removedbuser") {
    
    if (message.author.id !== config.ownerID) return;
    clearvar()
    let user = getuser (args[0])
    let dbuser = user ? getdbuserfromuser (user) : getdbuserfromusername (args[0]);
    if (!dbuser) return;
    let dbindex = getdbindexfromdbuser (dbuser)
    if (dbindex == -1) return;

    delete tally[dbindex];
    if (tally == undefined) return;
    fs.writeFile("./messagelog.json", JSON.stringify(tally, null, 4), (err) => {
      if (err) console.error(err)
    });
    
    embedoutput.description = `**${dbuser.username}** has been deleted from the database.`;
    embedoutput.color = 15406156;
    embedsender (message.channel, embedoutput);

  } else

  if (command === "lastmessage") {

    let lastmessage = getlastmessage (message.author);
    message.channel.send(lastmessage);

  } else

  if ((command === "commands") || (command === "lazybotcommands")) {

    embedoutput.description = "**Nadeko functions**\n```css\n.nadekoprefix        [newPrefix]    {owneronly}\n.fb                  [user]         {owneronly}\n.bcp                 [e/d]          {modsonly}\n.testingmode         [e/d]          {devonly}\n.mf                  [g,t,i]\n.tf                  [g,t,i]\n.decimaltous         [decimalodds]\n.ustodecimal         [usodds]\n.fetch               [messageid]\n.notify              [valid link]```\n**Bot functions**\n```css\n!prefix              [newPrefix]    {owneronly}\n!setusername         [newUsername]  {owneronly}\n!updatemessagecount  [user,msgs]    {owneronly}\n!removedbuser        [user]         {owneronly}\n!asl                 [a,s,l]\n!ping                []\n!uptime              []\n!messages            []\n!lastmessage         []\n!commands            []```\n**Miscellaneous Functions**\n```css\nsubreddit link       [/r/,r/]\nmessage counter      [message]\nleave message        [userLeft]\ntrivia payout msg    [embed,content]```";
    embedthumbnail (config.avatar);
    embedsender (message.channel, embedoutput);

  };

  cr (message, "marco", "polo!");
  cr (message, "ready", "I am ready!");
  cr (message, "owner", owner.user.tag);
  cr (message, "who", "I am LAZYbot#2309");
  cr (message, "help", "This is a pretty basic bot, there isn't much it can help you with.");
  cr (message, "party", ":tada:");

});

//reddit links section

client.on("message", (message) => {

  if (message.author.bot) return;
  if (!message.content.includes("r/")) return;

  var args = message.content.split(/ +/g);

  for(let i = 0;i < args.length; i++) {

    if (args[i].startsWith("/r/")) {
      args[i] = args[i].replace(/[.,#!$%\^&;:{}=-_`~()]/g,"");
      embedoutput.description = `[${args[i]}](http://www.reddit.com${args[i]})`;
      embedsender (message.channel, embedoutput)
      } else

    if (args[i].startsWith("r/")) {
      args[i] = args[i].replace(/[.,#!$%\^&;:{}=-_`~()]/g,"");
      embedoutput.description = `[/${args[i]}](http://www.reddit.com/${args[i]})`;
      embedsender (message.channel, embedoutput)
      }
    }
});

//trivia give commands

client.on('message', (message) => {
  
  var args = [];
  var verifier = [];
  var payoutoptions = [6,4,2,0];
  var claimoptions = [null,17,13,11,8,5,0];
  var payout = '';
  var payoutaggregate = '';
      triviagame = {};
      payoutmsg = [];
      name = [];
      args = [];

  // copy + paste input

  if (!message.author.bot) {

    if (!((message.content.startsWith ("Final Results")) || (message.content.startsWith ("Trivia Game Ended")))) return;

    verifier = message.content.split("\n");

    for (let i = 0; i < 2; i++) {
    if (verifier[i] == undefined) return; }
  
    triviagame.header = verifier[0];
    triviagame.title = verifier[1];

    for (i = 2; i < verifier.length; i++)
      {args[i-2] = verifier [i]}

    }

  // automatic bot embed input

  else if (message.author.bot) {

    if (message.author.id !== bouncerbot.id) return;
    if (message.embeds.length == 0) return;

    if (message.embeds[0].author == undefined
    ||  message.embeds[0].title == undefined
    ||  message.embeds[0].description == undefined
      ) return;

    triviagame.header = message.embeds[0].author.name;
    triviagame.title = message.embeds[0].title;
    triviagame.description = message.embeds[0].description;

    if (!((triviagame.title === "Final Results") || (triviagame.title === "Trivia Game Ended"))) return;

    args = triviagame.description.split("\n");

    };

  // give messages output

  if (
    (!(message.content.startsWith ("Final Results") || message.content.startsWith ("Trivia Game Ended")))
    && message.embeds[0] == undefined) return;
  if (
    (!(message.content.startsWith ("Final Results") || message.content.startsWith ("Trivia Game Ended")))
  && (message.embeds[0].author == undefined
  ||  message.embeds[0].title == undefined
  ||  message.embeds[0].description == undefined
  ||  !(message.embeds[0].title == "Trivia Game Ended" || message.embeds[0].title == "Final Results" )))  return;

  for (let i = 0; i < args.length; i++) {
    name[i] = args[i].split(/ +/g).shift();
    name[i] = name[i].split("*").join("");
    }

  if (name[0] == "No") return;
  if (name.length < 1) return;
  if (name.length > 6) {name.length = 6};
  
  name.ceiling = Math.ceil(0.5 + name.length/2);

  for (let i = 0; i < name.ceiling; i++) {
    payout = (parseInt(name.length) + parseInt(payoutoptions[i]) - 5) + "";
    payoutmsg[i] = `.give ` + payout + ` **` + name[i] + `**`;
    }
  if (name.length === 6) {payoutmsg[0] = `.give 8 **` + name[0] + `**`}
  payoutmsg.push(`.give ${claimoptions[name.length]} **housebank#5970**`);

  for (let i = 0; i < name.ceiling + 1;i++) {
    payoutaggregate +=  payoutmsg[i] + (i < payoutmsg.length -1 ? `\n` : ``)}
  if (name.length < 2) {
    payoutaggregate = `.give 17 **housebank#5970**`
    };

  embedoutput.title = `House Trivia ${name.length}-player Game`,
  embedoutput.description = payoutaggregate,
  embedfooter (`Please remember to check for ties.`)
  embedsender (message.channel, embedoutput);
  embedoutput = {};

  });

client.login(process.env.TOKEN ? process.env.TOKEN : config.token);

//this function is to be made irrelevant as soon as possible

function clearvar () {
  embedoutput = {};
};

// 'get' based functions

function checkrole (member, rolename) {
  clearvar ()
  let role = getrolefromname (rolename)
  return (member.roles.has(role.id));
};

function getchannelfromname (channelname) {
  if (!((typeof channelname) == "string")) return;
  let channel = guild.channels.find(channel => channelname.toLowerCase() == channel.name.toLowerCase())
  if (channel == null) {console.log ("No channel found!")};
  return channel;
};

function getrolefromname (rolename) {
  if (!((typeof rolename) == "string")) return;
  let role = guild.roles.find(role => rolename.toLowerCase() == role.name.toLowerCase())
  if (role == null) {console.log ("No role found!")};
  return role;
};

function getuser (searchstring) {
  clearvar()
  var user = getuserfromid (searchstring);
  if (user == null) {var user = getuserfromusername (searchstring)};
  if (user == null) {var user = getuserfromnickname (searchstring)};
  return user ? user : null;
};

function getuserfromid (snowflake) {
  clearvar()
  let user = client.users.find(user => snowflake.replace(/[.,#!$%\^&;:{}<>=-_`~()]/g,"") == user.id)
  console.log (user ? "ID Found!" : "No id found, checking username...");
  return user;
};

function getuserfromusername (string) {
  clearvar()
  let user = client.users.find(user => string.toLowerCase() == user.username.toLowerCase())
  console.log (user ? "Username found!" : "No username found, checking nickname...");
  return user;
};

function getuserfromnickname (string) {
  clearvar()
  let member = guild.members.find(member => member.nickname && string.toLowerCase() == member.nickname.toLowerCase())
  console.log (member ? "Nickname found!" : "No nickname found.");
  if (member == null) {return member} else {return member.user};
};

function getmemberfromuser (user) {
  clearvar()
  let member = guild.members.find(member => user.id == member.id)
  console.log (member ? "Member found!" : "No member found.");
  if (member == null) {return} else {return member};
};

function messagecount (message, user, update) {

  user ? user = user : user = message.author;
  let dbuser = getdbuserfromuser (user);
  if (dbuser == undefined) return;
  embedoutput.description = update ? `Message count for **${user.tag}** is now **${dbuser.messages.toLocaleString()}** messages.` : `**${user.tag}** has sent **${dbuser.messages.toLocaleString()}** messages.`;
  embedsender (message.channel, embedoutput);
  embedoutput = {};
  
};

function getdbuserfromuser (user) {

  let dbuser = tally.find(dbuser => user.id == dbuser.id);
  if (dbuser == null) {
    console.log ("No dbuser found, creating one...");
    tally.push ({
      id: user.id,
      username: user.tag,
      messages: 0,
    });
    fs.writeFile("./messagelog.json", JSON.stringify(tally, null, 4), (err) => {
      if (err) console.error(err)
    });
  };
  dbuser = tally.find(dbuser => user.id == dbuser.id);
  return dbuser;

};

function getdbuserfromusername (username) {

  let dbuser = tally.find(dbuser => username == dbuser.username);
  return dbuser;

};

function getdbindexfromdbuser (dbuser) {

  return tally.findIndex(index => dbuser.id == index.id)

};

function returnmessagefromid (channel, id) {

  channel.fetchMessage(id)
    .then (message => {
      let fulltimestamp = gettime (message.createdAt) + "";
      let timestamp = fulltimestamp.slice(0, 31)
      if (message.embeds.length !== 0) {
        embedoutput.description = message.embeds[0].description
        // embedoutput = embedreceiver (message.embeds[0])
      } else {
        embedoutput.description = message.content
      };
      embedoutput.content = `On ${timestamp}, user **${message.author.tag}** said:`;
      embedsender (channel, embedoutput);
    })
    .catch (console.error);

};

// embed section of functions

function embedsender (channel, embedoutput) {
  
  embedoutput.color = (embedoutput.color == undefined ? config.color : embedoutput.color );
  channel.send(embedoutput.content, {embed: embedoutput})
  clearvar()

};

function embedfielder (name, value, inline) {

  for (i = 0; i < embedoutput.fields.length; i++) {
    embedoutput.fields[i].inline = (embedoutput.fields[i].inline == undefined ? false : embedoutput.fields[i].inline )};
  embedoutput.fields.push({"name": name, "value": value, "inline": inline})

};

function embedauthor (name, icon_url) {

  embedoutput.author = {};
  if (name) embedoutput.author.name = name;
  if (icon_url) embedoutput.author.icon_url = icon_url;

};

function embedthumbnail (link) {

  embedoutput.thumbnail = {};
  if (link) embedoutput.thumbnail.url = link;

};

function embedimage (link) {

  embedoutput.image = {};
  if (link) embedoutput.image.url = link;

};

function embedfooter (text, icon_url) {

  embedoutput.footer = {};
  if (text) embedoutput.footer.text = text;
  if (icon_url) embedoutput.footer.icon_url = icon_url;

};

function embedreceiver (embed) {

  console.log (embed);
  console.log (embed.description);

  if (typeof embed.title !== "undefined") {embedinput.title = embed.title};

  var embedproperties = [title, url, color, description, image, fields, timestamp]

  for (i = 0; i < embedproperties.length; i++) {
    if (typeof embed[embedproperties[i]] != undefined) {
      embedinput[embedproperties[i]] = embed[embedproperties[i]];
    }
  }

  if (embed.author) {embedinput.author = embed.author};
  if (embed.footer) {embedinput.author = embed.footer};

/*
  embedinput = {
    author: {
      name: embed.author.name,
      icon_url: embed.author.icon_url,
    },
    title: embed.title,
    url: embed.url,
    color: embed.color,
    description: embed.description,
    image: embed.image,
    fields: embed.fields,
    timestamp: embed.timestamp,
    footer: {
      icon_url: embed.footer.icon_url,
      text: embed.footer.text
    }

  }; */

  return embedinput;

};

function cr (message, trigger, reponse) {

  const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();
  const response = reponse;

  if (command === trigger) {message.channel.send(response)};

};

function checkuseronline (checkuser) {
  checkuser = checkuser;
  checkuser.presence.status == "offline" ? offlineboolean = true : offlineboolean = false;
}; 

function checkbounceronine () {
  checkuseronline (bouncerbot);
}

function getlastmessage (user) {

  return user.lastMessage.content;

};

function gettime (ms) {
  let time = new Date(ms);
  time.hours = time.getUTCHours();
  time.minutes = time.getUTCMinutes();
  time.seconds = time.getUTCSeconds();
  time.milliseconds = time.getUTCMilliseconds();
  time.days = Math.floor(time.hours/24);
  time.hours = time.hours - (24 * time.days);
  return time;
};

function sendtime (message, time) {
  clearvar()
  embedoutput.description = `**${time.days}** days, **${time.hours}** hours, **${time.minutes}** minutes, and **${time.seconds}** seconds since last reboot.`
  embedsender (message.channel, embedoutput);
};

function senderrormessage (channel, description) {
  clearvar()
  embedoutput.description = description;
  embedoutput.color = 15406156;
  embedsender (channel, embedoutput);
};

function sendgenericembed (channel, description) {
  clearvar()
  embedoutput.description = description;
  embedsender (channel, embedoutput);
};
