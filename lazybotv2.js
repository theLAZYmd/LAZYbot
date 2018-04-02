const Discord = require("discord.js");
const client = new Discord.Client();
const DataManagerConstructor = require("./datamanager.js");
const DataManager = new DataManagerConstructor("./db.json");
let guildconfig = require("./guildconfig.json");
require ("./config.json");
require ("./guildconfig.json");
require ("./package.json");

//const LeaderboardConstructor = require("./leaderboard.js");
const TrackerConstructor = require("./tracker.js");
const tracker = new TrackerConstructor({
	"onTrackSuccess": onTrackSuccess, 
	"onRemoveSuccess": onRemoveSuccess, 
	"onRatingUpdate": onRatingUpdate, 
	"onError": onTrackError, 
	"onModError": onModError
});
const messageSplitRegExp = /[^\s]+/gi;

const config = DataManager.getData("./config.json");
const dbtemplate = config.template;
var guild;
var bouncerbot;
var nadekobot;
var owner;
var reboot;
var RATINGS;

var bcpboolean;

  var i;
      embedinput = {};
      embedoutput = {};

//console startup section

client.on("ready", () => {

  reboot = Date.now();  
  guild = client.guilds.get(guildconfig.guild);
  console.log(`Loaded client server ${guild.name} in ${Date.now() - reboot}ms`);
  bouncerbot = guild.members.get(guildconfig.bouncerID);
  console.log(`Noticed bot user ${bouncerbot.user.tag} in ${Date.now() - reboot}ms`);
  nadekobot = guild.members.get(guildconfig.nadekoID);
  console.log(`Noticed bot user ${nadekobot.user.tag} in ${Date.now() - reboot}ms`);
  for (let i = 0; i < config.ownerID.length; i++) {
    let checkowner = guild.members.get(config.ownerID[i])
    if (checkowner) {
      owner = checkowner;
      console.log(`Noticed bot owner ${owner.user.tag} in ${Date.now() - reboot}ms`);
    }
  };
  bcpboolean = false;
  RATINGS = guildconfig.ratings;
  console.log("bleep bloop! It's showtime.");
});

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
backupdb ("1", 3600000);
backupdb ("2", 7200000);
backupdb ("3", 43200000);

//leave message 

client.on("guildMemberRemove", (member) => {

  clearvar();
  let channel = getchannelfromname ("off-topic");
  console.log(channel.name)
  let dbuser = getdbuserfromuser (member.user);
  console.log(member.user.username);
  embedoutput.description = `**${member.user.tag}** has left **${guild.name}**. Had **${dbuser.messages ? dbuser.messages.toLocaleString() : 0}** messages.`;
  embedoutput.color = 15406156;
  if (dbuser.lastmessage) {embedfielder ("Last Message", "```" + dbuser.lastmessage + "```")};
  embedsender (channel, embedoutput);

});
//section for commands that integrate with Nadeko

