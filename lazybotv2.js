const Discord = require("discord.js");
const client = new Discord.Client();
const fs = require("fs");

const config = require("./config.js");
const settings = require("./settings.js");
const LeaderboardConstructor = require("./leaderboard.js");
const TrackerConstructor = require("./tracker.js");
const package = require("./package.json")
const tracker = new TrackerConstructor({
	"onTrackSuccess": onTrackSuccess, 
	"onRemoveSuccess": onRemoveSuccess, 
	"onRatingUpdate": onRatingUpdate, 
	"onError": onTrackError, 
	"onModError": onModError
});
const msgSplitRegExp = /[^\s]+/gi;
const RATINGS = settings.ratings;
const nadekoprefix = config.nadekoprefix;
const prefix = config.prefix;
const nadekoid = config.nadekoID;
  var i;
  var j;
  var k;
      messageID = [];

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

  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 6; j++) {
        if(message.content.startsWith (config.nadekoprefix + notifycommand[i] + " " + domain[j])) {
          message.channel.send("@here");
        let [link] = args;
          console.log(`${message.author.username} has sent out a ping for ${link}.`);
  }}}

  //change nadekoprefix

  if (command === "nadekoprefix") {

    if(message.author.id != config.ownerID) return;

    let [newNadekoPrefix] = args;  
    config.nadekoprefix = newNadekoPrefix
    fs.writeFile("./config.json", JSON.stringify(config), (err) => console.error);

    message.channel.send(`Nadeko-Integration Prefix has been updated to **${newNadekoPrefix}** !`);
    console.log(`${message.author.username} [${message.author.id}] has updated NadekoPrefix to ${newNadekoPrefix}`);
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

    let [decimalodds] = args;

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

    let [usodds] = args;

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

  if (command === "everyone") {
    message.channel.send("Why would you try and do that tho");
  } /* else
  
  if (command === "fetch") {

    let channel = message.channel;

    if (!(args[1] == undefined)) return;

    if (!(args[0].length == 18)) return;

    function store(messagecontent) {
      return messagecontent;
      }
    
    var newembed =
      message.channel.fetchMessage(args[0])
      .then (message => store(message.content))

    console.log(newembed);

  }; */

  // getMessage(channel, messageID, callback) */

});

client.on("message", (message) => {

  if (!message.content.startsWith(config.prefix) || message.author.bot) return;

  const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  if (command === "prefix" || command === "lazybotprefix") {

    console.log("I made it less far!");

    if(message.author.id != config.ownerID) return;

    console.log("I made it this far!");

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
  } else

  if(command === "party") {
    message.channel.send(`:tada:`)
  }

});

//reddit links section

