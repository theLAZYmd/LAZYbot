const Discord = require("discord.js");
const client = new Discord.Client();

require("./guildconfig.json");
require ("./config.json");
require ("./package.json");

const DataManagerConstructor = require("./datamanager.js");
const DataManager = new DataManagerConstructor("./db.json");
//const LeaderboardConstructor = require("./leaderboard.js");
const TrackerConstructor = require("./tracker.js");
const tracker = new TrackerConstructor({
	"onTrackSuccess": onTrackSuccess, 
	"onRemoveSuccess": onRemoveSuccess, 
	"onRatingUpdate": onRatingUpdate, 
	"onError": onTrackError, 
	"onModError": onModError
});

var guild;
var bouncerbot;
var nadekobot;
var harmonbot;
var owner;
var reboot;
var RATINGS;
var bcpboolean;
let config = DataManager.getData("./config.json");
let guildconfig = DataManager.getData(`./guildconfig.json`);
package = DataManager.getData("./package.json")
const dbtemplate = config.template;
const messageSplitRegExp = /[^\s]+/gi;

  var i;
      embedoutput = {};

//console startup section

client.on("ready", () => {

  reboot = Date.now();  
  guild = client.guilds.get(guildconfig.guild);
  console.log(`Loaded client server ${guild.name} in ${Date.now() - reboot}ms`);
  bouncerbot = guild.members.get(guildconfig.ids.bouncer);
  console.log(`Noticed bot user ${bouncerbot.user.tag} in ${Date.now() - reboot}ms`);
  nadekobot = guild.members.get(guildconfig.ids.nadeko);
  console.log(`Noticed bot user ${nadekobot.user.tag} in ${Date.now() - reboot}ms`);
  harmonbot = guild.members.get(guildconfig.ids.harmon);
  console.log(`Noticed bot user ${harmonbot.user.tag} in ${Date.now() - reboot}ms`);
  for(let i = 0; i < config.ownerID.length; i++) {
    let checkowner = guild.members.get(config.ownerID[i])
    if(checkowner) {
      owner = checkowner;
      console.log(`Noticed bot owner ${owner.user.tag} in ${Date.now() - reboot}ms`);
    }
  };
  bcpboolean = false;
  RATINGS = guildconfig.ratings;
  console.log("bleep bloop! It's showtime.");
});

const http = require('http');
const express = require('express');
const app = express();
app.get("/", (request, response) => { //pinging glitch.com
  console.log(Date.now() + " Ping Received");
  response.sendStatus(200);
});
app.listen(process.env.PORT);
setInterval(() => {
  http.get(`http://${process.env.lazybot}.glitch.me/`); //pinging glitch.com
}, 280000);
backupdb ("1", 3600000); //backupdb
backupdb ("2", 7200000);
backupdb ("3", 14400000);

client.on("guildMemberRemove", (member) => { //leave message

  clearvar();
  let channel = getchannelfromname(guildconfig.channels.leave);
  let dbuser = getdbuserfromuser(member.user);
  embedoutput.description = `**${member.user.tag}** has left **${guild.name}**. Had **${dbuser.messages ? dbuser.messages.toLocaleString() : 0}** messages.`;
  embedoutput.color = 15406156;
  if(dbuser.lastmessage) {
    embedoutput.fields = [];
    addfield("Last Message", "```" + dbuser.lastmessage + "```")
  };
  embedsender (channel, embedoutput);

});

client.login(process.env.TOKEN ? process.env.TOKEN : config.token); //token

client.on("message", (message) => { //command handler
  if(message.author.id === client.user.id) return;
  if(executeshadowban(message) === true) return;
  tracker.messagelogger(message);
  if(message.content.startsWith(guildconfig.prefixes.nadeko) && !message.author.bot) {
    let args = message.content.slice(guildconfig.prefixes.nadeko.length).match(messageSplitRegExp);
    let command = args.shift().toLowerCase();
    let argument = message.content.slice(command.length + guildconfig.prefixes.nadeko.length).trim();
    nadekoprefixfunctions(message, args, command, argument);
  } else
  if(message.content.startsWith(guildconfig.prefixes.prefix) && !message.author.bot) {
    let args = message.content.slice(guildconfig.prefixes.prefix.length).match(messageSplitRegExp);
    let command = args.shift().toLowerCase();
    let argument = message.content.slice(command.length + guildconfig.prefixes.nadeko.length).trim();
    prefixfunctions(message, args, command, argument);
  } else
  if(!message.content.startsWith(guildconfig.prefixes.prefix) && !message.content.startsWith(guildconfig.prefixes.nadeko)) {
    if(message.author.bot) {
      botfunctions(message);
    } else
    if(!message.author.bot) {
      nonprefixfunctions(message);
    }
  } return;
});

client.on("messageUpdate", (oldMessage, newMessage) => {
  if(oldMessage.author.bot) return;
  clearvar();
  embedoutput.title = `:pencil: Message updated in #${oldMessage.channel.name}`;
  embedoutput.description = oldMessage.author.tag;
  embedoutput.fields = [];
  addfield(`Old message`, oldMessage.content, false);
  addfield(`New message`, newMessage.content, false);
  addfield(`User ID`, newMessage.author.id, false);
  embedoutput.footer = embedfooter(getISOtime(Date.now()));
  embedsender(getchannelfromname("comment-log"), embedoutput);
});

client.on("messageDelete", (message) => {
  if(message.author.bot) return;
  if(message.content.startsWith(guildconfig.prefixes.prefix) || message.content.startsWith(guildconfig.prefixes.nadeko)) return;
  clearvar();
  embedoutput.title = `:wastebasket: Message deleted in #${message.channel.name}`;
  embedoutput.description = message.author.tag;
  embedoutput.fields = [];
  addfield(`Content`, message.content, false);
  addfield(`User ID`, message.author.id, false);
  embedoutput.footer = embedfooter(getISOtime(Date.now()));
  embedsender(getchannelfromname("comment-log"), embedoutput);
});

function nadekoprefixfunctions(message, args, command, argument) {

  if(command === "..") {
    let guidename = args[0];
    embeds = DataManager.getData("./embeds.json");
    console.log(guidename);
    object = embeds.utility[guidename];
    if(!object) {object = embeds.guides[guidename]};
    if(!object) return;
    message.channel.send({embed: object})
  } else

  if(command === "ticket") {
    tickethandler(message, args, command, argument)
  } else

  if(command === "tickets") {
    embedoutput = tickets();
    embedsender(message.channel, embedoutput);
    message.delete(1000);
  } else

  if(command === "bidamount") {
    bidamount(message, args, command, argument);
  } else

  if(command === "give") {
    if((isNaN(args[0]) && args[0] !== "all") || !args[1]) return;
    let user = getuser(args[1]);
    if(!user) return;
    if(checkowner(user) === true && args[2] && args[2].toLowerCase() === "database") {
      databasepositionhandler(message, args, command, argument);
    };
    if((checkowner(user) === true || checkrole(getmemberfromuser(message.author), "mods") || message.author.id === getuser("housebank").id) && message.channel.id === getchannelfromname("transaction-log").id || message.channel.id === getchannelfromname("spam").id) {
      ticketgivehandler(message, args, command, argument, user);
    }
  } else

  if(command === "iam") {
    for(let i = 0; i < config.sources.length; i++) {
      if(args.length > 0) {
        if(args[0].replace(".","").toLowerCase() === config.sources[i][1]) {
          command = args[0].replace(".","").toLowerCase();
          args.splice(0, 1);
          argument = argument.slice(command.length).trim();
          chessAPI(message, args, command, argument)
        }
      }
    }
  } else

  if(command === "iamn" || command === "iamnot") {
    if(args.length > 0) {
      command = "remove";
      removesource(message, args, command, argument)
    };
  } else

  if(command === "notify") {

    let link = args[0]
    let ETA = argument.slice(args[0].length + 1, argument.length);
    console.log("ETA is " + ETA);
 
    for(let i = 0; i < guildconfig.acceptedlinkdomains.length; i++) {
      if(link.startsWith(guildconfig.acceptedlinkdomains[i])) {
        clearvar()
        embedoutput.content = "@here";
        embedoutput.title = "Tournament Starting!";
        embedoutput.description = `Greeetings ${message.channel}. You have been invited to join a tournament by **${message.author.tag}**.${ETA ? ` Tournament starts in ${ETA}!` : " Join now!"}\n${link}`;
        embedsender (message.channel, embedoutput);      
        console.log(`${message.author.username} has sent out a ping for ${link}.`);
      };
    };
  } else

  if(command === "nadekoprefix") { // change nadekoprefix
    if(checkowner(message.author) === false) return;
    let [newNadekoPrefix] = args;  
    guildconfig.prefixes.nadeko = newNadekoPrefix
    DataManager.setData(guildconfig, "./guildconfig.json");
    message.channel.send(`Nadeko-Integration Prefix has been updated to **${newNadekoPrefix}** !`);
    console.log(`${message.author.username} [${message.author.id}] has updated NadekoPrefix to ${newNadekoPrefix}`);
  } else

  if(command === "mf") { // formulae
    let [games,time,increment] = args;
    clearvar()
    embedoutput.title = "House Match Reward";
    embedoutput.description = Math.floor(7/12 * Number(games) * (Number(time) + 2/3 * Number(increment))) + " :cherry_blossom:";
    embedsender(message.channel, embedoutput);
  } else

  if(command === "tf") {
    let [games,time,increment] = args;
    clearvar()
    embedoutput.title = "House Tournament Reward";
    embedoutput.description = Math.floor(1/10 * Number(games) * (Number(time) + 2/3 * Number(increment))) + " :cherry_blossom:";
    embedsender(message.channel, embedoutput);
  } else

  if(command === "decimaltous") { // Conversion functions
    let decimalodds = Number(args[0]);
    if(decimalodds == NaN) return;
    clearvar();
    embedoutput.title = "Decimal to US Odds";
    embedoutput.color = 431075;
    if(decimalodds < 1) {embedoutput.description = "Error: Decimal odds must be greater than or equal to 1."};
    if(1 <= decimalodds < 2) {embedoutput.description = (-100/(decimalodds-1)).toFixed(0).toString()};
    if(2 < decimalodds) {embedoutput.description = "+" + (100*(decimalodds-1)).toFixed(0).toString()};
    embedsender (message.channel, embedoutput);
  } else

  if(command === "ustodecimal") {
    let usodds = Number(args[0]);
    if(usodds == NaN) return;
    clearvar();
    embedoutput.title = "US to Decimal Odds";
    embedoutput.color = 16738560;
    if(usodds < 0) {embedoutput.description = (1 - 100/usodds).toFixed(1)};
    if(usodds > 0) {embedoutput.description = (1 + usodds/100).toFixed(1)};
    embedsender (message.channel, embedoutput);
  } else
  
  if(command === "fetch") {
    returnmessagefromid(message, args, command, argument);
  } else

  if(command === "fb") { //fakebanning
    if(args[0] == null || !checkowner(message.author)) return;
    clearvar ();
    let user = getuser(args[0], true);
    let member = getmemberfromuser(user);
    embedoutput.title = "⛔️ User Banned";
    embedoutput.fields = [];
    addfield("Username", user.tag, true);
    addfield("ID", user.id, true);
    embedsender(message.channel, embedoutput);
    let role = getrolefromname(guildconfig.roles.muted)
    let boolean1 = checkrole (member, role.name)
    if(boolean1 == true) return;
    member.addRole(role);
  } else

  if((command === "botcontingencyplan" || command === "bcp")) {
    if(!checkrole (message.member, "mods")) return;
    let role = getrolefromname(guildconfig.roles.bot);
    nadekobot.removeRole(role);
    if(!checkrole (nadekobot, role.name) || args[0] == "enable") {
      nadekobot.addRole(role);
      sendgenericembed (message.channel, `**Bot Contingency Plan enabled.**`)
      bcpboolean = true;
    } else
    if(checkrole (nadekobot, role.name) || args[0] == "disable") {
      nadekobot.removeRole(role);
      sendgenericembed (message.channel, `**Bot Contingency Plan disabled.**`)
      bcpboolean = false;
    };
  } else

  if((command === "testingmode") || (command === "tm")) {
    
    let author = message.author;
    let member = getmemberfromuser(author);
    if(!checkrole (member, "dev")) return;
    if(!guildconfig.testingmodeboolean && client.user.id === config.betabotID) {
      enabletestingmode (message, args[0], args[1])
      sendgenericembed (message.channel, `**Testing mode enabled.**`)
    } else
    if(guildconfig.testingmodeboolean) {
      disabletestingmode (message, args[0], args[1])
    };
  } else

  if(command === "timely") {
    if(!config.testingmodeboolean) return;
    senderrormessage(message.channel, "Testing mode is enabled, `.timely` cannot be used in this channel.")
  };

};