client.on("message", (message) => {

  if (!message.content.startsWith(guildconfig.nadekoprefix) || message.author.bot) return;

  const args = message.content.slice(guildconfig.nadekoprefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();
  const argument = message.content.slice(command.length + guildconfig.nadekoprefix.length).trim();

  //@here command

  if (command === "notify"){

    let link = args[0]
    let ETA = argument.slice(args[0].length + 1, argument.length);
    console.log("ETA is " + ETA);
 
    for (let i = 0; i < guildconfig.acceptedlinkdomains.length; i++) {
      if (link.startsWith(guildconfig.acceptedlinkdomains[i])) {
        clearvar()
        embedoutput.content = "@here";
        embedoutput.title = "Tournament Starting!";
        embedoutput.description = `Greeetings ${message.channel}. You have been invited to join a tournament by **${message.author.tag}**.${ETA ? ` Tournament starts in ${ETA}!` : " Join now!"}\n${link}`;
        embedsender (message.channel, embedoutput);      
        console.log(`${message.author.username} has sent out a ping for ${link}.`);
      };
    };
  } else

  //change nadekoprefix

  if (command === "nadekoprefix") {

    if (checkowner(message.author) === false) return;

    let [newNadekoPrefix] = args;  
    guildconfig.nadekoprefix = newNadekoPrefix
    DataManager.setData(guildconfig, "./guildconfig.json");

    message.channel.send(`Nadeko-Integration Prefix has been updated to **${newNadekoPrefix}** !`);
    console.log(`${message.author.username} [${message.author.id}] has updated NadekoPrefix to ${newNadekoPrefix}`);
  } else

  if (command === "mf") {

    let [games,time,increment] = args;
    message.channel.send({embed: {
      title: "House Match Reward",
      color: 53380,
      description: Math.floor(7/12 * Number(games) * (Number(time) + 2/3 * Number(increment))) + " :cherry_blossom:"
    }});

  } else

  if (command === "tf") {

  let [games,time,increment] = args;
    message.channel.send({embed: {
      title: "House Tournament Reward",
      color: 53380,
      description: Math.floor(1/10 * Number(games) * (Number(time) + 2/3 * Number(increment))) + " :cherry_blossom:"
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
    if (1 <= decimalodds < 2) {embedoutput.description = (-100/(decimalodds-1)).toFixed(0).toString()};
    if (2 < decimalodds) {embedoutput.description = "+" + (100*(decimalodds-1)).toFixed(0).toString()};
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
    if (args[0] == null || !checkowner(message.author)) return;
    clearvar ();
    let user = getuser (args[0], true);
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
    
    let author = message.author;
    let member = getmemberfromuser(author);
    if (!checkrole (member, "dev")) return;
    if ((!guildconfig.testingmodeboolean || args[0] == "enable") && (client.user.id === config.betabotID)) {
      enabletestingmode (message)
      sendgenericembed (message.channel, `**Testing mode enabled.**`)
    } else
    if (guildconfig.testingmodeboolean || args[0] == "disable") {
      disabletestingmode (message)
    };
  } else

  if (command === "timely") {
    if (!config.testingmodeboolean) return;
    senderrormessage (message.channel, "Testing mode is enabled, `.timely` cannot be used in this channel.")
  };

});

client.on("message", (message) => {

  tracker.messagelogger (message);

  if (!message.content.startsWith(guildconfig.prefix) || message.author.bot) return;

  const args = message.content.slice(guildconfig.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();
  const argument = message.content.slice(command.length + guildconfig.nadekoprefix.length).trim();

  console.log("Command: " + command);
  
  if (command === "prefix" || command === "lazybotprefix") {

    if (checkowner(message.author) === false) return;

    let newPrefix = argument;
    guildconfig.prefix = newPrefix
    DataManager.setData(guildconfig, "./guildconfig.json");

    message.channel.send(`Prefix has been updated to **${newPrefix}** !`);
    console.log(`${message.author.username} [${message.author.id}] has updated the prefix to ${newPrefix}`);
  } else

  if (command === "setusername") {
    if (checkowner(message.author) === false) return;
    let newUsername = args[0];
    clearvar()
    if (newUsername != client.user.username) {
      client.user.setUsername(newUsername);
      sendgenericembed (message.channel, `Bot username has been updated to **${client.user.tag}**`);
    } else {
      senderrormessage (message.channel, `Bot username was already **${client.user.tag}**!`)
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
    let user = argument ? getuser (argument) : message.author;
    messagecount (message, user);
  } else

  if ((command === "updatemessagecount") || (command === "updatemessages")) {
    if (checkowner(message.author) === false) return;
    let tally = DataManager.getData();
    clearvar()
    let user = getuser (args[0])
    let newcount = parseInt(args[1]);
    if (user == null) return;
    let dbuser = user ? getdbuserfromuser (user) : getdbuserfromusername (args[0]);
    if (!dbuser) return;
    let dbindex = getdbindexfromdbuser (dbuser)
    if (dbindex == -1) return;

    if (dbuser.messages == newcount) {
      senderrormessage (message.channel, `Message count for **${user.tag}** was already **${dbuser.messages.toLocaleString()}** messages.`);
    } else {
      let tally = DataManager.getData();
      tally[dbindex].messages = newcount;
      if (tally == undefined) return;
      DataManager.setData(tally);
      messagecount (message, user, true);
    };
  } else

  if (command === "removedbuser") {
    if (checkowner(message.author) === false) return;
    let tally = DataManager.getData();    
    clearvar()
    let user = getuser (args[0], true)
    console.log(user);
    let dbuser = user ? getdbuserfromuser (user) : getdbuserfromusername (args[0]);
    if (!dbuser) return;
    let dbindex = getdbindexfromdbuser (dbuser)
    if (dbindex == -1) return;
    delete tally[dbindex];
    if (tally == undefined) return;
    DataManager.setData(tally);
    embedoutput.description = `**${dbuser.username}** has been deleted from the database.`;
    embedoutput.color = 15406156;
    embedsender (message.channel, embedoutput);

  } else

  if (command === "lastmessage") {

    let user = argument ? getuser (argument) : message.author;
    if (user == null) {
      senderrormessage(message.channel, `No user found.`)
    } else {
      let dbuser = getdbuserfromuser (user);
      let dbindex = getdbindexfromdbuser (dbuser);
      var lastmessage;
      if (dbuser.lastmessage) {
        clearvar()
        lastmessage = (dbuser.lastmessagedate ? `\nSent at ${getISOtime (dbuser.lastmessagedate)}.` : "") + (dbuser.lastmessage.startsWith("<:") && dbuser.lastmessage.endsWith (">") ? "\n" + dbuser.lastmessage : "\`\`\`" + dbuser.lastmessage + "\`\`\`");
        embedoutput.title = "Last Message";
        embedoutput.description = lastmessage;
        embedsender (message.channel, embedoutput);
      };
    }
  } else

  if ((command === "commands") || (command === "lazybotcommands")) {

    clearvar()
    embedoutput.description = "**Nadeko functions**\n```css\n.nadekoprefix        [newPrefix]    {owneronly}\n.fb                  [user]         {owneronly}\n.bcp                 [e/d]          {modsonly}\n.testingmode         [e/d]          {devonly}\n.mf                  [g,t,i]\n.tf                  [g,t,i]\n.decimaltous         [decimalodds]\n.ustodecimal         [usodds]\n.fetch               [messageid]\n.notify              [valid link]```\n**Bot functions**\n```css\n!prefix              [newPrefix]    {owneronly}\n!setusername         [newUsername]  {owneronly}\n!updatemessagecount  [user,msgs]    {owneronly}\n!removedbuser        [user]         {owneronly}\n!asl                 [a,s,l]\n!ping                []\n!uptime              []\n!messages            []\n!lastmessage         []\n!commands            []```\n**Miscellaneous Functions**\n```css\nsubreddit link       [/r/,r/]\nmessage counter      [message]\nleave message        [userLeft]\ntrivia payout msg    [embed,content]```";
    embedthumbnail (config.avatar);
    embedsender (message.channel, embedoutput);

  }  else

  if (command === "profile") {
    let user = argument ? getuser (argument) : message.author;
    if (user == null) {
      senderrormessage(message.channel, `No user found.`)
    } else {
      clearvar()
      let embedoutput = getprofile (user);
      embedsender (message.channel, embedoutput);
    }
  } else

  if (command === "addfield") {
    if (checkowner(message.author) === false) return;
    let tally = DataManager.getData();
    clearvar()
    let newfield = args[0].replace(/[.,#!$%\^&;:{}<>=-_`\"~()]/g,"");
    if (!newfield) return;

    if (tally[0][newfield] || (tally[0][newfield] == "")) {
      senderrormessage (message.channel, "Field already exists!")
    } else {
      for (i = 0; i < tally.length; i++) {
        tally[i][newfield] = ""};
      if (tally == undefined) return;
      DataManager.setData(tally);
      sendgenericembed (message.channel, `New field **${newfield}** has been added to each user in db.`);
    };
    
  } else

  if(command === "ratingmod") {
    let source = args[0];
    let sourceratings = args[0] = "ratings";
    let tally = DataManager.getData();
    for(let i = 0; i < tally.length; i++) {
      if(!tally[i].source) return;
      if(tally[i].source === source && !tally[i][sourceratings]) {
        tally[i][sourceratings] = tally[i].ratings;
        delete tally[i].ratings;
        DataManager.setData(tally);
        console.log("Completed for " + tally[i].username);
      }
    }
  } else

  if (command === "setfield") {
    if (checkowner(message.author) === false) return;
    let tally = DataManager.getData();
    clearvar()
    let newfield = args[0].replace(/[.,#!$%\^&;:{}<>=-_`\"~()]/g,"");
    if (!newfield) return;
    let content = argument.slice(args[0].length + 1);

    if (!([newfield] in tally[0])) {
      senderrormessage (message.channel, "Field does not exist!")
    } else {
      if (content === "array") {
        for (i = 0; i < tally.length; i++) {
          tally[i][newfield] = [];
        }} else
      if (content === "object") {
        for (i = 0; i < tally.length; i++) {
          tally[i][newfield] = {};
        }
      } else {
          content = isNaN(parseFloat(content)) ? content : parseFloat(content);
          for (i = 0; i < tally.length; i++) {
            tally[i][newfield] = content ? content : "";
          };
        }
        if (tally == undefined) return;
        DataManager.setData(tally);
        sendgenericembed (message.channel, `Field **${newfield}** has been set to **${content}** for every user in db.`);
      };
  } else

  if (command === "removefield") {
    if (checkowner(message.author) === false) return;
    let tally = DataManager.getData();
    clearvar()
    let newfield = args[0].replace(/[.,#!$%\^&;:{}<>=-_`\"~()]/g,"");
    if (!newfield) return;

    if (tally[0][newfield] == undefined) {
      senderrormessage (message.channel, "Field does not exist!")
    } else {
      for (i = 0; i < tally.length; i++) {
        delete tally[i][newfield]};
      if (tally == undefined) return;
      DataManager.setData(tally);
      sendgenericembed (message.channel, `Field **${newfield}** has been deleted from each user in db.`);
    };
    
  } else

  if (command === "finger") {
    let tally = DataManager.getData();
    clearvar()
    let user = message.author;
    let newfinger = inputstring(argument);
    let dbuser = user ? getdbuserfromuser (user) : getdbuserfromusername (args[0]);
    if (!dbuser) return;
    let dbindex = getdbindexfromdbuser (dbuser)
    if (dbindex == -1) return;

    if (!newfinger) {
      embedoutput.content = "Your current finger message is:"
      embedoutput.title = user.tag;
      if (dbuser.finger) {
        embedoutput.description = "\`\`\`" + dbuser.finger + "\`\`\`";
        embedfooter (`!finger clear to remove your finger message.`)
      } else {
        embedoutput.description = "\`\`\` \`\`\`";
      };
      embedsender (message.channel, embedoutput)
    } else
    if (newfinger.length > 500) {
      senderrormessage (message.channel, `Finger must be within **500** characters.`);
    } else
    if (dbuser.finger == newfinger) {
      senderrormessage (message.channel, `Finger for **${user.tag}** was already as posted.`);
    } else {
      tally[dbindex].finger = newfinger === "clear" ? "" : newfinger;
      if (tally == undefined) return;
      DataManager.setData(tally);
      sendgenericembed (message.channel, `Finger for **${user.tag}** has been` + (newfinger === "clear" ? " cleared" : " updated."))
    };
  } else

  if (command === "addtrophy") {
    if (checkowner(message.author) === false) return;
    let tally = DataManager.getData();
    if (tally == undefined) return;
    let user = getuser (args[0])
    let newtrophy = argument.slice(args[0].length + 1, argument.length)
    if (user == null) return;
    let dbuser = getdbuserfromuser (user);
    if (!dbuser) return;
    let dbindex = getdbindexfromdbuser (dbuser)
    if (dbindex == -1) return;
    if (!dbuser.trophies) {
      tally[dbindex].trophies = [];
      tally[dbindex].trophies[0] = newtrophy;
      DataManager.setData(tally);
      sendgenericembed (message.channel, `Trophy **${newtrophy}** added for **${user.tag}**.`)
    } else
    if (dbuser.trophies.includes (newtrophy)) {
      senderrormessage (message.channel, `**${user.tag}** already had trophy **${newtrophy}**.`);
    } else {
      tally[dbindex].trophies.push(newtrophy);
      DataManager.setData(tally);
      sendgenericembed (message.channel, `Trophy **${newtrophy}** added for **${user.tag}**.`)
    };
  } else

  if (command === "updatetrophy") {
    if (checkowner(message.author) === false) return;
    let tally = DataManager.getData();
    let user = getuser (args[0]);
    // let oldtrophy = (args[1]);
    let trophyindex = args[1];
    let newtrophy = argument.slice(args[0].length + args[1].length + 2, argument.length)
    if (user == null) return;
    let dbuser = getdbuserfromuser (user);
    if (!dbuser) return;
    let dbindex = getdbindexfromdbuser (dbuser)
    if (dbindex == -1) return;
    if (parseInt(trophyindex) > dbuser.trophies.length - 1) return;
    // let trophyindex = tally[dbindex].trophies.indexof(oldtrophy);
    tally[dbindex].trophies[trophyindex] = newtrophy;
    DataManager.setData(tally);
    sendgenericembed (message.channel, `Trophy for **${user.tag}** ${newtrophy ? "updated to **" + newtrophy + "**." : "removed."}`)
  } else

  if (command === "backupdb") {
    degree = args[0] ? args[0] : "1";
    if ((degree !== "1") && (degree !== "2") && (degree !== "3")) {degree = "1"};
    let success = backupdb (degree);
    success ? sendgenericembed (message.channel, `Database backed up to **dbbackup${degree}** at ${getISOtime (Date.now())}.`) : senderrormessage (message.channel, `Failed to backup database. Please review js.`)
  } else

  if (command === "restoredb") {
    degree = args[0] ? args[0] : "1";
    if ((degree !== "1") && (degree !== "2") && (degree !== "3")) {degree = "1"};
    let success = backupdb (degree);
    success ? sendgenericembed (message.channel, `Database was restored from **dbbackup${degree}** at ${getISOtime (Date.now())}.`) : senderrormessage (message.channel, `Failed to backup database. Please review js.`)
  } else

  if (command === "backupstatus") {
    clearvar();
    embedoutput.title = "Backup Databases Last Updated:";
    embedfielder ("dbbackup1.json", config.backupdb[0], true)
    embedfielder ("dbbackup2.json", config.backupdb[1], true)
    embedfielder ("dbbackup3.json", config.backupdb[2], true)
    embedsender (message, embedoutput);
  } else 

  if (command === "deactivate") {
    let user = message.author;
    let member = getmemberfromuser (user);
    if (!checkrole (member, "dev")) return;
    let channel = getchannelfromname ("announcements");
    clearvar()
    embedauthor ("LAZYbot#9000", "https://i.imgur.com/pvh3yXm.png")
    embedoutput.description = `Daisy, Daisy, give me your answer, do. I'm half crazy all for the love of you...`;
    embedoutput.color = 14618131,
    embedsender (channel, embedoutput);
  } else

  if (command === "gild") {
    let user = getuser(args[0])
    let gildmessage = message;
    let channel = message.channel;
    let author = message.author;
    if(user) {
      let member = getmemberfromuser(user)
      console.log(member.lastMessageID);
      message.channel.fetchMessage(member.lastMessageID)
        .then ((targetmessage => {
          targetmessage.react(getemoji("gold"))
          message.delete()
          clearvar()
          embedoutput.content = user.toString();
          embedoutput.title = "Message Gilded";
          embedoutput.color = 14148167;
          embedoutput.description = `**${author.tag} has gilded the comment of **${author.tag}**!`
          embedsender (channel, embedoutput);
          message.delete()
        }))
        .catch (console.error);
    } else {
    message.channel.fetchMessage(args[0])
      .then ((targetmessage => {
        let targetuser = targetmessage.author
        let member = getmemberfromuser(targetuser)
        targetmessage.react(getemojifromname("gold"))
        clearvar()
        embedoutput.content = targetuser.toString();
        embedoutput.title = "Message Gilded";
        embedoutput.color = 14148167;
        embedoutput.description = `**${author.tag}** has gilded the comment of **${targetuser.tag}**!`
        embedsender (channel, embedoutput);
        message.delete()
      }))
      .catch (console.error);
    }
  } else

  if (command === "emoji") {
    if (checkowner(message.author) === false) return;
    let emojiname = args[0]
    console.log(emojiname)
    if (!emojiname) return;
    let emoji = getemojifromname(emojiname)
    console.log(emoji.id)
    if (!emoji) return;
    message.react(emoji.id);
  }

  let package = DataManager.getData("./package.json")

  cr (message, "marco", "polo!");
  cr (message, "ready", "I am ready!");
  cr (message, "owner", "theLAZYmd#2353");
  cr (message, "who", `I am LAZYbot#2309 **v${package.version}**`);
  cr (message, "help", "This is a pretty basic bot, there isn't much it can help you with.");
  cr (message, "party", ":tada:");
  er (message, command, args);

});

//non-prefix section

client.on("message", (message) => {

  if (message.author.bot) return;
  let args = message.content.split(/ +/g);
  let guildconfig = DataManager.getData(`./guildconfig.json`);

  if(args[0].startsWith(guildconfig.prefix) || args[0].startsWith(guildconfig.nadekoprefix)) return;

    // er section

  if (guildconfig.er) {
    for (let i = 0; i < guildconfig.er.length; i++) {
      if (message.content.startsWith("!uer") || message.content.startsWith("!der") || message.content.startsWith("!erca")) return;
      let trigger = guildconfig.er[i]
      let emoji = getemojifromname (trigger[1]);
      if (!emoji) return;
      if (trigger[2]) {
        for (let i = 0; i < args.length; i++) {
          if (args[i].toLowerCase().includes(trigger[0].toLowerCase())) {
            message.react(emoji.id);
            break;
          }
        }
      } else {
        for (let i = 0; i < args.length; i++) {
          if (args[i].toLowerCase() === (trigger[0].toLowerCase())) {
            message.react(emoji.id);
            break;
          }
        }
      }
    };
  };

  if (!message.content.includes("r/")) return;

  for(let i = 0;i < args.length; i++) {

    if (args[i].startsWith("/r/")) {
      clearvar()
      args[i] = args[i].replace(/[.,#!$%\^&;:{}<>=-_`~()]/g,"");
      embedoutput.description = `[${args[i]}](http://www.reddit.com${args[i]})`;
      embedsender (message.channel, embedoutput)
      } else

    if (args[i].startsWith("r/")) {
      clearvar()
      args[i] = args[i].replace(/[.,#!$%\^&;:{}=-_`~()]/g,"");
      embedoutput.description = `[/${args[i]}](http://www.reddit.com/${args[i]})`;
      embedsender (message.channel, embedoutput)
      }
    }
});

//trivia give commands

client.on('message', (message) => {
  
  var payoutoptions = [6,4,2,0];
  var claimoptions = [null,17,13,11,8,5,0];
      triviagame = {};
      args = [];
      name = [];
      payoutmsg = [];
      payoutaggregate = "";

  if (!message.author.bot) {
    if (!((message.content.startsWith ("Final Results")) || (message.content.startsWith ("Trivia Game Ended")))) return;
    args = message.content.split("\n");
    if (args[0] == undefined || args[1] == undefined || args[2] == undefined) return;
    triviagame.header = args[0];
    triviagame.title = args[1];
    args.splice(0, 2);
  } else {
    if (message.author.id !== bouncerbot.id) return;
    if (message.embeds.length == 0) return;
    if (message.embeds[0].author == undefined || message.embeds[0].title == undefined ||  message.embeds[0].description == undefined) return;
    triviagame.header = message.embeds[0].author.name;
    triviagame.title = message.embeds[0].title;
    triviagame.description = message.embeds[0].description;
    args = triviagame.description.split("\n");
    };

  // give messages output

  if (!triviagame.title) return;
  if (triviagame.title !== "Trivia Game Ended" && triviagame.title !== "Final Results") return;
  for (let i = 0; i < args.length; i++) {name[i] = args[i].split(/ +/g).shift().replace("*")};

  if (name[0] == "No" || name.length < 1) return;
  if (name.length > 6) {name.length = 6};
  name.ceiling = Math.ceil(0.5 + name.length/2);

  for (let i = 0; i < name.ceiling; i++) {
    let payout = (parseInt(name.length) + parseInt(payoutoptions[i]) - 5) + "";
    payoutmsg[i] = `.give ` + payout + ` **` + name[i] + `**`;
    }
  if (name.length === 6) {payoutmsg[0] = `.give 8 **` + name[0] + `**`}
  payoutmsg.push(`.give ${claimoptions[name.length]} **housebank#5970**`);

  for (let i = 0; i < name.ceiling + 1;i++) {
    payoutaggregate +=  payoutmsg[i] + (i < payoutmsg.length -1 ? `\n` : ``)}
  if (name.length < 2) {
    payoutaggregate = `.give 17 **housebank#5970**`
    };

  clearvar()
  embedoutput.title = `House Trivia ${name.length}-player Game`,
  embedoutput.description = payoutaggregate,
  embedfooter (`Please remember to check for ties.`)
  embedsender (message.channel, embedoutput);

  });

client.login(process.env.TOKEN ? process.env.TOKEN : config.token);

//this function is to be made irrelevant as soon as possible

function clearvar () {
  embedoutput = {};
};

// 'get' based functions

function checkowner (member) {
  let ownerboolean = false;
  for (i = 0; i < config.ownerID.length; i++) {
    if (member.id === config.ownerID[i]) {
      ownerboolean = true;
    };
  };
  return ownerboolean;
};

function checkrole (member, rolename) {
  let role = getrolefromname (rolename)
  return (member.roles.has(role.id));
};

function getchannelfromname (channelname) {
  if (!((typeof channelname) == "string")) return;
  let channel = guild.channels.find(channel => channelname.toLowerCase() == channel.name.toLowerCase())
  if (channel == null) {console.log("No channel found!")};
  return channel;
};

function getrolefromname (rolename) {
  if (!((typeof rolename) == "string")) return;
  let role = guild.roles.find(role => rolename.toLowerCase() == role.name.toLowerCase())
  if (role == null) {console.log("No role found!")};
  return role;
};

function getuser (searchstring, exactmode) {
  if (searchstring.length < 3) {
    return null
  } else {
    var user = getuserfromid (searchstring);
    if (user == null) {var user = getuserfromusername (searchstring, exactmode)};
    if (user == null) {var user = getuserfromtag (searchstring)};
    if (user == null) {var user = getuserfromnickname (searchstring, exactmode)};
    return user;
  }
};

function getuserfromid (snowflake) {
  if (snowflake.startsWith (`<@!`) && snowflake.endsWith (`>`)) {snowflake = snowflake.slice(3, snowflake.length -1)};
  if (snowflake.startsWith (`<@`) && snowflake.endsWith (`>`)) {snowflake = snowflake.slice(2, snowflake.length -1)};
  console.log(snowflake);
  let user = client.users.find(user => snowflake == user.id)
  console.log(user ? "ID Found!" : "No id found, checking username...");
  return user;
};

function getuserfromusername (string, exactmode) {
  let user = client.users.find(user => exactmode ? user.username.toLowerCase() == string.toLowerCase() : user.username.toLowerCase().startsWith(string.toLowerCase()));
  console.log(user ? "Username found!" : "No username found, checking tag...");
  return user;
};

function getuserfromtag (string) {
  let user = client.users.find(user => string.toLowerCase() == user.tag.toLowerCase())
  console.log(user ? "Tag found!" : "No tag found, checking nickname...");
  return user;
};

function getuserfromnickname (string, exactmode) {
  let member = guild.members.find(member => member.nickname && (exactmode ? member.nickname.toLowerCase() == string.toLowerCase() : member.nickname.toLowerCase().startsWith(string.toLowerCase())))
  console.log(member ? "Nickname found!" : "No nickname found.");
  if (member == null) {return member} else {return member.user};
};

function getmemberfromuser (user) {
  let member = guild.members.find(member => user.id == member.id)
  console.log(member ? "Member found!" : "No member found.");
  if (member == null) {return} else {return member};
};

function getemojifromname (name) {
  let emoji = client.emojis.find("name", name);
  return emoji;
};

function messagecount (message, user, update) {

  user ? user = user : user = message.author;
  let dbuser = getdbuserfromuser (user);
  if (dbuser == undefined) return;
  clearvar()
  embedoutput.description = update ? `Message count for **${user.tag}** is now **${dbuser.messages.toLocaleString()}** messages.` : `**${user.tag}** has sent **${dbuser.messages.toLocaleString()}** messages.`;
  embedsender (message.channel, embedoutput);
  embedoutput = {};
  
};

function getdbuserfromuser (user) {

  let tally = DataManager.getData();
  let dbuser = tally.find(dbuser => dbuser.id == user.id);
  if (dbuser == null) {
    console.log("No dbuser found, creating one...");
    let newuser = dbtemplate;
    newuser.id = user.id;
    newuser.username = user.username;
    tally.push (newuser);
    DataManager.setData(tally);
    console.log("User " + newuser.username + " has been logged in the database!");
  };
  dbuser = tally.find(dbuser => user.id == dbuser.id);
  return dbuser;

};

function getdbuserfromusername (username) {

  let tally = DataManager.getData();
  let dbuser = tally.find(dbuser => username == dbuser.username);
  return dbuser;

};

function getdbindexfromdbuser (dbuser) {

  let tally = DataManager.getData();
  return tally.findIndex(index => dbuser.id == index.id)

};

function returnmessagefromid (channel, id) {

  clearvar();
  channel.fetchMessage(id)
    .then (message => {
      let timestamp = getISOtime (message.createdAt);
      if (message.embeds.length !== 0) {
        embedoutput.content = `On ${timestamp}, user **${message.author.tag}** said:`;
        embedoutput.description = message.embeds[0].description
        // embedoutput = embedreceiver (message.embeds[0])
      } else {
        if (message.content) {
          fetchedmessage = (message.createdTimestamp ? `\nAt ${getISOtime (message.createdTimestamp)}, **${message.author.tag}** said` : "") + ("\`\`\`" + message.content + "\`\`\`");
          embedoutput.title = "Fetched Message";
          embedoutput.description = fetchedmessage;
        };
      }
      embedsender (channel, embedoutput);
    })
    .catch (console.error);

};

function getmemberroles (member) {
  var rolelist = member.roles.map(role => role.name)
  return rolelist;  
};

function getprofile (user) {
  clearvar();
  let tally = DataManager.getData();
  let dbuser = getdbuserfromuser (user);
  let member = getmemberfromuser (user);
  let rolelist = getmemberroles (member);
  let dbindex = getdbindexfromdbuser (dbuser);
  rolelist.splice(0, 1);
  var roles = "";
  var trophies = "";
  var lichessratingData = "";
  var chesscomratingData = "";
  var region = "None set.";
  var lastmessage;
  for (let i = 0; i < rolelist.length; i++) {
    roles +=  rolelist[i] + (i < rolelist.length -1 ? `\n` : ``)
  };
  for (let i = 0; i < tally[dbindex].trophies.length; i++) {
    trophies +=  ":trophy: **" + tally[dbindex].trophies[i] + "**" + (i < tally[dbindex].trophies.length -1 ? `\n` : ``)
  };
  for (let i = 0; i < guildconfig.regions.length; i++) {
    let role = getrolefromname (guildconfig.regions[i]);
    if (checkrole (member, role.name)) {
      region = guildconfig.regions[i];
    };
  };
  if (dbuser.lastmessage) {lastmessage = (dbuser.lastmessagedate ? `\nSent at ${getISOtime (dbuser.lastmessagedate)}.` : "") + (dbuser.lastmessage.startsWith("<:") && dbuser.lastmessage.endsWith (">") ? "\n" + dbuser.lastmessage : "\`\`\`" + dbuser.lastmessage + "\`\`\`")}
  if (dbuser.lichessratings) {
    for (let i = 0; i < config.lichessvariants.length; i++) {
	  let array = config.lichessvariants[i];
	  let variant = array[0];
	  let rating = dbuser.lichessratings[array[1]];
      lichessratingData += rating ? `${variant}: **`+ rating + "**" + (i < config.lichessvariants.length -1 ? "\n" : "") : "";
    }
  };
  if (dbuser.chesscomratings) {
    for (let i = 0; i < config.chesscomvariants.length; i++) {
	  let array = config.chesscomvariants[i];
	  let variant = array[0];
	  let rating = dbuser.chesscomratings[array[1]];
      chesscomratingData += rating ? `${variant}: **`+ rating + "**" + (i < config.chesscomvariants.length -1 ? "\n" : "") : "";
    }
  };
  let lichessprofile = `[${dbuser.lichess}](${(config.lichessProfileURL.replace("|", dbuser.lichess))})\n${lichessratingData}`;
  let chesscomprofile = `[${dbuser.chesscom}](${(config.chesscomProfileURL.replace("|", dbuser.chesscom))})\n${chesscomratingData}`;
  embedauthor (`Profile for ${user.tag}`, user.bot ? "https://i.imgur.com/9kS9kxb.png" : "")
  if (dbuser.finger) {
    embedoutput.description = "```" + dbuser.finger + "```";
  };
  embedoutput.color = getrandomdecimalcolor();
  embedthumbnail (user.avatarURL)
  embedfielder ("User ID", user.id, member.nickname ? true : false)
  if (member.nickname) {embedfielder ("a.k.a.", member.nickname, true)}
  embedfielder (`Joined Discord`, getISOtime (user.createdTimestamp).slice(4, 21), true) 
  embedfielder (`Joined ${guild.name}`, getISOtime (member.joinedTimestamp).slice(4, 21), true)
  if (dbuser.messages) {embedfielder ("Messages Sent", dbuser.messages.toLocaleString(), true)}
  embedfielder ("Region", region, true)
  if (dbuser.lichess) {embedfielder (`${getemojifromname("lichess")} Lichess`, lichessprofile, true)}
  if (dbuser.chesscom) {embedfielder (`${getemojifromname("chesscom")} chess.com`, chesscomprofile, true)}
  if (dbuser.lastmessage) {embedfielder ("Last Message", lastmessage, false)}
  // embedfielder ("Roles", roles ? roles : "None", true)
  if (dbindex.trophies) {embedfielder ("House Trophies", trophies, true)}
  embedfooter ("Use !finger to change your finger message.")
  return embedoutput;
  // + \n\u200B
};

// embed section of functions

function embedsender (channel, embedoutput) {
  
  if (!embedoutput) throw "Failed to define embedoutput."
  channel = channel.channel ? channel.channel : channel;
  embedoutput.color = embedoutput.color ? embedoutput.color : guildconfig.color;
  channel.send(embedoutput.content, {embed: embedoutput})
  return;
  clearvar()
  .catch ((e) => console.log(JSON.stringify(e)));

};

function embedfielder (name, value, inline) {

  if (!embedoutput.fields) {embedoutput.fields = []}
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

function cr (message, trigger, reply) {

  const args = message.content.slice(guildconfig.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  if (command === trigger) {message.channel.send(reply)};

};

// emoji reactions service
function er (message, command, args) {

  let member = getmemberfromuser (message.author);
  if (checkowner(message.author) === false) return;
  if (!checkrole (member, "mods")) return;

  if (command === "aer") {
    let erca = args[2] ? true : false;
    let emoji = getemojifromname(args[1]);
    if (!emoji) {
      senderrormessage (message.channel, "No emoji found!")
    } else {
      guildconfig.er[0] ? guildconfig.er.push([args[0], args[1], erca]) : guildconfig.er[0] = [args[0], args[1], erca];
      DataManager.setData(guildconfig, `./guildconfig.json`);
      guildconfig = DataManager.getData(`./guildconfig.json`);
      let emoji = getemojifromname (args[1]);
      if (!emoji) return;
      message.react(emoji.id);
    }
  } else

  if (command === "uer") {
    let index = guildconfig.er.findIndex(trigger => trigger[0] === args[0]);
    let erca = args[2] ? true : false;
    guildconfig.er[index] = ([args[0], args[1], erca]);
    DataManager.setData(guildconfig, `./guildconfig.json`);
  } else
  
  if (command === "erca") {
    let index = guildconfig.er.findIndex(trigger => trigger[0] === args[0]);
    let newerca = !guildconfig.er[index][2]
    guildconfig.er[index] = ([guildconfig.er[index][0], guildconfig.er[index][1], newerca]);
    DataManager.setData(guildconfig, `./guildconfig.json`);
  } else

  if (command === "der") {
    let index = guildconfig.er.findIndex(trigger => trigger[0] === args[0]);
    delete guildconfig.er[index];
    DataManager.setData(guildconfig, `./guildconfig.json`);
  };

};

function checkuseronline (checkuser) {
  checkuser = checkuser;
  checkuser.presence.status == "offline" ? offlineboolean = true : offlineboolean = false;
}; 

function checkbounceronine () {
  checkuseronline (bouncerbot);
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

function getISOtime (ms) {
  return gettime (ms).toString().slice(0, 31); 
};

function getrandomrange (min, max) {
  return Math.floor(Math.random() * (max - min) + min);
};

function getrandomdecimalcolor() {
  let color = getrandomrange (1, 16777215);
  return color;
};

function getrandomhexcolor() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  };
  return color;
};

function inputstring(string) {
  let newstring = (string.startsWith (`\"`) && string.endsWith (`\"`)) ? string.slice(1, string.length -1) : string;
  return newstring;
};

function sendtime(message, time) {
  clearvar()
  embedoutput.description = `**${time.days}** days, **${time.hours}** hours, **${time.minutes}** minutes, and **${time.seconds}** seconds since last reboot.`
  embedsender (message.channel, embedoutput);
};

function senderrormessage(channel, description) {
  clearvar()
  embedoutput.description = description;
  embedoutput.color = 15406156;
  embedsender (channel, embedoutput);
};

function sendgenericembed (channel, description) {
  clearvar()
  embedoutput.description = description;
  channel = channel.channel ? channel.channel : channel;
  embedsender (channel, embedoutput);
};

function enabletestingmode (message) {
  let user = getuser ("LAZYbot", true);
  let channel = getchannelfromname ("devs");
  channel.overwritePermissions(bouncerbot, { 'SEND_MESSAGES': false })
  channel.overwritePermissions(user, { 'SEND_MESSAGES': false })
  channel = getchannelfromname ("spam");
  channel.overwritePermissions(bouncerbot, { 'SEND_MESSAGES': false })
  channel.overwritePermissions(user, {
     'SEND_MESSAGES': false,
    })
  guildconfig.testingmodeboolean = true;
  DataManager.setData(guildconfig, "./guildconfig.json");
};

function disabletestingmode (message) {
  let user = getuser ("LAZYbot", true);
  let channel = getchannelfromname ("devs");
  channel.overwritePermissions(bouncerbot, { 'SEND_MESSAGES': true })
  channel.overwritePermissions(user, { 'SEND_MESSAGES': true })
  channel = getchannelfromname ("spam");
  channel.overwritePermissions(bouncerbot, { 'SEND_MESSAGES': true })
  channel.overwritePermissions(user, {
    'SEND_MESSAGES': true,
  })
  sendgenericembed (message.channel, `**Testing mode disabled.**`)
  guildconfig.testingmodeboolean = false;
  DataManager.setData(guildconfig, "./guildconfig.json");
};

function backupdb (degree, interval) {
  let tally = DataManager.getData();
  if (tally == undefined) return;
  let time = gettime (interval)
  degree = degree ? degree : "1";
  if ((degree !== "1") && (degree !== "2") && (degree !== "3")) {degree = "1"};
  if (interval) {
    setInterval(() => {
      DataManager.setData(tally);
      console.log(`Database backed up to dbbackup${degree} at ${gettime (Date.now())}.`);
      config.backupdb[degree - 1] = getISOtime (Date.now())
      DataManager.setData(config, "./config.json");
    }, interval);
  } else if (!interval) {
      DataManager.setData(tally);
      console.log(`Database backed up to dbbackup${degree} at ${getISOtime (Date.now())}.`);
      config.backupdb[degree - 1] = getISOtime (Date.now())
      DataManager.setData(config, "./config.json");
  }
  return true;
};

function restoredb (degree) {
  degree = degree ? degree : "1";
  let backup = DataManager.getData("./dbbackup1.json")
  DataManager.setData(backup);
  return true;
};

client.on("message", (message) => {
  
  if (!message.content.startsWith(guildconfig.prefix) || message.author.bot) return;

  const args = message.content.slice(guildconfig.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  let splitmessage = message.content.match(messageSplitRegExp);

  console.log(`Command: ${message}`);

  //HELP
  if(splitmessage[0].toLowerCase() === "!dbhelp") {
    if(splitmessage.length === 1) {
      message.channel.send({"embed": getHelpEmbed()})
      .catch((e) => console.log(JSON.stringify(e)));
    }
    return;
  }

  //REMOVE
  if(splitmessage[0].toLowerCase() === "!remove") {
    if(splitmessage.length === 2) {
		let source = splitmessage[1].toLowerCase();
      	tracker.remove(message.guild.id, source, message.member.id, message);
    } else if(splitmessage.length === 3) {
		let source = splitmessage[1].toLowerCase();
		let user = getuser (splitmessage[2])
		if (!user) return;
		if(source === "chesscom" || source === "lichess") {
			tracker.removeByUser(message.guild.id, source, user, message);
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
  if(splitmessage[0].toLowerCase() === "!update") {
    if(splitmessage.length === 1) {
      tracker.queueForceUpdate(message.member.id);
      message.channel.send("Queued for update.")
      .catch((e) => console.log(JSON.stringify(e)));
    }
    return;
  }

  //ADD LICHESS
  if(splitmessage[0].toLowerCase() === "!lichess") {
    if(splitmessage.length === 2 || splitmessage.length === 1) {
      //Adding sender to tracking
      tracker.track(message.guild.id, message.member.id, "lichess", splitmessage[1] ? splitmessage[1] : message.author.username, message)
    } else if(splitmessage.length === 3) {
      if(canManageRoles(message.member)) {
        let user = getuser (splitmessage[1])
        if (user) {
          let member = getmemberfromuser (user);
          tracker.track(message.guild.id, member.id, "lichess", splitmessage[2], message);
        } else {
          message.channel.send("Invalid user given.")
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
  if(splitmessage[0].toLowerCase().replace(".","") === "!chesscom") {
    if(splitmessage.length === 2 || splitmessage.length === 1) {
      //Adding sender to tracking
      tracker.track(message.guild.id, message.member.id, "chesscom", splitmessage[1] ? splitmessage[1] : message.author.username, message);
    } else if(splitmessage.length === 3) {
      if(canManageRoles(message.member)) {
        let user = getuser (splitmessage[1])
        let member = getmemberfromuser (user);
        if(member) {
          tracker.track(message.guild.id, member.id, "chesscom", splitmessage[2], message);
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
/*  if(splitmessage[0].toLowerCase() === "!list") {
    if(splitmessage.length === 1) {
      let leaderboard = new LeaderboardConstructor({});
      let list = leaderboard.getList(getNick);
      list.embed.color = config.ratingcolor;
      message.channel.send(list).catch((e) => console.log(JSON.stringify(e)));
    } else if(splitmessage.length === 2) {
      //Page or type
      let val = splitmessage[1].toLowerCase();
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
          list.embed.color = config.ratingcolor;
          message.channel.send(list).catch((e) => console.log(JSON.stringify(e)));
        }
      } else {
        let leaderboard = new LeaderboardConstructor({
          "type": capitalise(val)
        });
        let list = leaderboard.getList(getNick);
        list.embed.color = config.ratingcolor;
        message.channel.send(list).catch((e) => console.log(JSON.stringify(e)));
      }
    } else if(splitmessage.length === 3) {
      //Page and type
      let type = splitmessage[1].toLowerCase();
      let page = parseInt(splitmessage[2]);
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
      list.embed.color = config.ratingcolor;
      message.channel.send(list).catch((e) => console.log(JSON.stringify(e)));
    }
    return;
  }

  //RANK
  if(splitmessage[0].toLowerCase() === "!myrank") {
    if(splitmessage.length === 1) {
      let leaderboard = new LeaderboardConstructor({});
      let rank = leaderboard.getRank(getNick, message.member.id);
      if(rank.embed) {
        rank.embed.color = config.ratingcolor;
      }
      message.channel.send(rank).catch((e) => console.log(JSON.stringify(e)));
    }
    return;
  } */

});

function onModError(serverID, error) {
  let channel = getModChannel(client.guilds.get(serverID));
  channel.send(error).catch((e) => console.log(JSON.stringify(e)));
}

function onTrackError(serverID, error, message) {
  let channel = message.channel
  console.log(error);
  senderrormessage(channel, error);
}

function canManageRoles(member) {
  return member.permissions.has(Discord.Permissions.FLAGS.MANAGE_ROLES);
}

function capitalise(str) {
  return str[0].toUpperCase() + str.slice(1).toLowerCase();
}

function onRemoveSuccess(serverID, userID, source, username, message) {
  let channel = message.channel;
  let user = getuser (userID);
  let member = getmemberfromuser (user);
  clearvar()
  embedoutput.title = `Stopped tracking via !remove command`;
  embedoutput.description = `Unlinked **${user.tag}** from ${source} account **${username}**.`;
  embedoutput.color = config.ratingcolor;
  embedsender (channel, embedoutput);
  removeRatingRole(serverID, userID);
}

function removeRatingRole(serverID, userID) {
  let guild = client.guilds.get(serverID);
  let member = guild.members.get(userID);
  let roles = getMemberRatingRoles(member);
  for(let i = 0; i < roles.length; i++) {
    member.removeRole(roles[i]).catch((e) => console.log(JSON.stringify(e)));
  }
  let unrankedRole = guild.roles.find("name", guildconfig.unrankedRoleName);
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

function onTrackSuccess(serverID, userID, ratingData, source, sourceusername, message) {
  let newRole = getrolefromname ("EikaBotTester");
  // let newRole = findRoleForRating(guild, ratingData.maxRating);
  let channel = message.channel
  if(!newRole) {
    console.log("Could not find a valid role for rating " + ratingData.maxRating)
    .catch((e) => console.log(JSON.stringify(e)));
    return;
  }

  let user = getuser(userID);
  let member = getmemberfromuser(user);
  let tally = DataManager.getData();
  let dbuser = getdbuserfromuser(user);

  //If user has an unranked role, remove it
  let unranked = member.roles.find("name", guildconfig.unrankedRoleName);
  if(unranked) {
    member.removeRole(unranked).catch((e) => console.log(JSON.stringify(e)));
  }
  //Add a rating role
  member.addRole(newRole).then(() => {
	clearvar()
	var sourceratingData = "";
	let tally = DataManager.getData();
	let sourceProfileURL = source.toLowerCase().replace(".","") + "ProfileURL";
	let sourcevariants = source.toLowerCase().replace(".","") + "variants";
	let sourceratings = source.replace(".","") + "ratings";
	for (let i = 0; i < config[sourcevariants].length; i++) {
		let array = config[sourcevariants][i];
		let variant = array[0];
		let rating = dbuser[sourceratings][array[1]];
		sourceratingData += rating ? `${variant}: **`+ rating + "**" + (i < config[sourcevariants].length -1 ? "\n" : "") : "";
	};
    embedoutput.title = `${getemojifromname(source.toLowerCase().replace(".",""))} Linked ${member.user.username} to '${sourceusername}'`
	embedoutput.description = `[${sourceusername}](${config[sourceProfileURL].replace("|", sourceusername)})\nAdded to the role **${newRole.name}**. You have a rating of **${ratingData.maxRating}**\n` + sourceratingData;
    embedoutput.color = config.ratingcolor;
    embedsender (channel, embedoutput);
  }).catch(function(error) {
    console.log("Error adding new role", error);
  });
}

function onRatingUpdate(serverID, userID, oldData, ratingData, source, username, message) {
  let channel = message.channel
  let user = getuser(userID);
  let member = getmemberfromuser(user);
  let dbuser = getdbuserfromuser(user)
  if(source === "chesscom") {
    source = "Chess.com";
  }
  if(!member) {
    console.log(username + " (" + source + ") not found on the server. Removing from tracking");
    tracker.remove(guild.id, source, userID, message);
    return;
  }
  let newRole = getrolefromname ("EikaBotTester");
  //let newRole = findRoleForRating(guild, ratingData.maxRating);
  if (!newRole) {
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
		let sourceProfileURL = source.toLowerCase().replace(".","") + "ProfileURL";
		let sourcevariants = source.toLowerCase().replace(".","") + "variants";
		let sourceratings = source.replace(".","") + "ratings";
		for (let i = 0; i < config[sourcevariants].length; i++) {
			let array = config[sourcevariants][i];
			let variant = array[0];
			let rating = dbuser[sourceratings][array[1]];
			sourceratingData += rating ? `${variant}: **`+ rating + "**" + (i < config[sourcevariants].length -1 ? "\n" : "") : "";
		};
		clearvar ()
		embedoutput.title = "Updated " + member.nickname + " as '" + username + "' on " + source;
		embedoutput.description = "New rating group **" + newRole.name + "** with a rating of **" + ratingData.maxRating + "**\n" + sourceratingData;     
		embedsender (embedoutput).catch((e) => console.log(JSON.stringify(e)));
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
  let channel = guild.channels.find("name", guildconfig.modChannelName);
  if(!channel) {
    console.log("No mod channel found on server: " + guild.name);
  }
  return channel;
}

function getBotChannel(guild) {
  let channel = getchannelfromname ("spam");
  if(!channel) {
    console.log("No bot channel found on server: " + guild.name);
  }
  return channel;
}

function getHelpEmbed() {
  return {
    "color": config.ratingcolor,
    "fields": [{
      "name": "!lichess [Lichess Username]",
      "value": "Links you to a specific username on Lichess."
    },{
      "name": "!chesscom [Chess.com Username]",
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
      "name": "!lichess [Lichess username] [@Discord User Mention]",
      "value": "Links discord user to a specific username on Lichess."
    },{
      "name": "!chesscom [Chess.com username] [@Discord User Mention]",
      "value": "Links discord user to a specific username on Chess.com."
    },{
      "name": "!Remove [chesscom | lichess] [Chess.com or Lichess Username]",
      "value": "Removes a username on respective platform from the rating tracker."
    }]
  };
}