client.on("message", (message) => {

  if (message.author.bot) return;

  if (!message.content.includes("r/")) return;

  var args = message.content.split(/ +/g);

  for(let i = 0;i < args.length; i++) {

    if(args[i].startsWith("/r/")) {
      args[i] = args[i].replace(/[.,#!$%\^&;:{}=-_`~()]/g,"");
      message.channel.send({embed: {
        color: 53380,
        description: `[${args[i]}](http://www.reddit.com${args[i]})`
        }});
      } else

    if(args[i].startsWith("r/")) {
      args[i] = args[i].replace(/[.,#!$%\^&;:{}=-_`~()]/g,"");
      message.channel.send({embed: {
        color: 53380,
        description: `[/${args[i]}](http://www.reddit.com/${args[i]})`
        }});
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
    if (!(message.author.id == config.nadekoID)) return;
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

  for (let i = 0; i < args.length; i++) {
    name[i] = args[i].split(/ +/g).shift();
    name[i] = name[i].split("*").join("");
    }

  if (name[0] === "No results") return;
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
    }
    
  message.channel.send({embed: {
    title: `House Trivia ${name.length}-player Game`,
    color: 53380,
    description: payoutaggregate,
    footer: {
      text: "Please remember to check for ties."
        }
      }});

  });

  client.on("guildMemberAdd", (guildMember) => {
    let foundRole = guildMember.guild.roles.find("name", settings.unrankedRoleName);
    if(foundRole) {
      guildMember.addRole(foundRole).catch((e) => console.log(JSON.stringify(e)));
    }
  });
  
  client.on("guildMemberRemove", (guildMember) => {
    let channel = getBotChannel(guildMember.guild);
    tracker.remove(guildMember.guild.id, guildMember.id, true);
  });
  
  client.on("message", (message) => {
    
    if (!message.content.startsWith(config.prefix) || message.author.bot) return;

    const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();
  
    let splitMsg = message.content.match(msgSplitRegExp);
  
    console.log(`Command: ${message}`);
  
    //HELP
    if(splitMsg[0].toLowerCase() === "!dbhelp") {
      if(splitMsg.length === 1) {
        message.channel.send({"embed": getHelpEmbed()})
        .catch((e) => console.log(JSON.stringify(e)));
      }
      return;
    }
  
    //REMOVE
    if(splitMsg[0].toLowerCase() === "!remove") {
      if(splitMsg.length === 1) {
        tracker.remove(message.guild.id, message.member.id);
      } else if(splitMsg.length === 3) {
        let source = splitMsg[1].toLowerCase();
        if(source === "chesscom" || source === "lichess") {
          tracker.removeByUsername(message.guild.id, source, splitMsg[2]);
        } else {
          message.channel.send("Bad second parameter (source).")
          .catch((e) => console.log(JSON.stringify(e)));
        }
      } else {
        message.channel.send("Wrong amount of parameters.")
        .catch((e) => console.log(JSON.stringify(e)));
      }
      return;
    }
  
    //UPDATE
    if(splitMsg[0].toLowerCase() === "!update") {
      if(splitMsg.length === 1) {
        tracker.queueForceUpdate(message.member.id);
        message.channel.send("Queued for update.")
        .catch((e) => console.log(JSON.stringify(e)));
      }
      return;
    }
  
    //ADD LICHESS
    if(splitMsg[0].toLowerCase() === "!lichess") {
      if(splitMsg.length === 2) {
        //Adding sender to tracking
        tracker.track(message.guild.id, message.member.id, "Lichess", splitMsg[1]);
      } else if(splitMsg.length === 3) {
        if(canManageRoles(message.member)) {
          let member = getMemberFromMention(message.guild, splitMsg[2]);
          if(member) {
            tracker.track(message.guild.id, member.id, "Lichess", splitMsg[1]);
          } else {
            message.channel.send("Invalid user mention given.")
            .catch((e) => console.log(JSON.stringify(e)));
          }
        } else {
          message.channel.send("You do not have permission to do this.")
          .catch((e) => console.log(JSON.stringify(e)));
        }
      } else {
        message.channel.send("Wrong amount of parameters.")
        .catch((e) => console.log(JSON.stringify(e)));
      }
      return;
    }
  
    //ADD CHESS.COM
    if(splitMsg[0].toLowerCase() === "!chesscom") {
      if(splitMsg.length === 2) {
        //Adding sender to tracking
        tracker.track(message.guild.id, message.member.id, "Chesscom", splitMsg[1]);
      } else if(splitMsg.length === 3) {
        if(canManageRoles(message.member)) {
          let member = getMemberFromMention(message.guild, splitMsg[2]);
          if(member) {
            tracker.track(message.guild.id, member.id, "Chesscom", splitMsg[1]);
          } else {
            message.channel.send("Invalid user mention given.")
            .catch((e) => console.log(JSON.stringify(e)));
          }
        } else {
          message.channel.send("You do not have permission to do this.")
          .catch((e) => console.log(JSON.stringify(e)));
        }
      } else {
        message.channel.send("Wrong amount of parameters.")
        .catch((e) => console.log(JSON.stringify(e)));
      }
      return;
    }
  
    //LIST
    if(splitMsg[0].toLowerCase() === "!list") {
      if(splitMsg.length === 1) {
        let leaderboard = new LeaderboardConstructor({});
        let list = leaderboard.getList(getNick);
        list.embed.color = settings.embedColor;
        message.channel.send(list).catch((e) => console.log(JSON.stringify(e)));
      } else if(splitMsg.length === 2) {
        //Page or type
        let val = splitMsg[1].toLowerCase();
        if(val !== "bullet" && val !== "blitz" && val !== "rapid" && val !== "classical") {
          val = parseInt(val);
          if(isNaN(val)) {
            message.channel.send("Bad second parameter (type or page).")
            .catch((e) => console.log(JSON.stringify(e)));
            return;
          } else {
            let leaderboard = new LeaderboardConstructor({
              "page": val
            });
            let list = leaderboard.getList(getNick);
            list.embed.color = settings.embedColor;
            message.channel.send(list).catch((e) => console.log(JSON.stringify(e)));
          }
        } else {
          let leaderboard = new LeaderboardConstructor({
            "type": capitalise(val)
          });
          let list = leaderboard.getList(getNick);
          list.embed.color = settings.embedColor;
          message.channel.send(list).catch((e) => console.log(JSON.stringify(e)));
        }
      } else if(splitMsg.length === 3) {
        //Page and type
        let type = splitMsg[1].toLowerCase();
        let page = parseInt(splitMsg[2]);
        if(type !== "bullet" && type !== "blitz" && type !== "rapid" && type !== "classical") {
          message.channel.send("Bad second parameter (type).")
          .catch((e) => console.log(JSON.stringify(e)));
          return;
        }
        if(isNaN(page)) {
          message.channel.send("Bad third parameter (page).")
          .catch((e) => console.log(JSON.stringify(e)));
          return;
        }
        let leaderboard = new LeaderboardConstructor({
          "type": capitalise(type),
          "page": page
        });
        let list = leaderboard.getList(getNick);
        list.embed.color = settings.embedColor;
        message.channel.send(list).catch((e) => console.log(JSON.stringify(e)));
      }
      return;
    }
  
    //RANK
    if(splitMsg[0].toLowerCase() === "!myrank") {
      if(splitMsg.length === 1) {
        let leaderboard = new LeaderboardConstructor({});
        let rank = leaderboard.getRank(getNick, message.member.id);
        if(rank.embed) {
          rank.embed.color = settings.embedColor;
        }
        message.channel.send(rank).catch((e) => console.log(JSON.stringify(e)));
      }
      return;
    }
  
  });

  function onModError(serverID, msg) {
    let channel = getModChannel(client.guilds.get(serverID));
    channel.send(msg).catch((e) => console.log(JSON.stringify(e)));
  }
  
  function onTrackError(serverID, msg) {
    let channel = getBotChannel(client.guilds.get(serverID));
    let description = `No longer tracking ${member}`;
    botChannel.send({
      "embed": {
      "title": "Track Error",
      "description": msg,
      "color": settings.embedColor
    }});
    channel.send(msg).catch((e) => console.log(JSON.stringify(e)));
  }
  
  function getMemberFromMention(guild, text) {
    if(!text.startsWith("<@") || !text.endsWith(">")) {
      return null;
    }
    text = text.replace(/[^\d]/g, "");
    return guild.members.get(text);
  }
  
  function canManageRoles(member) {
    return member.permissions.has(Discord.Permissions.FLAGS.MANAGE_ROLES);
  }
  
  function capitalise(str) {
    return str[0].toUpperCase() + str.slice(1).toLowerCase();
  }
  
  function getNick(serverID, userID) {
    let guild = client.guilds.get(serverID);
    let member = guild.members.get(userID);
    return member.nickname ? member.nickname : member.user.username;
  }
  
  function onRemoveSuccess(serverID, userID, username) {
    let guild = client.guilds.get(serverID);
    let botChannel = getBotChannel(guild);
    let member = guild.members.get(userID);
    let title = `Stopped tracking via !remove command`;
    let description = `No longer tracking ${member}`;
    botChannel.send({
      "embed": {
      "title": title,
      "description": description,
      "color": settings.embedColor
    }});
    removeRatingRole(serverID, userID);
  }
  
  function removeRatingRole(serverID, userID) {
    let guild = client.guilds.get(serverID);
    let member = guild.members.get(userID);
    let roles = getMemberRatingRoles(member);
    for(let i = 0; i < roles.length; i++) {
      member.removeRole(roles[i]).catch((e) => console.log(JSON.stringify(e)));
    }
    let unrankedRole = guild.roles.find("name", settings.unrankedRoleName);
    if(unrankedRole) {
      member.addRole(unrankedRole).catch((e) => console.log(JSON.stringify(e)));
    }
  }
  
  function getMemberRatingRoles(member) {
    let foundRoles = [];
    member.roles.some(function(role) {
      let num = parseInt(role.name);
      if(RATINGS.indexOf(num) >= 0) {
        foundRoles.push(role);
      }
    });
    return foundRoles;
  }
  
  function onTrackSuccess(serverID, userID, ratingData, source, username) {
    let guild = client.guilds.get(serverID);
    let newRole = findRoleForRating(guild, ratingData.maxRating);
    let botChannel = getBotChannel(guild);
    if(!newRole) {
      console.log("Could not find a valid role for rating " + ratingData.maxRating)
      .catch((e) => console.log(JSON.stringify(e)));
      return;
    }
  
    let member = guild.members.get(userID);
  
    //If user has an unranked role, remove it
    let unranked = member.roles.find("name", settings.unrankedRoleName);
    if(unranked) {
      member.removeRole(unranked).catch((e) => console.log(JSON.stringify(e)));
    }
    if(source === "Chesscom") {
      source = "Chess.com";
    }
    //Add a rating role
    member.addRole(newRole).then(() => {
      let title = `Linked ${member.user.username} to '${username}' on ${source}`;
      let description = `[${source}: **${username}**](${(source === "Lichess" ? settings.lichessProfileURL : settings.chesscomProfileURL).replace("|", username)})\nAdded to the role ** ${newRole.name} **. You have a rating of ** ${ratingData.maxRating} **\n` + 
        (ratingData.classical ? "Classical: **" + ratingData.classical + "**\n" : "") +
        (ratingData.rapid ? "Rapid: **" + ratingData.rapid + "**\n" : "") +
        (ratingData.blitz ? "Blitz: **" + ratingData.blitz + "**\n" : "") +
        (ratingData.bullet ? "Bullet: **" + ratingData.bullet + "**": "");
  
      botChannel.send({
        "embed": {
          "title": title,
          "description": description,
          "color": settings.embedColor
        }
      }).catch((e) => console.log(JSON.stringify(e)));
    }).catch(function(error) {
      console.log("Error adding new role", error);
    });
  }
  
  function onRatingUpdate(serverID, userID, oldData, ratingData, source, username) {
    let guild = client.guilds.get(serverID);
    let botChannel = getBotChannel(guild);
    let member = guild.members.get(userID);
    if(source === "Chesscom") {
      source = "Chess.com";
    }
    if(!member) {
      console.log(username + " (" + source + ") not found on the server. Removing from tracking");
      tracker.remove(guild.id, userID);
      return;
    }
    let newRole = findRoleForRating(guild, ratingData.maxRating);
    if(!newRole) {
      console.log("Could not find a valid role for rating " + ratingData.maxRating)
      .catch((e) => console.log(JSON.stringify(e)));
      return;
    }
    let currentRoles = getMemberRatingRoles(member);
    for(let i = 0; i < currentRoles.length; i++) {
      let role = currentRoles[i];
      if(role.name !== newRole.name) {
        //Remove other rating roles if exist
        member.removeRole(role).catch((e) => console.log(JSON.stringify(e)));
      }
    }
    //Add new role
    if(!currentRoles.find((r) => newRole.name === r.name)) {
      member.addRole(newRole).then(() => {
        let title = "Updated " + getNick(serverID, userID) + " as '" + username + "' on " + source;
        let description = "New rating group **" + newRole.name + "** with a rating of **" + ratingData.maxRating + "**\n" +
          (ratingData.classical ? "Classical: **" + ratingData.classical + "**\n" : "") +
          (ratingData.rapid ? "Rapid: **" + ratingData.rapid + "**\n" : "") +
          (ratingData.blitz ? "Blitz: **" + ratingData.blitz + "**\n" : "") +
          (ratingData.bullet ? "Bullet: **" + ratingData.bullet + "**": "");
        botChannel.send({
          "embed": {
            "title": title,
            "description": description,
            "color": settings.embedColor
          }
        }).catch((e) => console.log(JSON.stringify(e)));
      }).catch((error) => {
        console.log("Error adding new role", error);
      });
    }
  }
  
  function findRoleForRating(guild, rating) {
    rating = parseInt(rating);
  
    //Deal with lowest rating role
    // let matchedRole = rating < RATINGS[0] ? RATINGS[0] + "-" : null;
    let matchedRole = "EikaBotTester";
    
    if(!matchedRole) {
      //Deal with highest rating role
    //  matchedRole = rating >= RATINGS[RATINGS.length - 1] ? RATINGS[RATINGS.length - 1] + "++" : null;
    let matchedRole = "test";
    }
    if(!matchedRole) {
      for(let i = RATINGS.length - 1; i > 0; i--) {
        if(rating >= RATINGS[i]) {
          matchedRole = RATINGS[i] + "+";
          break;
        }
      }
    }
    if(!matchedRole) {
      return null;
    }
  
    let role = guild.roles.find("name", matchedRole);
  
    return role;
  }
  
  function getModChannel(guild) {
    let channel = guild.channels.find("name", settings.modChannelName);
    if(!channel) {
      console.log("No mod channel found on server: " + guild.name);
    }
    return channel;
  }
  
  function getBotChannel(guild) {
    let channel = guild.channels.find("name", settings.botChannelName);
    if(!channel) {
      console.log("No bot channel found on server: " + guild.name);
    }
    return channel;
  }
  
  function getHelpEmbed() {
    return {
      "color": settings.embedColor,
      "fields": [{
        "name": "!Lichess [Lichess Username]",
        "value": "Links you to a specific username on Lichess."
      },{
        "name": "!Chesscom [Chess.com Username]",
        "value": "Links you to a specific username on Chess.com."
      },{
        "name": "!Remove",
        "value": "Removes you from the rating tracker."
      },{
        "name": "!Update",
        "value": "Queue prioritised update of your ratings."
      },{
        "name": "!List [page]",
        "value": "Show current leaderboard. Page is optional."
      },{
        "name": "!List [bullet | blitz | rapid | classical]",
        "value": "Show current leaderboard. Time control is optional."
      },{
        "name": "!List [bullet | blitz | rapid | classical] [page]",
        "value": "Show current leaderboard. Time control is optional. Page is optional."
      },{
        "name": "!MyRank",
        "value": "Displays your current rank."
      },{
        "name": "!Arena",
        "value": "Toggles arena role."
      },{
        "name": "!League",
        "value": "Toggles league role."
      },{
        "name": "!Lichess [Lichess username] [@Discord User Mention]",
        "value": "Links discord user to a specific username on Lichess."
      },{
        "name": "!Chesscom [Chess.com username] [@Discord User Mention]",
        "value": "Links discord user to a specific username on Chess.com."
      },{
        "name": "!Remove [Chesscom | Lichess] [Chess.com or Lichess Username]",
        "value": "Removes a username on respective platform from the rating tracker."
      }]
    };
  }

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