function prefixfunctions(message, args, command, argument) {

  var chessAPIcommands = ["help", "remove", "update", "lichess", "list", "chesscom", "myrank"]

  if(command === "usernametotag") {
    if(checkowner(message.author) === false) return;
    tally = DataManager.getData()
    count = 0;
    clearvar();
    embedoutput.title = "Updated 'username' field to tag for"
    embedoutput.description = "";
    for(let i = 0; i < tally.length; i++) {
      user = getuser(tally[i].id);
      if(user) {
        if(tally[i].username !== user.tag) {
          tally[i].username = user.tag
          embedoutput.description += "`" + user.tag + "`\n";
          count++;
        }
      }
    };
    embedoutput.footer = embedfooter(count + " usernames modified.");
    DataManager.setData(tally);
    embedsender(message.channel, embedoutput);
  } else

  if(command === "removeduplicates") {
    if(checkowner(message.author) === false) return;
    tally = DataManager.getData()
    tally2 = []
    tally2[0] = tally[0];
    count = 0;
    clearvar();
    embedoutput.title = "Found duplicates..."
    embedoutput.description = "";
    for(let i = 1; i < tally.length; i++) {
      let dbuser = tally2.find(tally2user => tally2user.id == tally[i].id);
      if(!dbuser) {
        tally2.push(tally[i]);
      } else {
        embedoutput.description += "`" + dbuser.username + "`\n";
        count++;
      }
    };
    embedoutput.footer = embedfooter(count + " duplicates found.");
    DataManager.setData(tally2);
    embedsender(message.channel, embedoutput);
  } else

  if(command === "logshadowban") {
    if(checkowner(message.author) === false) return;
    let user = getuser(args[0]);
    if(!user) return;
    logshadowban(user);
  } else

  if(command === "shadowban") {
    if(checkowner(message.author) === false) return;
    let user = getuser(args[0]);
    if(!user) return;
    shadowban(user);
  } else

  if(command === "unshadowban") {
    if(checkowner(message.author) === false) return;
    let user = getuser(args[0]);
    if(!user) return;
    unshadowban(user);
  } else

  if(command === "name") {
    let user = message.author;
    let filter = msg => msg.content && msg.author.id === user.id
    message.channel.send('Write your Name')
      .then(function() {
        message.channel.awaitMessages(filter, {
          max: 1,
          time: 10000,
          errors: ['time'],
        })
        .then((collected) => {
          console.log(collected);
            message.channel.send(`Your Name is: ${collected.first().content}`);
          })
          .catch(function(){
            message.channel.send(`You didn't write your name.`);
          });
      });
  } else

  if(command === "position") {
    let tally = DataManager.getData();
    let user = getuser(args[0] ? args[0] : message.author.id)
    if(!user) return;
    let dbuser = getdbuserfromuser(user);
    let dbindex = getdbindexfromdbuser(dbuser);
    console.log(dbindex);
    clearvar();
    embedoutput.title = "House Database Positions";
    embedoutput.description = `**${dbindex}**: ${tally[dbindex].username}    \u200B ${tally[dbindex].bidamount ? (dbindex === 0 ? "∞" : tally[dbindex].bidamount) : 0} :cherry_blossom:`;
    embedsender(message.channel, embedoutput);
  } else

  if(command === "positions") {
    embedoutput = dbpositions();
    embedsender(message.channel, embedoutput)
  } else

  if(command === "bidamount") {
    bidamount(message, args, command, argument);
  } else

  for(let i = 0; i < chessAPIcommands.length; i++) {
    if(command.replace(".", "") === chessAPIcommands[i]) {
      chessAPI(message, args, command, argument)
    }
  };

  if(command === "guideadd") {
    let guidename = args[0];
    if(guidename.startsWith("{")) return;
    let object = JSON.parse(argument.slice(args[0].length).trim());
    if(object !== Object(object)) return;
    let embeds = DataManager.getData("./embeds.json");
    embeds.guides[guidename] = object;
    DataManager.setData(embeds, "./embeds.json");
    message.react(getemojifromname("tick"))
  } else

  if(command === "embedadd") {
    let topic = args[0]
    let guidename = args[1];
    if(guidename.startsWith("{")) return;
    let object = JSON.parse(argument.slice(args[0].length).trim());
    if(object !== Object(object)) return;
    let embeds = DataManager.getData("./embeds.json");
    embeds[topic][guidename] = object;
    DataManager.setData(embeds, "./embeds.json");
    message.react(getemojifromname("tick"))
  } else

  if(command === "getguide") {
    let guidename = args[0];
    embeds = DataManager.getData("./embeds.json");
    object = embeds.guides[guidename];
    if(!object) return;
    message.channel.send({embed: object})
  } else

  if(command === "getembed") {
    let topic = args[0]
    let guidename = args[1];
    embeds = DataManager.getData("./embeds.json");
    object = embeds[topic][guidename];
    if(!object) return;
    message.channel.send({embed: object})
  } else
  
  if(command === "prefix" || command === "lazybotprefix") {

    if(checkowner(message.author) === false) return;
    let newPrefix = argument;
    guildconfig.prefixes.prefix = newPrefix
    DataManager.setData(guildconfig, "./guildconfig.json");
    message.channel.send(`Prefix has been updated to **${newPrefix}** !`);
    console.log(`${message.author.username} [${message.author.id}] has updated the prefix to ${newPrefix}`);
  } else

  if(command === "setusername") {
    if(checkowner(message.author) === false) return;
    let newUsername = args[0];
    clearvar()
    if(newUsername != client.user.username) {
      client.user.setUsername(newUsername);
      sendgenericembed(message.channel, `Bot username has been updated to **${client.user.tag}**`);
    } else {
      senderrormessage(message.channel, `Bot username was already **${client.user.tag}**!`)
    };
  } else

  if(command === "asl") {
    if(args.length !== 0 && args.length !== 1 && args.length !== 3) {
      senderrormessage(message.channel,"Incorrect number of parameters specified. Please specify **age**, **sex**, and **location**.");
    } else {
      aslhandler(message, args, command, argument);
    } 
  } else

  if(command === "verifyinfo") {
    if(checkrole(getmemberfromuser(message.author), "mods") === false) return;
    let user = getuser(args[0])
    let dbuser = getdbuserfromuser(user);
    let newstring = args[1];
    if(!dbuser.modverified) {
      addtofield(message, user, "modverified", newstring)
    } else {
      updatefield(message, user, "modverified", 0, newstring)
    }
  }

  if(command === "ping") {
    sendgenericembed (message.channel, `** ${message.author.tag}** :ping_pong: ${parseInt(client.ping)}ms`)
  } else

  if(command === "uptime") {
    let time = gettime(Date.now() - reboot);
    sendtime (message, time);
  } else

  if(command === "messages") {
    let user = argument ? getuser (argument) : message.author;
    messagecount (message, user);
  } else

  if((command === "updatemessagecount") || (command === "updatemessages")) {
    if(checkowner(message.author) === false) return;
    let tally = DataManager.getData();
    clearvar()
    let user = getuser (args[0])
    let newcount = parseInt(args[1]);
    if(user == null) return;
    let dbuser = user ? getdbuserfromuser (user) : getdbuserfromusername (args[0]);
    if(!dbuser) return;
    let dbindex = getdbindexfromdbuser (dbuser)
    if(dbindex == -1) return;

    if(dbuser.messages == newcount) {
      senderrormessage (message.channel, `Message count for **${user.tag}** was already **${dbuser.messages.toLocaleString()}** messages.`);
    } else {
      let tally = DataManager.getData();
      tally[dbindex].messages = newcount;
      if(tally == undefined) return;
      DataManager.setData(tally);
      messagecount (message, user, true);
    };
  } else

  if(command === "removedbuser") {
    if(checkowner(message.author) === false) return;
    let tally = DataManager.getData();    
    clearvar()
    let user = getuser (args[0], true)
    let dbuser = user ? getdbuserfromuser (user) : getdbuserfromusername (args[0]);
    if(!dbuser) return;
    let dbindex = getdbindexfromdbuser (dbuser)
    if(dbindex == -1) return;
    tally = tally.remove(dbindex);
    if(tally == undefined) return;
    DataManager.setData(tally);
    embedoutput.description = `**${dbuser.username}** has been deleted from the database.`;
    embedoutput.color = 15406156;
    embedsender(message.channel, embedoutput);

  } else

  if(command === "lastmessage") {

    let user = argument ? getuser (argument) : message.author;
    if(user == null) {
      senderrormessage(message.channel, `No user found.`)
    } else {
      let dbuser = getdbuserfromuser (user);
      let dbindex = getdbindexfromdbuser (dbuser);
      var lastmessage;
      if(dbuser.lastmessage) {
        clearvar()
        lastmessage = (dbuser.lastmessagedate ? `\nSent at ${getISOtime (dbuser.lastmessagedate)}.` : "") + (dbuser.lastmessage.startsWith("<:") && dbuser.lastmessage.endsWith (">") ? "\n" + dbuser.lastmessage : "\`\`\`" + dbuser.lastmessage + "\`\`\`");
        embedoutput.title = "Last Message";
        embedoutput.description = lastmessage;
        embedsender (message.channel, embedoutput);
      };
    }
  } else

  if(command === "commands" || command === "lazybotcommands") {

    clearvar()
    embedoutput.description = "**Nadeko functions**\n```css\n.nadekoprefix        [newPrefix]    {owneronly}\n.fb                  [user]         {owneronly}\n.bcp                 [e/d]          {modsonly}\n.testingmode         [e/d]          {devonly}\n.mf                  [g,t,i]\n.tf                  [g,t,i]\n.decimaltous         [decimalodds]\n.ustodecimal         [usodds]\n.fetch               [messageid]\n.notify              [valid link]```\n**Bot functions**\n```css\n!prefix              [newPrefix]    {owneronly}\n!setusername         [newUsername]  {owneronly}\n!updatemessagecount  [user,msgs]    {owneronly}\n!removedbuser        [user]         {owneronly}\n!asl                 [a,s,l]\n!ping                []\n!uptime              []\n!messages            []\n!lastmessage         []\n!commands            []```\n**Miscellaneous Functions**\n```css\nsubreddit link       [/r/,r/]\nmessage counter      [message]\nleave message        [userLeft]\ntrivia payout msg    [embed,content]```";
    embedoutput.thumbnail = embedthumbnail (config.avatar);
    embedsender (message.channel, embedoutput);

  } else

  if(command === "profile") {
    let user = argument ? getuser (argument) : message.author;
    if(user == null) {
      senderrormessage(message.channel, `No user found.`)
    } else {
      clearvar()
      embedoutput = getprofile(user);
      embedsender (message.channel, embedoutput);
    }
  } else

  if(command === "fieldadd") {
    if(checkowner(message.author) === false) return;
    let tally = DataManager.getData();
    clearvar()
    let newfield = args[0].replace(/[.,#!$%\^&;:{}<>=-_`\"~()]/g,"");
    if(!newfield) return;

    if(tally[0][newfield] || (tally[0][newfield] == "")) {
      senderrormessage (message.channel, "Field already exists!")
    } else {
      for(let i = 0; i < tally.length; i++) {
        tally[i][newfield] = ""};
      if(tally == undefined) return;
      DataManager.setData(tally);
      sendgenericembed (message.channel, `New field **${newfield}** has been added to each user in db.`);
    };
    
  } else

  if(command === "ratingmod") {
    if(checkowner(message.author) === false) return;
    let source = args[0];
    let sourceratings = args[0] + "ratings";
    let tally = DataManager.getData();
    if(source === "chess.comerror") {
      for(let i = 0; i < tally.length; i++) {
        let string = "chess.comratings"
        if(tally[i][string]) {
          tally[i].chesscomratings = tally[i][string];
          delete tally[i][string];
          console.log("Completed for " + tally[i].username);
        }
      }
    } else {
      for(let i = 0; i < tally.length; i++) {
        if(tally[i].ratings && !tally[i][sourceratings]) {
          tally[i][sourceratings] = tally[i].ratings;
          delete tally[i].ratings;
          console.log("Completed for " + tally[i].username);
        }
      }
    }
    console.log("Made it to the end");
    DataManager.setData(tally);
  } else

  if(command === "setfield") {
    if(checkowner(message.author) === false) return;
    let tally = DataManager.getData();
    clearvar()
    let newfield = args[0].replace(/[.,#!$%\^&;:{}<>=-_`\"~()]/g,"");
    if(!newfield) return;
    let content = argument.slice(args[0].length + 1);

    if(!([newfield] in tally[0])) {
      senderrormessage (message.channel, "Field does not exist!")
    } else {
      if(content === "array") {
        for(let i = 0; i < tally.length; i++) {
          tally[i][newfield] = [];
        }} else
      if(content === "object") {
        for(let i = 0; i < tally.length; i++) {
          tally[i][newfield] = {};
        }
      } else {
          content = isNaN(parseFloat(content)) ? content : parseFloat(content);
          for(let i = 0; i < tally.length; i++) {
            tally[i][newfield] = content ? content : "";
          };
        }
        if(tally == undefined) return;
        DataManager.setData(tally);
        sendgenericembed (message.channel, `Field **${newfield}** has been set to **${content}** for every user in db.`);
      };
  } else

  if(command === "removefield") {
    if(checkowner(message.author) === false) return;
    let tally = DataManager.getData();
    clearvar()
    let newfield = args[0]
    if(!newfield) return;
    if(args[1]) {
      for(let i = 0; i < tally.length; i++) {
        delete tally[i][newfield];
      }
    } else {
      tally[i].clean(newfield);
    }
    if(tally == undefined) return;
    DataManager.setData(tally);
    sendgenericembed (message.channel, `${!args[1] ? "Blank fields with title" : "Field"} **${newfield}** has been deleted from each user in db.`);

    
  } else

  if(command === "finger") {
    let tally = DataManager.getData();
    clearvar()
    let user = message.author;
    let newfinger = inputstring(argument);
    let dbuser = user ? getdbuserfromuser (user) : getdbuserfromusername (args[0]);
    if(!dbuser) return;
    let dbindex = getdbindexfromdbuser (dbuser)
    if(dbindex == -1) return;

    if(!newfinger) {
      embedoutput.content = "Your current finger message is:"
      embedoutput.title = user.tag;
      if(dbuser.finger) {
        embedoutput.description = "\`\`\`" + dbuser.finger + "\`\`\`";
        embedoutput.footer = embedfooter (`!finger clear to remove your finger message.`)
      } else {
        embedoutput.description = "\`\`\` \`\`\`";
      };
      embedsender (message.channel, embedoutput)
    } else
    if(newfinger.length > 500) {
      senderrormessage (message.channel, `Finger must be within **500** characters.`);
    } else
    if(dbuser.finger == newfinger) {
      senderrormessage (message.channel, `Finger for **${user.tag}** was already as posted.`);
    } else {
      newfinger === "clear" ? delete tally[dbindex].finger : tally[dbindex].finger = newfinger;
      if(tally == undefined) return;
      DataManager.setData(tally);
      sendgenericembed (message.channel, `Finger for **${user.tag}** has been` + (newfinger === "clear" ? " cleared" : " updated."))
    };
  } else

  if(command.startsWith("add")) {
    if(checkowner(message.author) === false) {
      senderrormessage(message.channel, `Insufficient permissions to do this.`);
    } else {
      let field = command.slice(3, command.length);
      let user = getuser(args[0])
      if(user == null) {
        senderrormessage(message.channel, `No user found!`);
        return;
      }
      let newstring = argument.slice(args[0].length + 1, argument.length)
      addtofield(message, user, field, newstring);
    }
  } else

  if(command.startsWith("update" || "delete")) {
    if(checkowner(message.author) === false) {
      senderrormessage(message.channel, `Insufficient permissions to do this.`);
    } else {
      let field = command.slice(6, command.length);
      let user = getuser(args[0])
      if(user == null) {
        senderrormessage(message.channel, `No user found!`);
        return;
      }
      let newstring = command.startsWith("update") ? "" : argument.slice(args[0].length + 1, argument.length);
      let fieldindex = args[1];
      updatefield(message, user, field, fieldindex, newstring);
    }
  } else

  if(command === "backupdb") {
    degree = args[0] ? args[0] : "1";
    if((degree !== "1") && (degree !== "2") && (degree !== "3")) {degree = "1"};
    let success = backupdb (degree);
    success ? sendgenericembed (message.channel, `Database backed up to **dbbackup${degree}** at ${getISOtime (Date.now())}.`) : senderrormessage (message.channel, `Failed to backup database. Please review js.`)
  } else

  if(command === "restoredb") {
    degree = args[0] ? args[0] : "1";
    if((degree !== "1") && (degree !== "2") && (degree !== "3")) {degree = "1"};
    let tally = DataManager.getData(`./dbbackup${degree}.json`);
    DataManager.setData(tally)
    console.log(`Database restored from dbbackup${degree}.json at ${gettime (Date.now())}.`);
    let success = true;
    success ? sendgenericembed (message.channel, `Database was restored from **dbbackup${degree}** at ${getISOtime (Date.now())}.`) : senderrormessage (message.channel, `Failed to backup database. Please review js.`)
  } else

  if(command === "backupstatus") {
    clearvar();
    embedoutput.title = "Backup Databases Last Updated:";
    addfield("dbbackup1.json", config.backupdb[0], true)
    addfield("dbbackup2.json", config.backupdb[1], true)
    addfield("dbbackup3.json", config.backupdb[2], true)
    embedsender (message, embedoutput);
  } else 

  if(command === "deactivate") {
    let user = message.author;
    let member = getmemberfromuser (user);
    if(!checkrole (member, "dev")) return;
    let channel = getchannelfromname(guildconfig.channels.announcements);
    clearvar()
    embedoutput.author = embedauthor("LAZYbot#9000", "https://i.imgur.com/pvh3yXm.png")
    embedoutput.description = `Daisy, Daisy, give me your answer, do. I'm half crazy all for the love of you...`;
    embedoutput.color = 14618131,
    embedsender (channel, embedoutput);
  } else

  if(command === "gild") {
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

  if(command === "emoji") {
    if(checkowner(message.author) === false) return;
    let emojiname = args[0]
    if(!emojiname) return;
    let emoji = getemojifromname(emojiname)
    if(!emoji) return;
    message.react(emoji.id);
  } else

  if(command === "setdbusername") {
    user = args[0] && checkowner(message.author) === true ? getuser(args[0]) : message.author;
    let dbuser = getdbuserfromuser(user);
    let dbindex = getdbindexfromdbuser(dbuser);
    let tally = DataManager.getData();
    tally[dbindex].username = message.author.tag;
    DataManager.setData(tally);
    sendgenericembed(message.channel, `Data on **username** re-registered to database for **${user.tag}**.`)
  } else

  if(command === "upversion" || command === "version") {
    if(checkowner(message.author) === false) return;
    version = package.version.split(".", 3);
    var newversion;
    if(command === "upversion") {
      if(args.length === 0) {
        newversion = version[0] + "." + version[1] + "." + (Number(version[2]) + 1);
      } else {
        if(argument.toLowerCase().includes("big")) {
          newversion = version[0] + "." + (Number(version[1]) + 1) + "." + version[2];
        } else
        if(argument.toLowerCase().includes("huge")) {
          newversion = (Number(version[0]) + 1) + "." + version[1] + "." + version[2];
        } else {
          return;
        }
      }
    } else 
    if(command === "version") {
      newversion = argument;
    }
    if(newversion) {
      package.version = newversion;
      DataManager.setData(package, "./package.json");
      sendgenericembed(message.channel, `${package.name} version has been ${command === "upversion" ? "upped" : "modified"} to **v.${newversion}**!`)
    } else {
      senderrormessage(message.channel, `No version specified.`);
    }
  };

  cr (message, "marco", "polo!");
  cr (message, "ready", "I am ready!");
  cr (message, "owner", "theLAZYmd#2353");
  cr (message, "who", `I am LAZYbot#2309 **v${package.version}**`);
  cr (message, "help", "This is a pretty basic bot, there isn't much it can help you with.");
  cr (message, "party", ":tada:");
  er (message, command, args);

};

function botfunctions(message) {
  if(message.author.id === bouncerbot.id && message.embeds.length !== 0 && message.embeds[0].description) {
    if(message.embeds[0].author && message.embeds[0].title) {
      triviareaction(message)
    };
    pingsubs(message);
    if(message.embeds[0].description.includes("housebank#5970") && message.embeds[0].description.includes("has") && !message.embeds[0].description.includes("given")) {
      let start = message.embeds[0].description.indexOf("has") + 4;
      let finish = message.embeds[0].description.indexOf(":cherry_blossom:") - 1;
      let sumtotal = message.embeds[0].description.slice(start, finish);
      clearvar()
      embedoutput.color = guildconfig.colors.generic;
      embedoutput.description = `**housebank#5970** has ${sumtotal} :cherry_blossom:`;
      updatepinned("transaction-log", "432668389371281429", {embed: embedoutput});
    } else
    if(message.embeds[0].description.includes("has gifted") && message.channel.id === getchannelfromname("transaction-log").id) {
      message.delete(10000);
    };
  } else {
    pingsubs(message);
  }
};

function nonprefixfunctions(message) {

  if(message.content.startsWith ("Final Results") || message.content.startsWith ("Trivia Game Ended")) {
    triviareaction(message);
  } else {
    let args = message.content.match(messageSplitRegExp);
    let argument = message.content.trim();
    checker(message, args, argument)
    if(message.content.includes("r/")) {
      redditlinks(message, args, argument)
    }
  }
};

function updatepinned(channelname, messageid, content) {
  if(!channelname || !messageid || !content) return;
  let channel = getchannelfromname(channelname);
  channel.fetchMessage(messageid)
  .then(message => {
    clearvar();
    message.edit(content);
  })
  .catch(console.error);
};

Array.prototype.findAllIndexes = function(conditions) {
    let indexes = [];
    for(let i = 0; i < this.length; i++) {
      if(conditions(this[i])) {
        indexes.push(i)
      }
    };
    return indexes;
};

function tickethandler(message, args, command, argument) {
  command = args.shift().toLowerCase();
  argument = argument.slice(command.length + 1);
  if(command === "add") {
    let user = message.author.tag;
    let id = message.author.id;
    if(!args[0] || args[0] === "0") {
      senderrormessage(message.channel, `Invalid claim amount!`);
      return;
    };
    if(isNaN(args[0])) {
      let killboolean = false;
      let searchstring = args.shift().toLowerCase();
      user = getuser(searchstring)
      if(!user) {
        message.react(getemojifromname("closed"));
        killboolean = true;
      };
      if(killboolean === true) return;
      user = user.tag;
      id = user.id;
      argument = argument.slice(searchstring.length + 1);
    };
    let amount = args[0];
    let reason = argument.slice(args[0].length).trim().length > 75 ? argument.slice(args[0].length).trim().slice(0, 75) : argument.slice(args[0].length).trim();
    let messageid = message.id;
    if(!guildconfig.tickets) {
      guildconfig.tickets = [];
      guildconfig.tickets[0] = {id, user, amount, reason, messageid}
      DataManager.setData(guildconfig, "./guildconfig.json");
    } else {
      guildconfig.tickets.push({id, user, amount, reason, messageid});
      DataManager.setData(guildconfig, "./guildconfig.json");
    };
    message.react(getemojifromname("in_progress"));
    message.reply(`Ticket added for user **${user}** claiming **${amount}** because of ${reason}.`)
    .then(msg => {
      msg.delete(10000)
    })
    .catch(`Some error somewhere.`);
    embedoutput = tickets();
    updatepinned("transaction-log", "432665562502397963", {embed: embedoutput});
  } else
  if(command === "close") {
    if(!args[0]) return;
    if(args[0] === "all") {
      guildconfig.tickets = [];
      DataManager.setData(guildconfig, "./guildconfig.json");
      message.react(getemojifromname("tick"));
      message.channel.send(`All ticket successfully closed!`)
      .then(msg => {
        msg.delete(5000)
      })
      .catch(`Some error somewhere.`);
      embedoutput = tickets();
      updatepinned("transaction-log", "432665562502397963", {embed: embedoutput});
      return;
    };
    index = [];
    if(args[1] && isNaN(args[1])) {
      if(isNaN(args[0]) || args[0] === "0"|| args[0] > guildconfig.tickets.length) {
        senderrormessage(message.channel, `Invalid ticket index!`);
        return;
      } else {
        index[0] = parseInt(args[0]) - 1;
        let embed = {};
        embed.title = `Ticket ${args[0]} closed.`;
        embed.color = guildconfig.colors.generic;
        embed.fields = [];
        embed.fields = embedaddfield(embed.fields, `Claim`, guildconfig.tickets[index[0]].amount + " :cherry_blossom:", false);
        embed.fields = embedaddfield(embed.fields, `Your Reason`, guildconfig.tickets[index[0]].reason, false);
        embed.fields = embedaddfield(embed.fields, `Mod Replies`, argument.slice(args[0].length).trim(), false);
        user = getuser(guildconfig.tickets[index[0]].user)
        user.send({embed: embed})
        let helpchannel = getchannelfromname("help");
        helpchannel.fetchMessage(guildconfig.tickets[index[0]].messageid)
        .then(msg => {
          msg.clearReactions();
          msg.react(getemojifromname("closed"));
        })
        .catch(console.error);
      }
    } else {
      for(let i = 0; i < args.length; i++) {
        if(isNaN(args[i]) || !args[i] || args[i] === "0" || args[i] > guildconfig.tickets.length) {
          senderrormessage(message.channel, `Invalid ticket index!`);
          return;
        } else {
          index[i] = parseInt(args[i]) - 1;
          let helpchannel = getchannelfromname("help");
          helpchannel.fetchMessage(guildconfig.tickets[index[i]].messageid)
          .then(msg => {
            msg.clearReactions();
            msg.react(getemojifromname("closed"));
          })
          .catch(console.error);
        }
      }
    };
    guildconfig.tickets = guildconfig.tickets.remove(index);
    DataManager.setData(guildconfig, "./guildconfig.json");
    message.react(getemojifromname("tick"));
    message.delete(5000);
    for(let i = 0; i < index.length; i++) {
      message.channel.send(`Ticket ${index[i] + 1} successfully closed!`)
      .then(msg => {
        msg.delete(5000);
      })
      .catch(`Some error somewhere.`);
    };
    embedoutput = tickets();
    updatepinned("transaction-log", "432665562502397963", {embed: embedoutput});
  };
}

function ticketgivehandler(message, args, command, argument, user) {
  let indexes = guildconfig.tickets.findAllIndexes(x => x.id === user.id && x.amount === args[0]);
  if(indexes.length === 0) return;
  if(indexes.length > 1) {
    let channel = message.channel;
    for(let i = 0; i < indexes.length; i++) {indexes[i] = indexes[i] + 1}
    clearvar();
    embedoutput.title = `Which ticket to remove?`;
    embedoutput.description = indexes.join(" ");
    embedsender(channel, embedoutput);
    filter = msg => msg.author.id === message.author.id && !isNaN(msg.content)
    channel.awaitMessages(filter, {
      max: 1,
      time: 30000,
      errors: ['time'],
    })
    .then((collected) => {
      collected.first().react(getemojifromname("tick"));
      index = Number(collected.first().content) -1;
      guildconfig.tickets.remove(index);
      DataManager.setData(guildconfig, "./guildconfig.json");
      embedoutput = tickets();
      updatepinned("transaction-log", "432665562502397963", {embed: embedoutput});
      message.react(getemojifromname("tick"));
      message.channel.send(`Ticket ${indexes[0] + 1} successfully closed!`)
      .then(msg => {
        msg.delete(5000)
      })
      .catch(`Some error somewhere.`);
      })
      .catch(function(){
        console.log(message.author.tag + " timed out.")
      });
  } else {
    let helpchannel = getchannelfromname ("help");
    helpchannel.fetchMessage(guildconfig.tickets[indexes[0]].messageid)
    .then(msg => {
      msg.clearReactions();
      setTimeout(()=>{
        msg.react(getemojifromname("paid"))
      }, 2000);
    })
    .catch (console.error);
    guildconfig.tickets.remove(indexes[0]);
    DataManager.setData(guildconfig, "./guildconfig.json");
    embedoutput = tickets();
    updatepinned("transaction-log", "432665562502397963", {embed: embedoutput});
    message.react(getemojifromname("tick"));
    message.channel.send(`Ticket ${indexes[0] + 1} successfully closed!`)
    .then(msg => {
      msg.delete(5000)
    })
    .catch(`Some error somewhere.`);
  }
}

function tickets() {
  guildconfig = DataManager.getData("./guildconfig.json");
  let array = [];
  for(let i = 0; i < guildconfig.tickets.length; i++) {
    array[i] = [];
    array[i][0] = `${guildconfig.tickets[i].user}`;
    array[i][1] = guildconfig.tickets[i].amount + " :cherry_blossom: " + guildconfig.tickets[i].reason;
  };
  embedoutput = getleaderboard(array, false);
  embedoutput.title = `${getemojifromname("thehouse")} House :cherry_blossom: Claimants`
  embedoutput.footer = embedfooter(guildconfig.tickets[0] ? `Should clear automatically upon '.give x person'.` : `All tickets have been cleared!`)
  embedoutput.color = guildconfig.colors.generic;
  return embedoutput;
};

function databasepositionhandler(message, args, command, argument) {
  let [bidamount, checkuser, databasestring, positionstring, dbindex] = args;
  if(!bidamount || !checkuser || !databasestring || !positionstring) return;
  if(checkowner(getuser(checkuser)) === false || databasestring.toLowerCase() !== "database" || isNaN(bidamount) ) return;
  let user = message.author;
  let filter = msg => msg.author.id === bouncerbot.id && msg.embeds && msg.embeds[0] && msg.embeds[0].description.includes("gifted");
  let channel = message.channel;
  channel.awaitMessages(filter, {
    max: 1,
    time: 5000,
    errors: ['time'],
  })
  .then((collected) => {
    bidamount = Number(bidamount);
    let tally = DataManager.getData();
    let newdbuser = getdbuserfromuser(message.author);
    let newdbindex = getdbindexfromdbuser(newdbuser);
    if(positionstring.toLowerCase() === "consolidate" && !dbindex ) {
      tally[newdbindex].bidamount = tally[newdbindex].bidamount ? tally[newdbindex].bidamount + bidamount : bidamount;
      DataManager.setData(tally);
      newdbuser = getdbuserfromuser(message.author);
      clearvar()
      embedoutput.title = `Successfully consolidated Database Position **${newdbindex}**!`
      embedoutput.description = `**${newdbuser.username}** has spent **${bidamount}** :cherry_blossom: for a total of ${newdbuser.bidamount} at position ${newdbindex}!`;
      embedsender(channel, embedoutput);
      return;
    } else 
    if (positionstring.toLowerCase() === "position") {
      dbindex = Number(dbindex);
      let dbuser = tally[dbindex];
      if(dbindex === 0 && checkowner(message.author) === false) {
        console.log("Position 0");
        return;
      } else 
      if(dbindex === newdbindex) {
        clearvar()
        embedoutput.title = `Buying a Database Position`;
        embedoutput.description = `Transaction could not be verified. Error: **you already own this position!**\nPlease seek refund.`;
        embedoutput.color = guildconfig.colors.error;
        embedsender(channel, embedoutput);
        return;
      } else 
      if(!isNaN(dbindex)) {
        let previoustotal = tally[newdbindex].bidamount ? tally[newdbindex].bidamount : 0;
        oldbidamount = tally[dbindex].bidamount ? tally[dbindex].bidamount : 0;
        newbidamount = tally[newdbindex].bidamount ? tally[newdbindex].bidamount + bidamount : bidamount;
        let subtraction = oldbidamount >= newbidamount ? newbidamount : oldbidamount;
        if(oldbidamount >= newbidamount) {
          tally[newdbindex].bidamount = newbidamount - subtraction;
          tally[dbindex].bidamount = oldbidamount - subtraction;
          DataManager.setData(tally);
          tally = DataManager.getData();
          clearvar()
          embedoutput.content = `Alerting <${dbuser.id}> to this transaction.`;
          embedoutput.author = embedauthor(`Was not able to purchase Database Position ${dbindex}.`)
          embedoutput.title = `Bought out some of the bidamount of ${dbuser.username}.`
          embedoutput.description = `**${newdbuser.username}** bid **${bidamount}** :cherry_blossom: for position **${dbindex}**.\n**${newdbuser.username}** had **${previoustotal}** :cherry_blossom: consolidated.\nTotal bid  by **${newdbuser.username}** for ${dbindex} is **${newbidamount}** :cherry_blossom:.\n**${dbuser.username}** had **${oldbidamount}** :cherry_blossom: consolidated.\nSubtracted **${subtraction}** :cherry_blossom: from both totals.\nNew bidamount for **${tally[dbindex].username}** is **${tally[dbindex].bidamount}** :cherry_blossom:.\nNew bidamount for **${tally[newdbindex].username}** is **${tally[newdbindex].bidamount}** :cherry_blossom:.\n**${newdbuser.username}** remains at position ${newdbindex}.\n**${dbuser.username}** remains at position ${dbindex}.`;
          embedsender(channel, embedoutput);
        } else {
          tally[newdbindex].bidamount = newbidamount;
          tally[dbindex].bidamount = oldbidamount;
          DataManager.setData(tally);
          tally = DataManager.getData();
          clearvar()
          tally.swap(dbindex, newdbindex);
          DataManager.setData(tally);
          clearvar()
          embedoutput.content = `Alerting <@${dbuser.id}> to this transaction.`;
          embedoutput.title = `Successfully purchased Database Position ${dbindex} for ${newbidamount} :cherry_blossom:!`
          embedoutput.description = `**${newdbuser.username}** bid **${bidamount}** :cherry_blossom: for position **${dbindex}**.\n**${newdbuser.username}** had **${previoustotal}** :cherry_blossom: consolidated.\nTotal bid by **${newdbuser.username}** for ${dbindex} is **${newbidamount}** :cherry_blossom:.\n**${dbuser.username}** had **${oldbidamount}** :cherry_blossom: consolidated.\n**${newdbuser.username}** is now at position **${dbindex}** with **${tally[dbindex].bidamount}** :cherry_blossom:!\n**${dbuser.username}** is now at position **${newdbindex}** with **${tally[newdbindex].bidamount}** :cherry_blossom:!`;
          embedsender(channel, embedoutput);
          let announcementschannel = getchannelfromname ("announcements");
          announcementschannel.fetchMessage("432539249024303105")
          .then (message => {
            clearvar();
            embedoutput = dbpositions();
            message.edit({embed: embedoutput});
          })
          .catch (console.error);
        }
      }
    } else
    if((!dbindex && dbindex !== 0) || isNaN(dbindex) ) {
      clearvar()
      embedoutput.title = `Buying a Database Position`;
      embedoutput.description = `Transaction could not be verified. Error: incorrect formatting, please seek refund.`;
      embedoutput.color = guildconfig.colors.error;
      addfield(`Format`, "`.give [bid amount] theLAZYmd#2353 Database Position [desired position]`", false);
      addfield(`Example`, "`.give 100 theLAZYmd#2353 Database Position 0`", false);
      embedsender(channel, embedoutput);
      return;
    }
  })
  .catch(function(){
    console.log(`${message.author} introduced an error.`)
  });
};

function dbpositions() {
  let tally = DataManager.getData();
  let array = [];
  for(let i = 1; i < 10; i++) {
    medal = "";
    if(i === 1) {medal = " :first_place:"}
    if(i === 2) {medal = " :second_place:"}
    if(i === 3) {medal = " :third_place:"}
    array[i - 1] = [];
    array[i - 1][0] = `${tally[i].username}`;
    array[i - 1][1] = (tally[i].bidamount ? tally[i].bidamount : 0) + " :cherry_blossom:" + medal;
  }
  clearvar()
  embedoutput = getleaderboard(array);
  embedoutput.title = `${getemojifromname("thehouse")} House Database Positions`
  embedoutput.footer = embedfooter(`... dbpositions to see how this all works.`)
  embedoutput.color = guildconfig.colors.generic;
  return embedoutput;
};

function logshadowban(user) {
  guildconfig.shadowbanned && guildconfig.shadowbanned[0] ? guildconfig.shadowbanned.push([user.id, false]) : guildconfig.shadowbanned = []; guildconfig.shadowbanned[0] = [user.id, false];
  DataManager.setData(guildconfig, "./guildconfig.json");
};

function shadowban(user) {
  for(let i = 0; i < guildconfig.shadowbanned.length; i++) {
    if(user.id === guildconfig.shadowbanned[i][0] && guildconfig.shadowbanned[i][1] === false) {
      guildconfig.shadowbanned[i][1] = true;
      DataManager.setData(guildconfig, "./guildconfig.json");
    }
  }
};

function unshadowban(user) {
  for(let i = 0; i < guildconfig.shadowbanned.length; i++) {
    if(user.id === guildconfig.shadowbanned[i][0] && guildconfig.shadowbanned[i][1] === true) {
      guildconfig.shadowbanned[i][1] = false;
      DataManager.setData(guildconfig, "./guildconfig.json");
    }
  }
};

function executeshadowban(message) {
  var boolean;
  for(let i = 0; i < guildconfig.shadowbanned.length; i++) {
    if(message.author.id === guildconfig.shadowbanned[i][0] && guildconfig.shadowbanned[i][1] === true) {
      message.delete();
      boolean = true;
    }
  }
  return boolean;
};

function bidamount(message, args, command, argument) {
  let user = args[0] ? getuser(args[0]) : message.author;
  if(!user) {
    senderrormessage(message.channel, `User could not be found!`)
    return;
  };
  let dbuser = getdbuserfromuser(user);
  let dbindex = getdbindexfromdbuser(dbuser);
  if(dbindex === 0) {
    sendgenericembed(message.channel, `User has bid **∞** :cherry_blossom: for Database Position **${dbindex}**.`)
    return;
  } else
  if(dbuser.bidamount) {
    sendgenericembed(message.channel, `User bid **${dbuser.bidamount}** :cherry_blossom: for Database Position **${dbindex}**.`)
  } else {
    sendgenericembed(message.channel, `User has bid **0** :cherry_blossom: for Database Position **${dbindex}**! Database Position **${dbindex}** is unsecured!`)
  }
};

function addtofield(message, user, field, newstring) {
  let tally = DataManager.getData();
  let dbuser = getdbuserfromuser(user);
  let dbindex = getdbindexfromdbuser(dbuser)
  if(!dbuser[newstring]) {
    tally[dbindex][field] = [];
    tally[dbindex][field][0] = newstring;
    DataManager.setData(tally);
    sendgenericembed (message.channel, `Created new field ${field}!\n${field.toProperCase()} **${newstring}** added for **${user.tag}**.`)
  } else
  if(dbuser[field].includes(newstring)) {
    senderrormessage (message.channel, `**${user.tag}** already had ${field.toProperCase()} **${newstring}**.`);
  } else {
    tally[dbindex][field].push(newstring);
    DataManager.setData(tally);
    sendgenericembed (message.channel, `${field.toProperCase()} **${newtrophy}** added for **${user.tag}**.`)
  }
};

function updatefield(message, user, field, fieldindex, newstring) {
  console.log(message.content, user.tag, field, fieldindex, newstring);
  let tally = DataManager.getData();
  let dbuser = getdbuserfromuser(user);
  let dbindex = getdbindexfromdbuser(dbuser)
  if(parseInt(field) > dbuser[field].length - 1) return;
  if(fieldindex) {
    tally[dbindex][field][fieldindex] = newstring ? newstring : "";
  } else {
    delete tally[dbindex][field]
  };
  tally[dbindex][field].clean();
  if(!tally[dbindex][field][0]) {delete tally[dbindex][field]}
  DataManager.setData(tally);
  sendgenericembed(message.channel, `${field.toProperCase()} for **${user.tag}** ${newstring ? "updated to **" + newstring + "**." : "removed."}`)
}

function pingsubs(message) {
  if(message.channel.id === getchannelfromname(guildconfig.channels.live).id && (message.author.id === bouncerbot.id || message.author.id === harmonbot.id)) {
    if(message.author.id === bouncerbot.id) {
      if(!(message.embeds[0] && message.embeds[0].author && message.embeds[0].author.name)) return;
      pingrole(message.channel, guildconfig.roles.livenotifications);
    } else {
      pingrole(message.channel, guildconfig.roles.livenotifications);
    }
  } return;
};

function aslhandler(message, args, command, argument) {
  let tally = DataManager.getData();
  let user = message.author;
  let dbuser = getdbuserfromuser(user);
  let dbindex = getdbindexfromdbuser(dbuser);
  if(args.length === 0) {
    if(!dbuser.age && !dbuser.sex & !dbuser.location) {
      senderrormessage(message.channel, `Please specify **age**, **sex**, and **location**.`)
    } else {
      let aslarray = [];
      aslarray.push(dbuser.age ? `**${dbuser.age}** years old` : ``, dbuser.sex ? `**${dbuser.sex}**` : ``, dbuser.location ? `from **${dbuser.location}**` : ``);
      aslarray.clean();
      let asl = "";
      for(let i = 0; i < aslarray.length; i++) {
        if(!aslarray[i]) {aslarray.remove(i)}
        asl += aslarray[i] + (i < aslarray.length -1 ? (i < aslarray.length -2 ? `, ` : `${aslarray.length === 3 ? `,` : ``} and `) : ``);
      };
      sendgenericembed(message.channel, `Hello **${message.author.username}**, I see you're ${asl}.`);
    }
  } else
  if(args.length === 1) {
    if(args[0] === "clear") {
      if(dbuser.age) {delete tally[dbindex].age};
      if(dbuser.sex) {delete tally[dbindex].sex};
      if(dbuser.location) {delete tally[dbindex].location};
      if(dbuser.modverified && dbuser.modverified[0] == "modverified") {delete tally[dbindex].modverified};
      DataManager.setData(tally);
      sendgenericembed(message.channel, `Data on **age**, **sex**, and **location** cleared for **${user.tag}**.`)
    } else
    if(args[0] === "update") {
      tally[dbindex].username = message.author.tag;
      DataManager.setData(tally);
      sendgenericembed(message.channel, `Data on **username** re-registered to database for **${user.tag}**.`)
    } else {
      senderrormessage(message.channel,"Incorrect number of parameters specified. Please specify **age**, **sex**, and **location**.");
    };
  } else
  if(args.length === 3) {
    let [age, sex, location] = args;
    if(isNaN(Number(age)) && age !== "-") {
      senderrormessage(message.channel, `Please specify a number for **age**.`)
      return;
    }
    age = age === "-" ? "" : age.toLowerCase();
    sex = sex === "-" ? "" : sex.toLowerCase();
    location = location === "-" ? "" : location.toProperCase();
    if(!age && dbuser.age) {delete tally[dbindex].age} else if(dbuser.age !== age && age) {tally[dbindex].age = age};
    if(!sex && dbuser.sex) {delete tally[dbindex].sex} else if(dbuser.sex !== sex && sex) {tally[dbindex].sex = sex};
    if(!location && dbuser.location) {delete tally[dbindex].location} else if(dbuser.location !== location && location) {tally[dbindex].location = location};
    if(dbuser.modverified && dbuser.modverified[0] == "modverified") {delete tally[dbindex].modverified};
    DataManager.setData(tally);
    dbuser = getdbuserfromuser(user);
    let aslarray = [];
    aslarray.push(dbuser.age ? `**${dbuser.age}** years old` : ``, dbuser.sex ? `**${dbuser.sex}**` : ``, dbuser.location ? `from **${dbuser.location}**` : ``);
    aslarray.clean();
    let asl = "";
    for(let i = 0; i < aslarray.length; i++) {
      if(!aslarray[i]) {aslarray.remove(i)}
      asl += aslarray[i] + (i < aslarray.length -1 ? (i < aslarray.length -2 ? `, ` : `${aslarray.length === 3 ? `,` : ``} and `) : ``);
    };
    if(asl) {
      sendgenericembed(message.channel, `Hello **${message.author.username}**, I see you're ${asl}.`);
    } else {
      senderrormessage(message.channel, `Please specify **age**, **sex**, and **location**.`)
    }
  }
}

function chessAPI(message, args, command, argument) {

  if(command === "help") {
    if(args.length === 1) {
      clearvar();
      embedoutput.title = "Rating Commands " + getemojifromname("lichess") + " " + getemojifromname("chesscom");
      embedoutput.color = guildconfig.colors.ratings;
      addfield("!lichess [lichess.org user]", "Links you to Lichess user. Defaults to your Discord username if no profile user.");
      addfield("!chesscom [chess.com user]", "Links you to Chess.com user. Defaults to your Discord username if no profile user.");
      addfield("!remove [chesscom | lichess]", "Removes your profile from the rating tracker.");
      addfield("!update", "Queues your profile to be automatically updated.");
    //addfield("!list [variant] [page]", "Show current leaderboard. [variant] and [page] number optional.");
    //addfield("!MyRank", "Displays your current rank.");
      addfield("!ratinghelp", "Lists commands for configuring rating on profile.");
      embedsender(message.channel, embedoutput)
    }
  };

  if(command === "remove") {
    removesource(message, args, command, argument)
  }

  if(command === "update") {
    if(args.length === 0) {
      tracker.queueForceUpdate(message.member.id);
      message.channel.send("Queued for update.")
      .catch((e) => console.log(JSON.stringify(e)));
    }
    return;
  }

  if(command === "lichess") {
    if(args.length === 1 || args.length === 0) {
      //Adding sender to tracking
      tracker.track(message.guild.id, message.member.id, "lichess", args[0] ? args[0] : message.author.username, message)
    } else if(args.length === 2) {
      if(canManageRoles(message.member)) {
        let user = getuser (args[0])
        if(user) {
          let member = getmemberfromuser (user);
          tracker.track(message.guild.id, member.id, "lichess", args[1], message);
        } else {
          senderrormessage(message.channel, "Invalid user given.")
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

  if(command.replace(".","") === "chesscom") {
    if(args.length === 1 || args.length === 0) {
      //Adding sender to tracking
      tracker.track(message.guild.id, message.member.id, "chesscom", args[0] ? args[0] : message.author.username, message);
    } else if(args.length === 2) {
      if(canManageRoles(message.member)) {
        console.log(args);
        let user = getuser (args[0]);
        if(!user) return;
        let member = getmemberfromuser (user);
        if(member) {
          tracker.track(message.guild.id, member.id, "chesscom", args[1], message);
        } else {
          message.channel.send("Invalid user mention given.")
          .catch((e) => console.log(JSON.stringify(e)));
        }
      } else {
        senderrormessage(message.channel, "Invalid user given.")
      }
    } else {
      message.channel.send("Wrong amount of parameters.")
      .catch((e) => console.log(JSON.stringify(e)));
    }
    return;
  }
  /*
  if(command === "list") {
    if(args.length === 0) {
      let leaderboard = new LeaderboardConstructor({});
      let list = leaderboard.getList(getNick);
      list.embed.color = guildconfig.colors.ratings;
      message.channel.send(list).catch((e) => console.log(JSON.stringify(e)));
    } else if(args.length === 1) {
      //Page or type
      let val = args[0].toLowerCase();
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
          list.embed.color = guildconfig.colors.ratings;
          message.channel.send(list).catch((e) => console.log(JSON.stringify(e)));
        }
      } else {
        let leaderboard = new LeaderboardConstructor({
          "type": capitalise(val)
        });
        let list = leaderboard.getList(getNick);
        list.embed.color = guildconfig.colors.ratings;
        message.channel.send(list).catch((e) => console.log(JSON.stringify(e)));
      }
    } else if(args.length === 2) {
      //Page and type
      let type = args[0].toLowerCase();
      let page = parseInt(args[1]);
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
      list.embed.color = guildconfig.colors.ratings;
      message.channel.send(list).catch((e) => console.log(JSON.stringify(e)));
    }
    return;
  }

  if(command === "myrank") {
    if(args.length === 0) {
      let leaderboard = new LeaderboardConstructor({});
      let rank = leaderboard.getRank(getNick, message.member.id);
      if(rank.embed) {
        rank.embed.color = guildconfig.colors.ratings;
      }
      message.channel.send(rank).catch((e) => console.log(JSON.stringify(e)));
    }
    return;
  } */

};

function removesource(message, args, command, argument) {
  if(args.length === 1) {
    let source = args[0].toLowerCase().replace(".","");
    tracker.remove(message.guild.id, source, message.member.id, message);
  } else
  if(args.length === 2) {
    let source = args[0].toLowerCase().replace(".", "");
    let user = getuser(args[1])
    if(!user) return;
    if(source === "chesscom" || source === "lichess") {
      tracker.removeByUser(message.guild.id, source, user, message);
    } else {
      message.channel.send("Bad second parameter (source).")
      .catch((e) => console.log(JSON.stringify(e)));
    };
  } else if(args.length === 0) {
    let dbuser = getdbuserfromuser(message.author);
    let count = 0
    var source;
    for(let i = 0; i < config.sources.length; i++) {
      if(dbuser[config.sources[i][1]]) {
          count++;
          source = config.sources[i][1];
      }
    };
    if(count === 0) {
      senderrormessage(message.channel, "No tracking entry found to remove.");
    } else
    if(count === 1) {
      tracker.remove(message.guild.id, source, message.member.id, message);
    } else
    if(count > 1) {
      senderrormessage(message.channel, "Please specify a source to remove.")
    };
  return;
  }
};

function checker(message, args, argument) {
  guildconfig = DataManager.getData(`./guildconfig.json`);
  for(let i = 0; i < guildconfig.er.length; i++) {
    let trigger = guildconfig.er[i]
    if(trigger[2] === true) {
      if(message.content.toLowerCase().includes(trigger[0].toLowerCase())) {
        let emoji = getemojifromname(trigger[1]);
        if(!emoji) return;
        message.react(emoji.id);
      }
    } else 
    if(trigger[2] === false) {
      if(args) {
        for(let i = 0; i < args.length; i++) {
          if(args[i].toLowerCase() === trigger[0].toLowerCase()) {
            let emoji = getemojifromname(trigger[1]);
            if(!emoji) return;
            message.react(emoji.id);
            break;
          }
        }
      } else {
        if(message.content.toLowerCase() === trigger[0].toLowerCase()) {
          let emoji = getemojifromname(trigger[1]);
          if(!emoji) return;
          message.react(emoji.id);
        }
      }
    }
  }
}

function redditlinks(message, args, argument) {
  for(let i = 0;i < args.length; i++) {
    if(args[i].startsWith("/r/")) {
      clearvar()
      args[i] = args[i].replace(/[.,#!$%\^&;:{}<>=-_`~()]/g,"");
      embedoutput.description = `[${args[i]}](http://www.reddit.com${args[i]})`;
      embedsender (message.channel, embedoutput)
    } else
    if(args[i].startsWith("r/")) {
      clearvar()
      args[i] = args[i].replace(/[.,#!$%\^&;:{}=-_`~()]/g,"");
      embedoutput.description = `[/${args[i]}](http://www.reddit.com/${args[i]})`;
      embedsender (message.channel, embedoutput)
    }
  }
};

function triviareaction(message) {
  var payoutoptions = [6,4,2,0];
  var claimoptions = [null,17,13,11,8,5,0];
      triviagame = {};
      args = [];
      name = [];
      payoutmsg = [];
      payoutaggregate = "";

  if(!message.author.bot) {
    args = message.content.split("\n");
    if(args[0] == undefined || args[1] == undefined || args[2] == undefined) return;
    triviagame.header = args[0];
    triviagame.title = args[1];
    args.splice(0, 2);
  } else {
    triviagame.header = message.embeds[0].author.name;
    triviagame.title = message.embeds[0].title;
    triviagame.description = message.embeds[0].description;
    args = triviagame.description.split("\n");
    };

  // give messages output

  if(triviagame.title !== "Trivia Game Ended" && triviagame.title !== "Final Results") return;
  for(let i = 0; i < args.length; i++) {
    name[i] = args[i].split("*").join("").split(/ +/g).shift();
  };
  if(name[0] == "No" || name.length < 1) return;
  if(name.length > 6) {name.length = 6};
  name.ceiling = Math.ceil(0.5 + name.length/2);

  for(let i = 0; i < name.ceiling; i++) {
    let payout = (parseInt(name.length) + parseInt(payoutoptions[i]) - 5) + "";
    payoutmsg[i] = `.give ` + payout + ` **` + name[i] + `**`;
    }
  if(name.length === 6) {payoutmsg[0] = `.give 8 **` + name[0] + `**`}
  payoutmsg.push(`.give ${claimoptions[name.length]} **housebank#5970**`);

  for(let i = 0; i < name.ceiling + 1;i++) {
    payoutaggregate +=  payoutmsg[i] + (i < payoutmsg.length -1 ? `\n` : ``)}
  if(name.length < 2) {
    payoutaggregate = `.give 17 **housebank#5970**`
  };

  clearvar()
  embedoutput.title = `House Trivia ${name.length}-player Game`,
  embedoutput.description = payoutaggregate,
  embedoutput.footer = embedfooter (`Please remember to check for ties.`)
  embedsender (message.channel, embedoutput);
}

function clearvar () {
  embedoutput = {};
};

// 'get' based functions

function checkowner(member) {
  let ownerboolean = false;
  for(let i = 0; i < config.ownerID.length; i++) {
    if(member.id === config.ownerID[i]) {
      ownerboolean = true;
    };
  };
  return ownerboolean;
};

function checkrole (member, rolename) {
  let role = getrolefromname(rolename)
  return (member.roles.has(role.id));
};

function getchannelfromname(channelname) {
  if(!((typeof channelname) == "string")) return;
  let channel = guild.channels.find(channel => channelname.toLowerCase() == channel.name.toLowerCase())
  if(channel == null) {console.log("No channel found!")};
  return channel;
};

function getrolefromname(rolename) {
  if(!((typeof rolename) == "string")) return;
  let role = guild.roles.find(role => rolename.toLowerCase() == role.name.toLowerCase())
  if(role == null) {console.log("No role found!")};
  return role;
};

function pingrole(channel, rolename) {
  let role = getrolefromname(rolename) ? getrolefromname(rolename) : rolename;
  channel.send(role + "");
};

function getuser(searchstring, exactmode) {
  if(searchstring.length < 3) {
    return null
  } else {
    var user = getuserfromid (searchstring);
    if(user == null) {var user = getuserfromusername (searchstring, exactmode)};
    if(user == null) {var user = getuserfromtag (searchstring)};
    if(user == null) {var user = getuserfromnickname (searchstring, exactmode)};
    return user;
  }
};

function getuserfromid (snowflake) {
  if(snowflake.startsWith (`<@!`) && snowflake.endsWith (`>`)) {snowflake = snowflake.slice(3, snowflake.length -1)};
  if(snowflake.startsWith (`<@`) && snowflake.endsWith (`>`)) {snowflake = snowflake.slice(2, snowflake.length -1)};
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
  if(member == null) {return member} else {return member.user};
};

function getmemberfromuser (user) {
  let member = guild.members.find(member => user.id == member.id)
  if(member == null) {return} else {return member};
};

function getemojifromname (name) {
  let emoji = client.emojis.find("name", name);
  return emoji;
};

function messagecount (message, user, update) {

  user ? user = user : user = message.author;
  let dbuser = getdbuserfromuser (user);
  if(dbuser == undefined) return;
  clearvar()
  embedoutput.description = update ? `Message count for **${user.tag}** is now **${dbuser.messages.toLocaleString()}** messages.` : `**${user.tag}** has sent **${dbuser.messages.toLocaleString()}** messages.`;
  embedsender (message.channel, embedoutput);
  embedoutput = {};
  
};

function getdbuserfromuser (user) {
  if(!user) return;
  let tally = DataManager.getData();
  let dbuser = tally.find(dbuser => dbuser.id == user.id);
  if(dbuser == null) {
    console.log("No dbuser found, creating one...");
    let newuser = dbtemplate;
    newuser.id = user.id;
    newuser.username = user.tag;
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
  if(!dbuser) return;
  let tally = DataManager.getData();
  return tally.findIndex(index => dbuser.id == index.id)
};

function returnmessagefromid (message, args, command, argument) {
  let channel = message.channel;
  let id = args[0];
  clearvar();
  channel.fetchMessage(id)
    .then(message => {
      let timestamp = getISOtime (message.createdAt);
      if(message.embeds.length !== 0) {
        let embedinput = embedreceiver(message.embeds[0])
        var searchposition;
        embedinput.content = message.content ? message.content.startsWith("On ") && message.content.includes("\, user **") && message.content.includes("** said\:") ? message.content : `On ${timestamp}, user **${message.author.tag}** said:\n\`\`\`${message.content}\`\`\`` : `On ${timestamp}, user **${message.author.tag}** said:`;
        channel.send(embedinput.content, {embed: embedinput})
      } else {
        if(message.content) {
          fetchedmessage = (message.createdTimestamp ? `\nAt ${getISOtime (message.createdTimestamp)}, **${message.author.tag}** said` : "") + ("\`\`\`" + message.content + "\`\`\`");
          clearvar()
          embedoutput.title = "Fetched Message";
          embedoutput.description = fetchedmessage;
          embedsender(channel, embedoutput);
        };
      }
    })
    .catch(console.error);
};

function getmemberroles(member) {
  var rolelist = member.roles.map(role => role.name)
  return rolelist;  
};

function getprofile(user) {
  clearvar();
  let dbuser = getdbuserfromuser(user);
  let dbindex = getdbindexfromdbuser(dbuser);
  let member = getmemberfromuser(user);
  let rolelist = getmemberroles(member);
  rolelist.splice(0, 1);
  let ratinglist = {};
  let userprofile = {};
  let region = "None set.";
  var lastmessage;
  var medal;
  for(let i = 0; i < guildconfig.regions.length; i++) {
    let role = getrolefromname(guildconfig.regions[i]);
    if(checkrole(member, role.name)) {
      region = guildconfig.regions[i];
    };
  };
  for(let i = 0; i < config.sources.length; i++) {
    let source = config.sources[i][1];
    if(dbuser[source]) {
      ratinglist[source] = parsesourceratingdata(dbuser, source);
      userprofile[source] = parsesourceprofiles(dbuser, source);
    };
  };
  let info = fieldhandler([["Age: ", dbuser.age], ["Sex: ", dbuser.sex ? (getemojifromname(dbuser.sex) ? getemojifromname(dbuser.sex) : dbuser.sex) : ""], ["Location: ", dbuser.location], ["Region: ", region]])
  let ids = fieldhandler([["UID: ", "`" + user.id + "`", false], ["Position in Database: ", dbindex]])
  let joined = fieldhandler([["Discord: ", getISOtime(user.createdTimestamp).slice(4, 15)],[`${guild.name}: `, getISOtime(member.joinedTimestamp).slice(4, 15)]])
  let trophies = dbuser.trophy ? fieldhandler(dbuser.trophy, ":trophy: ", true) : "";
  let roles = rolelist ? fieldhandler(rolelist, "") : "" ;
  let modnotes = dbuser.modnotes ? fieldhandler(dbuser.modnotes, "") : "" ;
  if(dbindex === 1) {medal = ":first_place: **First in Database.**"}
  if(dbindex === 2) {medal = ":second_place: **Second in Database.**"}
  if(dbindex === 3) {medal = ":third_place: **Third in Database.**"}
  if(dbuser.lastmessage) {lastmessage = (dbuser.lastmessagedate ? `\nSent at ${getISOtime(dbuser.lastmessagedate)}.` : "") + (dbuser.lastmessage.startsWith("<:") && dbuser.lastmessage.endsWith (">") ? "\n" + dbuser.lastmessage : "\`\`\`" + dbuser.lastmessage + "\`\`\`")};
  embedoutput.author = embedauthor(`Profile for ${user.tag}`, user.bot ? "https://i.imgur.com/9kS9kxb.png" : "")
  embedoutput.description = (dbuser.finger ? "```" + dbuser.finger + "```" : "") + (dbuser.modnotes ? "```diff\n-mod notes\n" + dbuser.modnotes + "```" : "");
  embedoutput.color = member.displayColor;
  embedoutput.thumbnail = embedthumbnail (user.avatarURL)
  if(member.nickname) {addfield("a.k.a.", member.nickname, false)}
  if(info) {addfield((dbuser.modverified ? " " + getemojifromname(dbuser.modverified[0]) : "") + "Info", info, true)}
  addfield(`Joined Date`, joined, info ? true: false);
  addfield("Index", ids, dbuser.messages ? true : false);
  if(dbuser.messages) {addfield("Messages Sent", dbuser.messages.toLocaleString(), true)}
  for(let i = 0; i < config.sources.length; i++) {
  let source = config.sources[i][1];
  if(dbuser[source]) {addfield(`${getemojifromname(source)} ${config.sources[i][0]}`, `${userprofile[source]}\n${ratinglist[source]}`, true)}
  };
  if(dbuser.lastmessage) {addfield("Last Message", lastmessage, false)}
  // addfield ("Roles", roles ? roles : "None", true)
  if(dbuser.trophy || medal) {addfield("House Trophies", (medal ? medal : "") + (trophies && medal ? `\n` : "") + (trophies ? trophies : ""), true)}
  embedoutput.footer = embedfooter("Use !finger to change your finger message.")
  return embedoutput;
  // + \n\u200B
};

// embed section of functions

function embedsender(channel, embed) {
  if(!embed) throw "Failed to define embedoutput."
  channel = channel.channel ? channel.channel : channel;
  embed.color = embed.color ? embed.color : guildconfig.colors.generic;
  channel.send(embed.content, {embed: embed})
  return;
  clearvar()
  .catch ((e) => console.log(JSON.stringify(e)));
  return;
};

function fieldhandler(array, messageconstant, boolean) {
  let string = "";
  if(messageconstant === undefined) {
    for(let i = 0; i < array.length; i++) {
      if(array[i][1] || array[i][1] === 0) {
        string += array[i][2] === false ? array[i][0] + array[i][1] + (i < array.length -1 ? `\n` : `` ) : array[i][0] + "**" + array[i][1] + "**" + (i < array.length -1 ? `\n` : ``);
      }
    }
  } else {
    for(let i = 0; i < array.length; i++) {
      if(array[i]) {
        string += boolean === true ? messageconstant + "**" + array[i] + "**" + (i < array.length -1 ? `\n` : ``) : messageconstant + array[i] + (i < array.length -1 ? `\n` : ``);
      }
    }
  }
  return string;
}

function addfield(name, value, inline) {
  if(!value) return;
  inline = inline ? inline : false;
  if(!embedoutput.fields) {
    embedoutput.fields = [];
    embedoutput.fields[0] = embedfielder(name, value, inline)
  } else {
    embedoutput.fields.push({name, value, inline});
  }
};

function embedaddfield(fields, name, value, inline) {
  if(!fields) {
    fields = [];
    fields[0] = embedfielder(name, value, inline)
  } else {
    fields.push({name, value, inline});
  }
  return fields;
};

function embedfielder(name, value, inline) {
  let embed = {};
  embed.value = {}
  inline = inline ? inline : false;
  embed.field = {
    "name": name,
    "value": value,
    "inline": inline,
  }
  return embed.field;
};

function embedauthor (name, icon_url) {

  let author = {};
  if(name) {author.name = name};
  if(icon_url) {author.icon_url = icon_url};
  return author;

};

function embedthumbnail (link) {

  let thumbnail = {};
  if(link) {thumbnail.url = link};
  return thumbnail

};

function embedimage (link) {

  let image = {};
  if(link) {image.url = link};
  return image;

};

function embedfooter (text, icon_url) {

  let footer = {};
  if(text) {footer.text = text};
  if(icon_url) {footer.icon_url = icon_url};
  return footer

};

function embedreceiver(embed) {

  let embedinput = {};
  let property = ["title", "url", "description", "color", "image", "video", "timestamp"]
  for(let i = 0; i < property.length; i++) {
    if(embed[property[i]]) {embedinput[property[i]] = embed[property[i]]};
  }
  if(embed.author) {
    let name = "";
    let icon_url = "";
    if(embed.author.name) {name = embed.author.name};
    if(embed.author.icon_url) {icon_url = embed.author.icon_url};
    if(name || icon_url) {embedinput.author = embedauthor(name ? name : "", icon_url ? icon_url : "")};
  };
  if(embed.footer) {
    if(embed.footer.text) {var text = embed.footer.text};
    if(embed.footer.icon_url) {var icon_url = embed.footer.icon_url};
    if(text || icon_url) {embedinput.footer = embedfooter(text ? text : "", icon_url ? icon_url : "")};
  };
  if(embed.image) {
    if(embed.image.url) {var url = embed.image.url};
    if(url) {embedinput.image = embedimage(url ? url : "")};
  };
  if(embed.thumbnail) {
    if(embed.thumbnail.url) {var url = embed.thumbnail.url};
    if(url) {embedinput.thumbnail = embedthumbnail(url ? url : "")};
  };
  if(embed.fields) {
    let name = "";
    let value = "";
    let inline = "";
    embedinput.fields = [];
    for(let i = 0; i < embed.fields.length; i++) {
      if(embed.fields[i].name) {name = embed.fields[i].name};
      if(embed.fields[i].value) {value = embed.fields[i].value};
      if(embed.fields[i].inline) {inline = embed.fields[i].inline};
      if(name || value || inline) {
        embedinput.fields[i] = embedfielder(name ? name : "", value ? value : "", inline ? inline: "")
      };
    };
  };
  return embedinput;

};

function cr (message, trigger, reply) {

  const args = message.content.slice(guildconfig.prefixes.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  if(command === trigger) {message.channel.send(reply)};

};

function er (message, command, args) { // emoji reactions service

  let member = getmemberfromuser (message.author);
  if(checkowner(message.author) === false) return;
  if(!checkrole (member, "mods")) return;

  if(command === "aer") {
    let erca = args[2] ? true : false;
    let emoji = getemojifromname(args[1]);
    if(!emoji) {
      senderrormessage (message.channel, "No emoji found!")
    } else {
      guildconfig.er[0] ? guildconfig.er.push([args[0], args[1], erca]) : guildconfig.er[0] = [args[0], args[1], erca];
      DataManager.setData(guildconfig, `./guildconfig.json`);
      guildconfig = DataManager.getData(`./guildconfig.json`);
      let emoji = getemojifromname(args[1]);
      if(!emoji) return;
      message.react(emoji.id);
    }
  } else

  if(command === "uer") {
    let index = guildconfig.er.findIndex(trigger => trigger[0] === args[0]);
    let erca = args[2] || false;
    guildconfig.er[index] = ([args[0], args[1], erca]);
    DataManager.setData(guildconfig, `./guildconfig.json`);
    let emoji = getemojifromname("tick");
    if(!emoji) return;
    message.react(emoji.id);
  } else
  
  if(command === "erca") {
    if(args.length === 0) return;
    let index = guildconfig.er.findIndex(trigger => trigger[0] === args[0]);
    let newerca = !guildconfig.er[index][2]
    guildconfig.er[index] = ([guildconfig.er[index][0], guildconfig.er[index][1], newerca]);
    DataManager.setData(guildconfig, `./guildconfig.json`);
    let emoji = getemojifromname("tick");
    if(!emoji) return;
    message.react(emoji.id);
  } else

  if(command === "der") {
    let index = guildconfig.er.findIndex(trigger => trigger[0] === args[0]);
    console.log(index);
    console.log(guildconfig.er);
    guildconfig.er = guildconfig.er.remove(index);
    console.log(guildconfig.er);
    DataManager.setData(guildconfig, `./guildconfig.json`);
    let emoji = getemojifromname("tick");
    if(!emoji) return;
    message.react(emoji.id);
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
  for(var i = 0; i < 6; i++) {
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
  embedoutput.color = guildconfig.colors.error;
  embedsender (channel, embedoutput);
};

function sendgenericembed(channel, description) {
  clearvar()
  embedoutput.description = description;
  channel = channel.channel ? channel.channel : channel;
  embedsender (channel, embedoutput);
};

function enabletestingmode (message, LAZYbot, bouncer) {
  let user = getuser("LAZYbot", true);
  let channel = getchannelfromname(guildconfig.channels.bot2);
  if(bouncer != "false") {channel.overwritePermissions(bouncerbot, { 'SEND_MESSAGES': false })};
  if(LAZYbot != "false") {channel.overwritePermissions(user, { 'SEND_MESSAGES': false })};
  channel = getchannelfromname(guildconfig.channels.bot);
  if(bouncer != "false") {channel.overwritePermissions(bouncerbot, { 'SEND_MESSAGES': false })};
  if(LAZYbot != "false") {channel.overwritePermissions(user, {
     'SEND_MESSAGES': false,
    })};
  guildconfig.testingmodeboolean = true;
  DataManager.setData(guildconfig, "./guildconfig.json");
};

function disabletestingmode (message, LAZYbot, bouncer) {
  let user = getuser ("LAZYbot", "true");
  let channel = getchannelfromname(guildconfig.channels.bot2);
  if(bouncer != "false") {channel.overwritePermissions(bouncerbot, { 'SEND_MESSAGES': true })}
  if(LAZYbot != "false") {channel.overwritePermissions(user, { 'SEND_MESSAGES': true })}
  channel = getchannelfromname(guildconfig.channels.bot);
  if(bouncer != "false") {channel.overwritePermissions(bouncerbot, { 'SEND_MESSAGES': true })}
  if(LAZYbot != "false") {channel.overwritePermissions(user, {
    'SEND_MESSAGES': true,
  })}
  sendgenericembed (message.channel, `**Testing mode disabled.**`)
  guildconfig.testingmodeboolean = false;
  DataManager.setData(guildconfig, "./guildconfig.json");
};

function backupdb(degree, interval) {
  let tally = DataManager.getData();
  if(tally == undefined) return;
  let time = gettime (interval)
  degree = degree ? degree : "1";
  if((degree !== "1") && (degree !== "2") && (degree !== "3")) {degree = "1"};
  if(interval) {
    setInterval(() => {
      DataManager.setData(tally, `./dbbackup${degree}.json`);
      console.log(`Database backed up to dbbackup${degree} at ${gettime (Date.now())}.`);
      config.backupdb[degree - 1] = getISOtime (Date.now())
      DataManager.setData(config, "./config.json");
    }, interval);
  } else if(!interval) {
      DataManager.setData(tally, `./dbbackup${degree}.json`);
      console.log(`Database backed up to dbbackup${degree} at ${getISOtime (Date.now())}.`);
      config.backupdb[degree - 1] = getISOtime (Date.now())
      DataManager.setData(config, "./config.json");
  }
  return true;
};

function restoredb(degree) {
  degree = degree ? degree : "1";
  let backup = DataManager.getData("./dbbackup1.json")
  DataManager.setData(backup);
  return true;
};

Array.prototype.swap = function(dbindex1, dbindex2) {
  let user = this[dbindex1];
  this[dbindex1] = this[dbindex2];
  this[dbindex2] = user;
  return this;
};

Array.prototype.remove = function(index) {
  if(!index && index !== 0) return;
  if(Array.isArray(index)) {
    index.sort(function(a, b) {
      return b - a;
    })
    for(let i = 0; i < index.length; i++) {;
      this.splice(index[i], 1);
    }
  } else {
    this.splice(index, 1);
  }
  return this;
};

Array.prototype.clean = function() {
  for(let i = 0; i < this.length; i++) {
    if(!this[i]) {
      this.splice(i, 1);
      i--;
    }
  }
  return this;
};

Array.prototype.cleanProperty = function(property) {
  for(let i = 0; i < this.length; i++) {
    if(!this[i].property) {
      this.splice(i, 1);
      i--;
    }
  }
  return this;
};

function onModError(serverID, error) {
  let channel = getchannelfromname(guildconfig.channels.mod);
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

String.prototype.toProperCase = function() {
  let words = this.split(/ +/g);
  let newArray = [];
  for(let i = 0; i < words.length; i++) {
    newArray[i] = words[i][0].toUpperCase() + words[i].slice(1, words[i].length).toLowerCase();
  }
  let newString = newArray.join(" ");
  return newString;
}

Array.prototype.toProperCase = function() {
  let newArray = [];
  for(let i = 0; i < this.length; i++) {
    newArray[i] = this[i].toProperCase();
  }
  return newArray;
}

function onRemoveSuccess(serverID, userID, source, username, message) {
  let channel = message.channel;
  let user = getuser (userID);
  let member = getmemberfromuser (user);
  if(source === "chesscom") {source = "chess.com"};
  clearvar()
  embedoutput.title = `Stopped tracking via !remove command`;
  embedoutput.description = `Unlinked **${user.tag}** from ${source} account **${username}**.`;
  embedoutput.color = guildconfig.colors.ratings;
  embedsender (channel, embedoutput);
  removeRatingRole(serverID, userID);
};

function onTrackSuccess(serverID, userID, source, sourceusername, message) {
  let channel = message.channel
  let user = getuser(userID);
  let member = getmemberfromuser(user);
  let dbuser = getdbuserfromuser(user);
  let sourceratings = source + "ratings";
  let newRole = getrolefromname(guildconfig.roles.beta);
  let unranked = member.roles.find("name", guildconfig.unrankedRoleName);
  if(unranked) {
    member.removeRole(unranked).catch((e) => console.log(JSON.stringify(e)));
  }
  member.addRole(newRole).then(() => {
    let sourceProfileURL = source.toLowerCase().replace(".","") + "ProfileURL";
    let sourceratinglist = parsesourceratingdata(dbuser, source);
    let sourceuserprofile = parsesourceprofiles(dbuser, source);
    clearvar()
    embedoutput.title = `${getemojifromname(source.toLowerCase().replace(".",""))} Linked ${member.user.username} to '${sourceusername}'`
    embedoutput.description = `${sourceuserprofile}\nAdded to the role **${newRole.name}**. Current highest rating is **${dbuser[sourceratings].maxRating}**\n` + sourceratinglist;
    embedoutput.color = guildconfig.colors.ratings;
    embedsender (channel, embedoutput);
  }).catch(function(error) {
    console.log("Error adding new role", error);
  });
};

function onAuthenticatorSuccess(serverID, userID, source, sourceusername, message) {
  return;
};

function onRatingUpdate(serverID, userID, oldData, ratingData, source, username, message) {
  let channel = message.channel
  let user = getuser(userID);
  let member = getmemberfromuser(user);
  let dbuser = getdbuserfromuser(user);
  let sourceratings = source + "ratings";

  let currentRoles = getMemberRatingRoles(member);
  for(let i = 0; i < currentRoles.length; i++) {
    let role = currentRoles[i];
    if(role.name !== newRole.name) {
      member.removeRole(role).catch((e) => console.log(JSON.stringify(e)));
    }
  }
  member.addRole(newRole).then(() => {
    let sourceProfileURL = source.toLowerCase().replace(".","") + "ProfileURL";
    let sourceratinglist = parsesourceratingdata(dbuser, source);
    let sourceuserprofile = parsesourceprofiles(dbuser, source);
    clearvar()
    embedoutput.title = `${getemojifromname(source.toLowerCase().replace(".",""))} Updated ${member.user.username} to '${sourceusername}'`
    embedoutput.description = `${sourceuserprofile}\nAssigned to role **${newRole.name}**. Current highest rating is **${dbuser[sourceratings].maxRating}**\n` + sourceratinglist;
    embedoutput.color = guildconfig.colors.ratings;
    embedsender (channel, embedoutput);
  }).catch(function(error) {
    console.log("Error adding new role", error);
  });
};

function parsesourceratingdata(dbuser, source) {
  var sourceratingData = "";
	let sourcevariants = source + "variants";
	let sourceratings = source + "ratings";
	for(let i = 0; i < config[sourcevariants].length; i++) {
    if(dbuser[source]) {
      let array = config[sourcevariants][i];
      let variant = array[0];
      if(dbuser[sourceratings]) {
        let rating = dbuser[sourceratings][array[1]];
        sourceratingData += rating ? `${variant}: ${rating.toString().endsWith("?") ? "" : "**" }${rating}${rating.toString().endsWith("?") ? "" : "**" } ${i < config[sourcevariants].length -1 ? "\n" : ""}` : "";
      }
    };
  };
  return sourceratingData;
};

function parsesourceprofiles(dbuser, source) {
  var userprofile = "";
  let sourceProfileURL = source + "ProfileURL";
  userprofile = `[${dbuser[source]}](${(config[sourceProfileURL].replace("|", dbuser[source]))})`;
  return userprofile;
};

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
};

function removeRatingRole(serverID, userID) {
  let guild = client.guilds.get(serverID);
  let member = guild.members.get(userID);
  let roles = getMemberRatingRoles(member);
  for(let i = 0; i < roles.length; i++) {
    member.removeRole(roles[i]).catch((e) => console.log(JSON.stringify(e)));
  }
  let unrankedRole = guild.roles.find("name", guildconfig.roles.unranked);
  if(unrankedRole) {
    member.addRole(unrankedRole).catch((e) => console.log(JSON.stringify(e)));
  }
};

function getMemberRatingRoles(member) {
  let foundRoles = [];
  member.roles.some(function(role) {
    let num = parseInt(role.name);
    if(RATINGS.indexOf(num) >= 0) {
      foundRoles.push(role);
    }
  });
  return foundRoles;
};

function getsourcetitle(source) {
	var sourcetitle;
	for(let i = 0; i < config.sources.length; i++) {
		if(config.sources[i][1] === source) {
			sourcetitle = config.sources[i][0];
		}
	}
	return sourcetitle;
};

function getsourcefromtitle(sourcetitle) {
	var source;
	for(let i = 0; i < config.sources.length; i++) {
		if(config.sources[i][0] === source) {
			source = config.sources[i][1];
		}
	}
	return source;
}; 

function getleaderboard(array, inline) {
  let embed = {};
  embed.description = "";
  if(!array[0]) {return embed};
  let bivariateboolean = false;
  let limit = array.length;
  for(let i = 0; i < limit; i++) {
    if(array[i][1] || array[i][1] === 0) {
      bivariateboolean = true;
    }
  }
  for(let i = 0; i < limit; i++) {
    if(bivariateboolean === true) {
      if(array[i][0].length > 17 && inline !== false) {
        array[i][0] = array[i][0].slice(0, 17);
      };
      embed.fields = embedaddfield(embed.fields, `#${i + 1} ${array[i][0]}`, array[i][1], inline === false ? false : true)
    } else
    if(bivariateboolean === false) {
      let bidamounts = "";
      for(let i = 0; i < limit; i++) {
        embed.description += `**#${i}** ${tally[i][0] + (i < 10 ? "\n" : "")}`;
      }
    }
  };
  return embed;
}
