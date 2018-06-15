const Discord = require("discord.js");
const http = require('http');
const express = require('express');
const request = require('request');
const client = new Discord.Client();
const EventEmitter = require('events');
class MyEmitter extends EventEmitter {}
const myEmitter = new MyEmitter();
const app = express();
//const tesseract = require('tesseract.js');

require("./guildconfig.json");
require ("./config.json");
require ("./package.json");

const DataManagerConstructor = require("./datamanager.js");
const DataManager = new DataManagerConstructor("./db.json", "./guildconfig.json");
const LeaderboardConstructor = require("./leaderboard.js");
const TrackerConstructor = require("./tracker.js");
const tracker = new TrackerConstructor({
	"onTrackSuccess": onTrackSuccess, 
	"onRemoveSuccess": onRemoveSuccess, 
	"onRatingUpdate": onRatingUpdate, 
	"onError": onTrackError, 
  "onModError": onModError,
  "getdbuserfromuser": getdbuserfromuser,
  "getdbindexfromdbuser": getdbindexfromdbuser,
  "getdbindexfromid": getdbindexfromid,
  "getdbuserfromusername": getdbuserfromusername,
  "getsourcetitle": getsourcetitle,
  "getsourcefromtitle": getsourcefromtitle
});
const leaderboard = new LeaderboardConstructor({
  "getdbuserfromuser": getdbuserfromuser,
  "onRatingUpdate": onRatingUpdate,
  "onError": onTrackError
});
const messageSplitRegExp = /[^\s]+/gi;
const FEN_API_URL = "https://www.chess.com/dynboard";
const LICHESS_ANALYSIS_FEN_URL = "https://lichess.org/analysis?fen=";
const LICHESS_CRAZYHOUSE_FEN_URL = "https://lichess.org/analysis/crazyhouse/";
var bouncerbot;
var nadekobot;
var harmonbot;
var owner;
var reboot;
let embedoutput = {};
let partymode = {};
let puzzles = [];
let notify = [];
let bcpboolean = false;
let [customfunction1, customfunction2, customfunction3, customfunction4, customfunction5] = ["", "", "", "", ""];
let newarrivalsboolean = false;
let config = DataManager.getData("./config.json");
let packagestuff = DataManager.getData("./package.json");

//console startup section

client.on("ready", () => {
  reboot = Date.now();
  let guildconfig = DataManager.getData(`./guildconfig.json`);
  let guilds = Object.keys(guildconfig);
  for(let i = 0; i < guilds.length; i++) {
    let guild = client.guilds.get(guilds[i])
    if(guild) {
      console.log(`Loaded client server ${guild.name} in ${Date.now() - reboot}ms`)
    }
  }
  bouncerbot = client.users.get(config.ids.bouncer);
  console.log(bouncerbot ? `Noticed bot user ${bouncerbot.tag} in ${Date.now() - reboot}ms` : `Bouncer#8585 is not online!`);
  nadekobot = client.users.get(config.ids.nadeko);
  console.log(nadekobot ? `Noticed bot user ${nadekobot.tag} in ${Date.now() - reboot}ms` : `Nadeko#6685 is not online!`);
  harmonbot = client.users.get(config.ids.harmon);
  console.log(harmonbot ? `Noticed bot user ${harmonbot.tag} in ${Date.now() - reboot}ms` : `Harmonbot#4049 is not online!`);
  for(let i = 0; i < config.ids.owner.length; i++) {
    let owner = client.users.get(config.ids.owner[i])
    if(owner) console.log(`Noticed bot owner ${owner.tag} in ${Date.now() - reboot}ms`);
  };
  if(client.user.id === config.ids.bot) {
    client.user.setPresence({
      game: {
        name: "bit.ly/LAZYbot",
        url: "http://bit.ly/LAZYbot",
        type: "playing"
      }
    })
  };
  console.log("bleep bloop! It's showtime.");
  survey();
  setInterval(function () {
    checkbounceronline();
  }, 600000)
  setInterval(function () {
    survey();
  }, 3600000);
});

app.get("/", (request, response) => { //pinging glitch.com
  response.sendStatus(200);
});
app.listen(process.env.PORT);
setInterval(() => {
  http.get(`http://${process.env.lazybot || "houselazybot"}.glitch.me/`); //pinging glitch.com
}, 280000);
backupdb("1", 3600000); //backupdb
backupdb("2", 7200000);
backupdb("3", 14400000);

client.login(process.env.TOKEN ? process.env.TOKEN : config.token); //token

myEmitter.on("event", () => console.log("test"));

client.on("message", (message) => { //command handler
  if(message.author.id === client.user.id) return;
  if(message.content) message.content = message.content.replace(/[\u200B-\u200D\uFEFF]/g, '');
  if(message.channel.type === "dm" || message.channel.type === "group") {
    if(message.author.bot) return;
    DMfunctions(message);
    return;
  };
  let server = DataManager.getGuildData(message.guild.id);
  if(executeshadowban(message, server)) return;
  tracker.messagelogger(message, server);
  if(message.content.length === 1) return;
  if(customfunction1) eval(customfunction1);
  if(customfunction2) eval(customfunction2);
  if(customfunction3) eval(customfunction3);
  if(customfunction4) eval(customfunction4);
  if(customfunction5) eval(customfunction5);
  if(message.content.startsWith(server.prefixes.nadeko) && !message.author.bot) {
    let args = message.content.slice(server.prefixes.nadeko.length).match(messageSplitRegExp);
    let command = args.shift().toLowerCase();
    let argument = message.content.slice(command.length + server.prefixes.nadeko.length).trim();
    nadekoprefixfunctions(message, args, command, argument, server);
  } else
  if(message.content.startsWith(server.prefixes.prefix) && !message.author.bot) {
    let args = message.content.slice(server.prefixes.prefix.length).match(messageSplitRegExp);
    let command = args.shift().toLowerCase();
    let argument = message.content.slice(command.length + server.prefixes.nadeko.length).trim();
    prefixfunctions(message, args, command, argument, server);
  } else
  if(!message.content.startsWith(server.prefixes.prefix) && !message.content.startsWith(server.prefixes.nadeko)) {
    if(message.author.bot) {
      botfunctions(message);
    } else
    if(!message.author.bot) {
      let args = message.content.match(messageSplitRegExp);
      let argument = message.content.trim();
      nonprefixfunctions(message, args, argument, server);
    }
  } return;
});

client.on("guildMemberRemove", (member) => { //leave message
  clearvar();
  let server = DataManager.getGuildData(member.guild.id);
  let channel = getchannelfromname(member.guild, server.channels.leave);
  let dbuser = getdbuserfromuser(member.user);
  embedoutput.description = `**${member.user.tag}** has left **${member.guild.name}**. Had **${dbuser.messages ? dbuser.messages.toLocaleString() : 0}** messages.`;
  embedoutput.color = 15406156;
  if(dbuser.lastmessage) {
    embedoutput.fields = [];
    addfield("Last Message", "```" + dbuser.lastmessage + "```")
  };
  embedsender(channel, embedoutput);
});

client.on("messageUpdate", (oldMessage, newMessage) => {
  if(newMessage.author.bot) return;
  let editlogger = {};
  editlogger.title = `:pencil: Message updated in #${oldMessage.channel.name}`;
  editlogger.description = oldMessage.author.tag;
  editlogger.fields = embedfielder(editlogger.fields, `Old message`, oldMessage.content, false);
  editlogger.fields = embedfielder(editlogger.fields, `New message`, newMessage.content, false);
  editlogger.fields = embedfielder(editlogger.fields, `User ID`, newMessage.author.id, false);
  editlogger.footer = embedfooter(getISOtime(Date.now()));
  embedsender(getchannelfromname(newMessage.guild, "comment-log"), editlogger);
  let server = DataManager.getGuildData(newMessage.guild.id);
  if(newMessage.content.length === 1) return;
  if(newMessage.content.startsWith(server.prefixes.nadeko) && !newMessage.author.bot) {
    let args = newMessage.content.slice(server.prefixes.nadeko.length).match(messageSplitRegExp);
    let command = args.shift().toLowerCase();
    let argument = newMessage.content.slice(command.length + server.prefixes.nadeko.length).trim();
    nadekoprefixfunctions(newMessage, args, command, argument, server);
  } else
  if(newMessage.content.startsWith(server.prefixes.prefix) && !newMessage.author.bot) {
    let args = newMessage.content.slice(server.prefixes.prefix.length).match(messageSplitRegExp);
    let command = args.shift().toLowerCase();
    let argument = newMessage.content.slice(command.length + server.prefixes.nadeko.length).trim();
    prefixfunctions(newMessage, args, command, argument, server);
  } else
  if(!newMessage.content.startsWith(server.prefixes.prefix) && !newMessage.content.startsWith(server.prefixes.nadeko)) nonprefixfunctions(newMessage, server);
  return;
});

client.on("messageDelete", (message) => {
  let server = DataManager.getGuildData(message.guild.id);
  if(message.author.bot) return;
  if(message.content.startsWith(server.prefixes.prefix) || message.content.startsWith(server.prefixes.nadeko)) return;
  let deletelogger = {};
  deletelogger.title = `:wastebasket: Message deleted in #${message.channel.name}`;
  deletelogger.description = message.author.tag;
  deletelogger.fields = [];
  embedfielder(deletelogger.fields, `Content`, message.content, false);
  embedfielder(deletelogger.fields, `User ID`, message.author.id, false);
  deletelogger.footer = embedfooter(getISOtime(Date.now()));
  embedsender(getchannelfromname(message.guild, "comment-log"), deletelogger);
});

client.on("presenceUpdate", (oldMember, newMember) => {
  if(oldMember.user.bot || oldMember.guild.id !== config.houseid) return;
  if((!oldMember.presence.game && newMember.presence.game && newMember.presence.game.streaming) || (oldMember.presence.game && !oldMember.presence.game.streaming && newMember.presence.game && newMember.presence.game.streaming)) {
    console.log(oldMember.presence, newMember.presence);
    console.log(oldMember.user.tag);
    let streamersbox = getchannelfromname(oldMember.guild, "Streamers Box");
    let server = DataManager.getGuildData(oldMember.guild.id);
    for(let i = 0; i < server.regions.length; i++) {
      streamersbox.overwritePermissions(getrolefromname(newMember.guild, server.regions[i]), {
        VIEW_CHANNEL: true
      })
    }
  } else
  if((oldMember.presence.game && oldMember.presence.game.url && !newMember.presence.game) || (oldMember.presence.game && oldMember.presence.game.url && newMember.presence.game && newMember.presence.game.url)) {
    console.log(oldMember.presence, newMember.presence);
    console.log(oldMember.user.tag);
    let streamersbox = getchannelfromname(oldMember.guild, "Streamers Box");
    let server = DataManager.getGuildData(oldMember.guild.id);
    console.log(server.regions);
    for(let i = 0; i < server.regions.length; i++) {
      streamersbox.overwritePermissions(getrolefromname(newMember.guild, server.regions[i]), {
        VIEW_CHANNEL: false
      })
    }
  }
});

function nadekoprefixfunctions(message, args, command, argument, server) {

  if(command === "typeadd") typeadd(message, args, command, argument);

  if(command === "newpuzzle") {
    let imageurl = "";
    if(message.attachments.first()) {
      imageurl = message.attachments.first().url
    } else
    if(/(https?:\/\/[\S\.]+\.\w+\/?)\s?/gi.exec(argument)) {
        imageurl = /(https?:\/\/[\S\.]+\.\w+\/?)\s?/gi.exec(argument)[1];
        argument = argument.split(imageurl).join(``);
    } else {
      senderrormessage(message.channel, `Incorrect format! No link or image provided.`)
      return;
    }
    let puzzle = {
      "authorid" : message.author.id,
      "title" : `${message.author.tag} #${message.channel.name}`,
      "description" : argument ? argument : "\u200b",
      "image" : embedimage(imageurl)
    }
    if(!puzzles[0]) {
      puzzles[0] = puzzle;
    } else {
      puzzles.push(puzzle)
    }
    clearvar();
    embedoutput = puzzle;
    embedoutput.content = getrolefromname(message.guild, "puzzles") + "";
    embedsender(message.channel, embedoutput);
  } else

  if(command === "puzzle") {
    if(!args[0]) {
      let array = [];
      for(let i = 0; i < puzzles.length; i++) {
        array[i] = [];
        array[i][0] = puzzles[i].title;
        array[i][1] = puzzles[i].description;
      };
      embedoutput = {};
      embedoutput = getleaderboard(array, 0, false);
      embedoutput.title = `Active Puzzles. Please choose which puzzle you would like to view.`;
      embedoutput.color = config.colors.generic;
      message.channel.send({embed: embedoutput})
      .then(originalmessage => {
        originalmessage.delete(10000)
      })
      .catch(`Some error somewhere.`);
      let filter = msg => msg.author.id === message.author.id && !isNaN(Number(msg.content));
      message.channel.awaitMessages(filter, {
        max: 1,
        time: 30000,
        errors: ['time'],
      })
      .then((collected) => {
        let puzzleindex = Number(collected.first().content) - 1;
        let puzzle = puzzles[puzzleindex];
        if(!puzzle) {
          senderrormessage(message.channel, "No puzzle found!");
          return;
        } else {
          clearvar();
          embedoutput = puzzle;
          delete embedoutput.content;
          embedsender(message.channel, embedoutput);
          message.delete();
          collected.first().delete();
        }
      })
    } else {
      let puzzleindex = Number(args[0]) - 1;
      let puzzle = puzzles[puzzleindex];
      if(!puzzle) {
        senderrormessage(message.channel, "No puzzle found!");
        return;
      } else {
        clearvar();
        embedoutput = puzzle;
        delete embedoutput.content;
        embedsender(message.channel, embedoutput);
        message.delete();
      }
    }
  } else

  if(command === "closepuzzle") {
    if(!args[0]) return;
    let puzzleindex = Number(args[0]) - 1;
    let puzzle = puzzles[puzzleindex];
    if(!puzzle) {
      senderrormessage(message.channel, "No puzzle found!");
      return;
    } else 
    if(puzzle.authorid !== message.author.id) {
      senderrormessage(message.channel, "You did not create this puzzle!");
      return;
    } else {
      clearvar();
      puzzles.remove(puzzleindex);
      sendgenericembed(message.channel, `**${message.author.tag}** successfully closed puzzle number ${puzzleindex + 1}.`)
      message.delete();
    }
  } else

  if(command === "puzzles") {
    let array = [];
    for(let i = 0; i < puzzles.length; i++) {
      array[i] = [];
      array[i][0] = puzzles[i].title;
      array[i][1] = puzzles[i].description;
    };
    embedoutput = getleaderboard(array, 0, false);
    embedoutput.title = `Active Puzzles. Use .puzzle to view a puzzle.`
    embedsender(message.channel, embedoutput);
    message.delete();
  };

  if(command === "dblb") {
    embedoutput = dbpositions(message.guild);
    embedsender(message.channel, embedoutput)
  } else

  if(command === "..") {
    let guidename = args[0];
    let embeds = DataManager.getData("./embeds.json");
    if(embeds.guides[guidename]) {
      let object = embeds.guides[guidename];
      paginator(message, "getguidefrompage(message, page)", 180000, object.length)
      return;
    } else
    if(embeds.utility[guidename]) {
      let object = embeds.guides[guidename];
      message.channel.send({embed: object});
    }
    return;
  } else

  if(command === "ticket") tickethandler(message, args, command, argument, server);

  if(command === "tickets") {
    if(!checkrole(getmemberfromuser(message.guild, message.author), "mods")) return;
    embedoutput = tickets(message.guild);
    embedsender(message.channel, embedoutput);
    message.delete(1000);
  } else

  if(command === "bidamount") bidamount(message, args, command, argument, server);

  if(command === "give") {
    if((isNaN(args[0]) && args[0] !== "all") || !args[1]) return;
    let user = getuser(message.guild, args[1]);
    if(!user) return;
    if(checkowner(user) && args[2] && args[2].toLowerCase() === "database") {
      databasepositionhandler(message, args, command, argument, server);
    };
    if((checkowner(user) || checkrole(getmemberfromuser(message.guild, message.author), "mods") || message.author.id === getuser(message.guild, "housebank").id) && message.channel.id === getchannelfromname(message.guild, "transaction-log").id || message.channel.id === getchannelfromname(message.guild, "spam").id) {
      ticketgivehandler(message, args, command, argument, user, server);
    }
  } else

  if(command === "iam") {
    for(let i = 0; i < config.sources.length; i++) {
      if(args.length > 0) {
        if(args[0].replace(".","").toLowerCase() === config.sources[i][1]) {
          command = args[0].replace(".","").toLowerCase();
          args.splice(0, 1);
          argument = argument.slice(command.length).trim();
          botfunctions(message, args, command, argument, server)
        }
      }
    }
  } else

  if(command === "iamn" || command === "iamnot") {
    if(args.length > 0) {
      command = "remove";
      removesource(message, args, command, argument, server)
    };
  } else

  if(command === "notify") {
    if(!checkrole(getmemberfromuser(message.guild, message.author), "Bronze")) return;
    for(let i = 0; i < notify.length; i++) {
      if(notify[i][0] === message.author.id && Date.now() - notify[i][1] < 3600000) {
        senderrormessage(message.channel, `You're using that command too frequently.\nPlease wait **${Math.ceil((3600000 - (Date.now() - notify[i][1]))/60000)}** minutes.`);
        return;
      }
    }
    let link = args[0]
    let ETA = argument.slice(args[0].length, argument.length).trim();
    if(ETA) console.log("ETA is " + ETA);
    if(link.match(/(lichess.org)|(chess\.com)|(bughousetest\.com)/g)) {
      let tournamentembed = {};
      tournamentembed.content = "@here";
      tournamentembed.title = "Tournament Starting!";
      tournamentembed.description = `Greeetings ${message.channel}. You have been invited to join a tournament by **${message.author.tag}**.${ETA ? ` Tournament starts in ${ETA}!` : " Join now!"}\n${link}`;
      embedsender(message.channel, tournamentembed);      
      console.log(`${message.author.username} has sent out a ping for ${link}.`);
      if(!notify[0]) {
        notify[0] = [message.author.id, Date.now()];
      } else notify.push([message.author.id, Date.now()])
    };
  } else

  if(command === "setnadekoprefix") { // change nadekoprefix
    if(!checkowner(message.author)) return;
    let newPrefix = args[0];  
    server.prefixes.nadeko = newPrefix
    DataManager.setGuildData(server);
    sendgenericembed(message.channel, `**${message.author.tag}** has updated the Nadeko-Integration prefix on **${message.guild.name}** to **${newPrefix}** !`);
    console.log(`${message.author.username} [${message.author.id}] has updated NadekoPrefix to ${newPrefix}`);
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
    if(isNaN(decimalodds)) return;
    clearvar();
    embedoutput.title = "Decimal to US Odds";
    embedoutput.color = 431075;
    if(decimalodds < 1) {embedoutput.description = "Error: Decimal odds must be greater than or equal to 1."};
    if(1 <= decimalodds < 2) {embedoutput.description = (-100/(decimalodds-1)).toFixed(0).toString()};
    if(2 < decimalodds) {embedoutput.description = "+" + (100*(decimalodds-1)).toFixed(0).toString()};
    embedsender(message.channel, embedoutput);
  } else

  if(command === "ustodecimal") {
    let usodds = Number(args[0]);
    if(isNaN(usodds)) return;
    clearvar();
    embedoutput.title = "US to Decimal Odds";
    embedoutput.color = 16738560;
    if(usodds < 0) {embedoutput.description = (1 - 100/usodds).toFixed(1)};
    if(usodds > 0) {embedoutput.description = (1 + usodds/100).toFixed(1)};
    embedsender(message.channel, embedoutput);
  } else
  
  if(command === "fetch") returnmessagefromid(message, args, command, argument, server);

  if(command === "fb") { //fakebanning
    if(!args[0] || !checkowner(message.author)) return;
    clearvar ();
    let user = getuser(message.guild, args[0], true);
    let member = getmemberfromuser(message.guild, user);
    embedoutput.title = "⛔️ User Banned";
    embedoutput.fields = [];
    addfield("Username", user.tag, true);
    addfield("ID", user.id, true);
    embedsender(message.channel, embedoutput);
    let role = getrolefromname(message.guild, server.roles.muted)
    if(checkrole(member, role.name)) return;
    member.addRole(role);
  } else

  if((command === "botcontingencyplan" || command === "bcp")) {
    if(!checkrole(message.member, "mods")) return;
    let role = getrolefromname(message.guild, server.roles.bot);
    getmemberfromuser(message.guild, nadekobot).removeRole(role);
    if(!checkrole(getmemberfromuser(message.guild, nadekobot), role.name) || args[0] === "enable") {
      getmemberfromuser(message.guild, nadekobot).addRole(role);
      sendgenericembed (message.channel, `**Bot Contingency Plan enabled.**`)
      bcpboolean = true;
    } else
    if(checkrole(getmemberfromuser(message.guild, nadekobot), role.name) || args[0] === "disable") {
      getmemberfromuser(message.guild, nadekobot).removeRole(role);
      sendgenericembed (message.channel, `**Bot Contingency Plan disabled.**`)
      bcpboolean = false;
    };
  } else

  if((command === "testingmode") || (command === "tm")) {
    
    let author = message.author;
    let member = getmemberfromuser(message.guild, author);
    if(!checkrole(member, "dev")) return;
    if(!server.testingmodeboolean && client.user.id === config.ids.betabot) {
      enabletestingmode(server, message, args[0], args[1])
      sendgenericembed(message.channel, `**Testing mode enabled.**`)
    } else
    if(server.testingmodeboolean) {
      disabletestingmode(server, message, args[0], args[1])
    };
  } else

  if(command === "timely") {
    if(!config.testingmodeboolean) return;
    senderrormessage(message.channel, "Testing mode is enabled, `.timely` cannot be used in this channel.")
  };

};

function prefixfunctions(message, args, command, argument, server) {

  if(command === "title" && message.guild.id === config.houseid && checkrole(getmemberfromuser(message.guild, message.author), "mods")) chesstitle(message, args, command, argument, server);
  /*
  if(command === "tesseract" && !!message.attachments.first()) {
    let streambuffers = require('stream-buffers');
    let myWritableStreamBuffer = new streambuffers.WritableStreamBuffer({
      initialSize: (100 * 1024),   // start at 100 kilobytes.
      incrementAmount: (10 * 1024) // grow by 10 kilobytes each time buffer overflows.
    });
    let url = message.attachments.first().url;
    request(message.attachments.first().url).pipe(myWritableStreamBuffer)
    .on('close', function() {
      console.log(url);
      tesseract.recognize(myWritableStreamBuffer)
      .progress(function(p) {
        console.log('progress', p)
      })
      .catch(err => console.error(err))
      .then(function(result) {
        console.log(result)
        process.exit(0)
      });
    });
    return;
  };*/

  if(command === "eval" && checkowner(message.author)) {
    if(argument.startsWith("```") &&argument.endsWith("```")) {
      argument = argument.slice(args[0] === "```js" ? 5 : 3, -3).trim();
      console.log(argument);
      try {
        let evaled = eval(argument) || "";
        if(evaled) evaled = require("util").inspect(evaled);
        console.log(evaled);
      } catch (err) {
        console.log(err);
      }
      return;
    } else {
      senderrormessage(message.channel, `Incorrect formatting! Use a code block! `)
    };
  } else

  if(command === "myrank" || command === "getrank") {
    let member = getmemberfromuser(message.guild, message.author);
    if(args.length === 1 && command === "getrank" && checkrole(member, "mods")) {
      member = getmemberfromuser(message.guild, getuser(message.guild, args[0]));
    };
    if(!member) return;
    leaderboard.getRank(message, member);
  } else

  if(command === "help") {
    if(args.length === 1) {
      clearvar();
      embedoutput.title = "Rating Commands " + getemojifromname("lichess") + " " + getemojifromname("chesscom");
      embedoutput.color = server.colors.ratings;
      addfield("!lichess [lichess.org user]", "Links you to Lichess user. Defaults to your Discord username if no profile user.");
      addfield("!chesscom [chess.com user]", "Links you to Chess.com user. Defaults to your Discord username if no profile user.");
      addfield("!remove [chesscom | lichess]", "Removes your profile from the rating tracker.");
      addfield("!update", "Queues your profile to be automatically updated.");
    //addfield("!list [variant] [page]", "Show current leaderboard. [variant] and [page] number optional.");
    //addfield("!MyRank", "Displays your current rank.");
      addfield("!ratinghelp", "Lists commands for configuring rating on profile.");
      embedsender(message.channel, embedoutput)
    }
  } else

  if(command === "remove") {
    removesource(message, args, command, argument, server)
  } else

  if(command === "update") {
    let user = args[0] ? getuser(message.guild, args[0]) : message.author;
    if(!user) return;
    tracker.updateUser(message, user)
    // tracker.queueForceUpdate(message.member.id);
    // message.channel.send("Queued for update.")
    // .catch((e) => console.log(JSON.stringify(e)));
  } else

  if(command === "lichess") {
    if(args.length === 1 || args.length === 0) {
      //Adding sender to tracking
      tracker.track(message.guild.id, message.author, "lichess", args[0] ? args[0] : message.author.username, message)
    } else
    if(args.length === 2) {
      if(canManageRoles(message.member)) {
        let user = getuser(message.guild, args[0])
        if(user) {
          tracker.track(message.guild.id, user, "lichess", args[1], message);
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
  } else

  if(command.replace(".","") === "bughousetestcom" || command === "bughousetest") {
    if(args.length === 1 || args.length === 0) {
      tracker.track(message.guild.id, message.author, "bughousetest", args[0] ? args[0] : message.author.username, message)
    } else
    if(args.length === 2) {
      if(canManageRoles(message.member)) {
        let user = getuser(message.guild, args[0])
        if(user) {
          tracker.track(message.guild.id, user, "bughousetest", args[1], message);
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
  } else

  if(command.replace(".","") === "chesscom") {
    if(args.length === 1 || args.length === 0) {
      //Adding sender to tracking
      tracker.track(message.guild.id, message.author, "chesscom", args[0] ? args[0] : message.author.username, message);
    } else
    if(args.length === 2) {
      if(canManageRoles(message.member)) {
        let user = getuser(message.guild, args[0]);
        if(!user) return;
        let member = getmemberfromuser(message.guild, user);
        if(member) {
          tracker.track(message.guild.id, user, "chesscom", args[1], message);
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
  } else
  
  if(command === "leaderboard" || command === "lb") {
    paginator(message, "parseLeaderboard(message, page)", 120000, 5);
  } else

  if(command === "updateusername") {
    let tally = DataManager.getData();
    let user = args[0] && checkrole(getmemberfromuser(message.guild, message.author), "mods") ? getuser(message.guild, args[0]) : message.author;
    let dbuser = getdbuserfromuser(user);
    let dbindex = getdbindexfromdbuser(dbuser);
    tally[dbindex].username = user.tag;
    DataManager.setData(tally);
    sendgenericembed(message.channel, `Data on **username** re-registered to database for **${user.tag}**.`)
  } else

  if(command === "color" || command === "colour") {
    let user = (checkrole(getmemberfromuser(message.guild, message.author), "mods") || (getuser(message.guild, args[0]) && getuser(message.guild, args[0]).id === message.author.id)) ? getuser(message.guild, args[0]) : message.author;
    let member = getmemberfromuser(message.guild, user);
    let color = getuser(message.guild, args[0]) ? argument.slice(args[0].length, argument.length).trim().toUpperCase().replace(/[^a-zA-Z0-9,]/g, "") : argument.toUpperCase().replace(/[^a-zA-Z0-9,]/g, "");
    if(color.occurrences(",") === 2) {
      color = color.split(",");
      for(let i = 0; i < color.length; i++) color[i] = parseInt(color[i]);
    };
    if(checkrole(member, "choosecolor")) {
      role = getrolefromname(message.guild, user.username + "CustomColor");
      if(role) role.setColor(color);
    }
  } else

  if(command === "fen") {
    if(args.length < 6 || (args[1].toLowerCase() !== "w" && args[1].toLowerCase() !== "b") || !args[2].toLowerCase().match(/^[kq-]+$/g) || (isNaN(parseInt(args[4])) || args[4] === "-") || ((isNaN(parseInt(args[5])) || args[4] === "-"))) {
      senderrormessage(message.channel, "Invalid FEN!");
      return;
    };
    let fenargs = args.slice(0, 6);
    let type = args[0].occurrences("/") === 8 ? "crazyhouse" : "chess";
    let inhand = "";
    if(type === "crazyhouse") {
      inhand = args[0].split("/").splice(-1, 1)[0] + " ";
      args[0] = (args[0] + " ").replace("/" + inhand, "");
    };
    let truefen = fenargs.join(" ")
    let fen = args.join(" ");
    let toMove = "";
    let flip = 0;
    if(fen.indexOf(" b ") !== -1) {
      toMove = "Black to move.";
      flip = 1;
    } else {
      toMove = "White to move.";
    };
    inhand += (type = "crazyhouse" ? flip : "");
    let imageUrl = FEN_API_URL +
      "?fen=" + encodeURIComponent(fen) +
      "&board=" + config.fenBoard +
      "&piece=" + config.fenBoardPieces +
      "&coordinates=" + config.fenBoardCoords +
      "&size=" + config.fenBoardSize +
      "&flip=" + flip +
      "&ext=.png"; //make discord recognise an image
    let lichessUrl = type === "chess" ? LICHESS_ANALYSIS_FEN_URL + encodeURIComponent(fen) : LICHESS_CRAZYHOUSE_FEN_URL + truefen.replace(/\s+/g, "_");
    request(imageUrl, function(error, response, body) {
      if(response.statusCode != "404") {
        embedsender(message.channel, getFenEmbed(imageUrl, toMove, lichessUrl, inhand))
      };
    });
  } else

  if(command === "membercount") {
    let tally = DataManager.getData();
    let membercount = tally.length;
    sendgenericembed(message.channel, `There are ${membercount} unique users registered to the database.`)
  } else

  if(command === "partymode") {
    if(!checkowner(message.author)) return;
    if(!partymode.active) {
      partymode.active = true;
      partymode.channel = message.channel;
      sendgenericembed(message.channel, "Party mode enabled.");
      partyfunction(1000)
    } else
    if(partymode.active) {
      partymode.active = false;
      sendgenericembed(message.channel, "Party mode disabled.");
    }
  } else

  if(command === "close") {
    if(!checkowner(message.author)) return;
    message.channel.fetchMessage(args[0])
    .then((msg) => {
      if(!msg) return;
      if(msg.reactions.length > 0) {
        msg.clearReactions();
      };
      msg.react(getemojifromname("closed"));
      message.delete()
    })
  } else
  
  if(command === "setpresence") {
    if(!checkowner(message.author)) return;
    type = args[0];
    gamename = args[1]
    link = args[2]
    client.user.setPresence({
      game: {
        name: gamename,
        url: link,
        type: type
      }
    })
    message.delete();
  };

  if(command === "usernametotag") {
    if(!checkowner(message.author)) return;
    tally = DataManager.getData()
    count = 0;
    clearvar();
    embedoutput.title = "Updated 'username' field to tag for"
    embedoutput.description = "";
    for(let i = 0; i < tally.length; i++) {
      user = getuser(message.guild, tally[i].id);
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
    if(!checkowner(message.author)) return;
    tally = DataManager.getData()
    tally2 = []
    tally2[0] = tally[0];
    count = 0;
    clearvar();
    embedoutput.title = "Found duplicates..."
    embedoutput.description = "";
    for(let i = 1; i < tally.length; i++) {
      let dbuser = tally2.find(tally2user => tally2user.id === tally[i].id);
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
    if(!checkowner(message.author)) return;
    let user = getuser(message.guild, args[0]);
    if(!user) return;
    logshadowban(server, user);
  } else

  if(command === "shadowban") {
    if(!checkowner(message.author)) return;
    let user = getuser(message.guild, args[0]);
    if(!user) return;
    shadowban(server, user);
  } else

  if(command === "unshadowban") {
    if(!checkowner(message.author)) return;
    let user = getuser(message.guild, args[0]);
    if(!user) return;
    unshadowban(server, user);
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
            message.channel.send(`Your Name is: ${collected.first().content}`);
          })
          .catch(function(){
            message.channel.send(`You didn't write your name.`);
          });
      });
  } else

  if(command === "position") {
    let tally = DataManager.getData();
    let user = getuser(message.guild, args[0] ? args[0] : message.author.id)
    if(!user) return;
    let dbuser = getdbuserfromuser(user);
    let dbindex = getdbindexfromdbuser(dbuser);
    console.log(dbindex);
    clearvar();
    embedoutput.title = "House Database Positions";
    embedoutput.description = `**${dbindex}**: ${tally[dbindex].username}    \u200B ${tally[dbindex].bidamount ? (dbindex === 0 ? "∞" : tally[dbindex].bidamount) : 0} :cherry_blossom:`;
    embedsender(message.channel, embedoutput);
  } else

  if(command === "bidamount") {
    bidamount(message, args, command, argument, server);
  } else

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
  
  if(command === "setprefix") {
    if(!checkowner(message.author)) return;
    let newPrefix = argument;
    server.prefixes.prefix = newPrefix
    DataManager.setGuildData(server);
    sendgenericembed(message.channel, `**${message.author.tag}** has updated the prefix on **${message.guild.name}** to **${newPrefix}** !`);
    console.log(`${message.author.username} [${message.author.id}] has updated the prefix to ${newPrefix}`);
  } else

  if(command === "setusername") {
    if(!checkowner(message.author)) return;
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
      aslhandler(message, args, command, argument, server);
    } 
  } else

  if(command === "verifyinfo") {
    if(!checkrole(getmemberfromuser(message.guild, message.author), "mods")) return;
    let user = getuser(message.guild, args[0])
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
    let user = argument ? getuser(message.guild, argument) : message.author;
    messagecount (message, user);
  } else

  if((command === "updatemessagecount") || (command === "updatemessages")) {
    if(!checkowner(message.author)) return;
    let tally = DataManager.getData();
    clearvar()
    let user = getuser(message.guild, args[0])
    let newcount = parseInt(args[1]);
    if(!user) return;
    let dbuser = user ? getdbuserfromuser (user) : getdbuserfromusername (args[0]);
    if(!dbuser) return;
    let dbindex = getdbindexfromdbuser (dbuser)
    if(dbindex === -1) return;
    if(dbuser.messages === newcount) {
      senderrormessage (message.channel, `Message count for **${user.tag}** was already **${dbuser.messages.toLocaleString()}** messages.`);
    } else {
      let tally = DataManager.getData();
      tally[dbindex].messages = newcount;
      if(!tally) return;
      DataManager.setData(tally);
      messagecount (message, user, true);
    };
  } else

  if(command === "removedbuser") {
    if(!checkowner(message.author)) return;
    let tally = DataManager.getData();    
    clearvar()
    let user = getuser(message.guild, args[0], true)
    let dbuser = user ? getdbuserfromuser (user) : getdbuserfromusername (args[0]);
    if(!dbuser) return;
    let dbindex = getdbindexfromdbuser (dbuser)
    if(dbindex === -1) return;
    tally = tally.remove(dbindex);
    if(!tally) return;
    DataManager.setData(tally);
    embedoutput.description = `**${dbuser.username}** has been deleted from the database.`;
    embedoutput.color = 15406156;
    embedsender(message.channel, embedoutput);

  } else

  if(command === "lastmessage") {

    let user = argument ? getuser(message.guild, argument) : message.author;
    if(!user) {
      senderrormessage(message.channel, `No user found.`)
      return;
    } else {
      let dbuser = getdbuserfromuser (user);
      let dbindex = getdbindexfromdbuser (dbuser);
      var lastmessage;
      if(dbuser.lastmessage) {
        clearvar()
        lastmessage = (dbuser.lastmessagedate ? `\nSent at ${getISOtime (dbuser.lastmessagedate)}.` : "") + (dbuser.lastmessage.startsWith("<:") && dbuser.lastmessage.endsWith (">") ? "\n" + dbuser.lastmessage : "\`\`\`" + dbuser.lastmessage + "\`\`\`");
        embedoutput.title = "Last Message";
        embedoutput.description = lastmessage;
        embedsender(message.channel, embedoutput);
      };
    }
  } else

  if(command === "commands" || command === "lazybotcommands") {
    clearvar()
    embedoutput.description = "**Nadeko functions**\n```css\n.nadekoprefix        [newPrefix]    {owneronly}\n.fb                  [user]         {owneronly}\n.bcp                 [e/d]          {modsonly}\n.testingmode         [e/d]          {devonly}\n.mf                  [g,t,i]\n.tf                  [g,t,i]\n.decimaltous         [decimalodds]\n.ustodecimal         [usodds]\n.fetch               [messageid]\n.notify              [valid link]```\n**Bot functions**\n```css\n!prefix              [newPrefix]    {owneronly}\n!setusername         [newUsername]  {owneronly}\n!updatemessagecount  [user,msgs]    {owneronly}\n!removedbuser        [user]         {owneronly}\n!asl                 [a,s,l]\n!ping                []\n!uptime              []\n!messages            []\n!lastmessage         []\n!commands            []```\n**Miscellaneous Functions**\n```css\nsubreddit link       [/r/,r/]\nmessage counter      [message]\nleave message        [userLeft]\ntrivia payout msg    [embed,content]```";
    embedoutput.thumbnail = embedthumbnail (config.avatar);
    embedsender(message.channel, embedoutput);
  } else

  if(command === "profile") {
      paginator(message, "getprofile(message, page)", 30000, 2)
  } else

  if(command === "fieldadd") {
    if(!checkowner(message.author)) return;
    let tally = DataManager.getData();
    clearvar()
    let newfield = args[0].replace(/[.,#!$%\^&;:{}<>=-_`\"~()]/g,"");
    if(!newfield) return;

    if(tally[0][newfield] || (tally[0][newfield] === "")) {
      senderrormessage (message.channel, "Field already exists!")
    } else {
      for(let i = 0; i < tally.length; i++) {
        tally[i][newfield] = ""};
      if(!tally) return;
      DataManager.setData(tally);
      sendgenericembed (message.channel, `New field **${newfield}** has been added to each user in db.`);
    };
    
  } else

  if(command === "ratingmod") {
    if(!checkowner(message.author)) return;
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
    if(!checkowner(message.author)) return;
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
        if(!tally) return;
        DataManager.setData(tally);
        sendgenericembed (message.channel, `Field **${newfield}** has been set to **${content}** for every user in db.`);
      };
  } else

  if(command === "removefield") {
    if(!checkowner(message.author)) return;
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
    if(!tally) return;
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
    if(dbindex === -1) return;

    if(!newfinger) {
      embedoutput.content = "Your current finger message is:"
      embedoutput.title = user.tag;
      if(dbuser.finger) {
        embedoutput.description = "\`\`\`" + dbuser.finger + "\`\`\`";
        embedoutput.footer = embedfooter (`!finger clear to remove your finger message.`)
      } else {
        embedoutput.description = "\`\`\` \`\`\`";
      };
      embedsender(message.channel, embedoutput)
    } else
    if(newfinger.length > 500) {
      senderrormessage (message.channel, `Finger must be within **500** characters.`);
    } else
    if(dbuser.finger === newfinger) {
      senderrormessage (message.channel, `Finger for **${user.tag}** was already as posted.`);
    } else {
      newfinger === "clear" ? delete tally[dbindex].finger : tally[dbindex].finger = newfinger;
      if(!tally) return;
      DataManager.setData(tally);
      sendgenericembed (message.channel, `Finger for **${user.tag}** has been` + (newfinger === "clear" ? " cleared" : " updated."))
    };
  } else

  if(command.endsWith("trophy")) {
    trophyhandler(message, command, args, argument);
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
    embedsender(message, embedoutput);
  } else 

  if(command === "deactivate") {
    let user = message.author;
    let member = getmemberfromuser(message.guild, user);
    if(!checkrole (member, "dev")) return;
    clearvar()
    embedoutput.author = embedauthor("LAZYbot#9000", "https://i.imgur.com/pvh3yXm.png")
    embedoutput.description = `Daisy, Daisy, give me your answer, do. I'm half crazy all for the love of you...`;
    embedoutput.color = 14618131,
    embedsender(message.channel, embedoutput);
  } else

  if(command === "gild") {
    let user = getuser(message.guild, args[0])
    let gildmessage = message;
    let channel = message.channel;
    let author = message.author;
    if(user) {
      let member = getmemberfromuser(message.guild, user)
      console.log(member.lastMessageID);
      message.channel.fetchMessage(member.lastMessageID)
        .then((targetmessage => {
          targetmessage.react(getemojifromname("gold"))
          message.delete()
          clearvar()
          embedoutput.content = user.toString();
          embedoutput.title = "Message Gilded";
          embedoutput.color = 14148167;
          embedoutput.description = `**${author.tag} has gilded the comment of **${author.tag}**!`
          embedsender(channel, embedoutput);
          message.delete()
        }))
        .catch (console.error);
    } else {
    message.channel.fetchMessage(args[0])
      .then((targetmessage => {
        let targetuser = targetmessage.author
        let member = getmemberfromuser(message.guild, targetuser)
        targetmessage.react(getemojifromname("gold"))
        clearvar()
        embedoutput.content = targetuser.toString();
        embedoutput.title = "Message Gilded";
        embedoutput.color = 14148167;
        embedoutput.description = `**${author.tag}** has gilded the comment of **${targetuser.tag}**!`
        embedsender(channel, embedoutput);
        message.delete()
      }))
      .catch (console.error);
    }
  } else

  if(command === "emoji") {
    if(!checkowner(message.author)) return;
    let emojiname = args[0]
    if(!emojiname) return;
    let emoji = getemojifromname(emojiname)
    if(!emoji) return;
    message.react(emoji.id);
  } else

  if(command === "setdbusername") {
    user = args[0] && checkowner(message.author) ? getuser(message.guild, args[0]) : message.author;
    let dbuser = getdbuserfromuser(user);
    let dbindex = getdbindexfromdbuser(dbuser);
    let tally = DataManager.getData();
    tally[dbindex].username = message.author.tag;
    DataManager.setData(tally);
    sendgenericembed(message.channel, `Data on **username** re-registered to database for **${user.tag}**.`)
  } else

  if(command === "upversion" || command === "version") {
    if(!checkowner(message.author)) return;
    version = packagestuff.version.split(".", 3);
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
      packagestuff.version = newversion;
      DataManager.setData(packagestuff, "./package.json");
      getmemberfromuser(message.guild, client.user).setNickname(`LAZYbot${client.user.id === config.ids.betabot ? "beta" : ""} v.` + newversion)
      sendgenericembed(message.channel, `${packagestuff.name} version has been ${command === "upversion" ? "upped" : "modified"} to **v.${newversion}**!`);
    } else {
      senderrormessage(message.channel, `No version specified.`);
    }
  };

  cr(message, "marco", "polo!");
  cr(message, "ready", "I am ready!");
  cr(message, "owner", "theLAZYmd#2353");
  cr(message, "who", `I am LAZYbot#2309 **v${packagestuff.version}**`);
  cr(message, "help", "This is a pretty basic bot, there isn't much it can help you with.");
  cr(message, "party", ":tada:");
  er(message, command, args, server);

};

function botfunctions(message, server) {
  if(message.author.id === bouncerbot.id && message.embeds.length !== 0 && message.embeds[0].description) {
    if(message.embeds[0].author && message.embeds[0].title) {
      triviareaction(message)
    };
    // pingsubs(message);
    if(message.embeds[0].description.includes("housebank#5970") && message.embeds[0].description.includes("has") && !message.embeds[0].description.includes("given")) {
      let start = message.embeds[0].description.indexOf("has") + 4;
      let finish = message.embeds[0].description.indexOf(":cherry_blossom:") - 1;
      let sumtotal = message.embeds[0].description.slice(start, finish);
      clearvar()
      embedoutput.color = server.colors.generic;
      embedoutput.description = `**housebank#5970** has ${sumtotal} :cherry_blossom:`;
      updatepinned(message.guild, "transaction-log", "435455324439183370", {embed: embedoutput});
    } else
    if(message.embeds[0].description.includes("has gifted") && message.channel.id === getchannelfromname(message.guild, "transaction-log").id) {
      message.delete(10000);
    };
  }
};

function nonprefixfunctions(message, args, argument, server) {
  if(message.content.startsWith ("Final Results") || message.content.startsWith ("Trivia Game Ended")) {
    triviareaction(message);
  } else {
    if(!argument) return;
    if(argument.match(/not invited by [a-zA-Z0-9]+/)) invitehandler(message, args, false, argument, server);
    if(argument.match(/invited by [a-zA-Z0-9]+/)) invitehandler(message, args, true, argument, server);
    for(let i = 0; i < args.length; i++) {
      let command = args[i];
      if(command.startsWith("r/") || command.startsWith("/r/")) redditlinks(message, args, command, argument);
    }
  checker(message, args, argument, server)
  }
};

function chesstitle(message, args, command, argument, server) {
  if(args.length !== 1 && args.length !== 2) return;
  let user = getuser(message.guild, args[0]);
  let tally = DataManager.getData();
  let dbuser = getdbuserfromuser(user);
  let dbindex = getdbindexfromdbuser(dbuser);
  if(args[1]) {
    if(!user || !args[1].toLowerCase().match(/gm|im|fm|nm|cm|lm/)) return;
    tally[dbindex].title = args[1].toLowerCase();
    sendgenericembed(message.channel, `Acknowledged title **${args[1].toUpperCase()}** for **${user.tag}**.`);
  } else {
    if(tally[dbindex].title) {
      delete tally[dbindex].title;
      sendgenericembed(message.channel, `Successfully removed title for **${user.tag}**.`);
    }
  };
  DataManager.setData(tally);
};

function checkbounceronline() {
  if(bouncerbot && client.users.get(bouncerbot.id) && bouncerbot.presence.status == "online");
  return true;
};  

String.prototype.clean = function() {
  if (typeof(this) === "string") {
    return this.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
  } else return this;
};

function invitehandler(message, args, command, argument, server) {
  if(config.inviteboolean = true) {
    let dbauthor = getdbuserfromuser(message.author);
    if(!dbauthor || !dbauthor.messages || !dbauthor.messages < 50) return;
    let searchstring = argument.match(/invited by [a-zA-Z0-9]+/)[0].splice(10).trim();
    let user = getuser(message.guild, searchstring);
    let tally = DataManager.getData();
    let dbuser = getdbuserfromuser(user);
    let dbindex = getdbindexfromdbuser(dbuser);
    if(command === true) {
      if(dbuser.invites && dbuser.invites[0]) {
        dbuser.invites.push(message.author.id);
      } else {
        dbuser.invites = [];
        dbuser.invites[0] = message.author.id;
      }
      tally[dbindex] = dbuser;
      DataManager.setData(tally);
      sendgenericembed(message.channel, `Welcome to the server **${message.author.username}**!\nThanks for inviting them **${user.username}**.`);
    } else
    if(command === false) {
      for(let i = 0; i < dbuser.invites.length; i++) {
        if(dbuser.invites[i] === message.author.id) dbuser.invites.remove(i);
      }
    };
    if(dbuser.invites.length >= 10) {
      tally[dbindex].patron = true;
      DataManager.setData(tally);
      sendgenericembed(message.channel, `Thanks for inviting 10 people **${user.username}**! You have been awarded **patron** flair.\nPlease type \`!profile\` to view the flair.`)
    }
  }
};

function typeadd(message, args, command, argument, server) {
  let argsindex = -1;
  if(argument.match(/[^a-zA-Z0-9\.!\?'\-,;"£\$%~\+=()\s\u200B-\u200D\uFEFF]+/g)) {
    senderrormessage(message.channel, `Invalid characters; please reformat your quote.`);
    return;
  };
  for(let i = args.length -1; i >= 0; i--) {
    if(args[i].startsWith("-")) {
      argsindex = i;
    }
  };
  if(argsindex === -1) {
    senderrormessage(message.channel, `No source provided/Incorrect format!`);
    return;
  };
  let text = args.slice(0, argsindex).join(" ").replace("“", "\"").replace("”", "\"");
  let source = args.slice(argsindex, args.length).join(" ").slice(1);
  if(text.startsWith(`"`) && text.endsWith(`"`)) text = text.slice(1, -1);
  if(text.length < 265) {
    senderrormessage(message.channel, `Entry **${265 - text.length}** characters too short! Please try again.`);
    return;
  };
  if(text.length > 529) {
    senderrormessage(message.channel, `Entry **${text.length - 529}** characters too long! Please try again.`);
    return;
  };
  let newentry = {
    "Source": source,
    "Text": text,
    "Submitter": message.author.tag,
    "Approved": false
  };
  let typingentries = DataManager.getData("./typing_articles4.json") || [];
  let index = typingentries.length || 0;
  let embedoutput = {
    "title": "#" + index + " " + newentry.Submitter + ", from " + newentry.Source,
    "description": newentry.Text,
    "color": config.colors.generic,
    "footer": {
      "text": "Submitted: " + getISOtime(Date.now()) + ", " + newentry.Text.length + " characters."
    }
  };
  if(typingentries[0]) {
    typingentries.push(newentry)
  } else {
    typingentries[0] = newentry;
  };
  DataManager.setData(typingentries, "./typing_articles4.json");
  sendgenericembed(message.channel, "Quote added, up for review");
  getchannelfromname(message.guild, `transaction-log`).send({embed: embedoutput}) 
  .then(quote => {
    quote.react(getemojifromname("true"));
    setTimeout(() => {
      quote.react(getemojifromname("false"));
    }, 500);
    let reactionsfilter = (reaction, user) => (reaction.emoji.name === "true" || reaction.emoji.name === "false") && !user.bot;
    quote.awaitReactions(reactionsfilter, {
      max: 1
    })
    .then((collected) => {
      if(collected.first().emoji.name === "true") {
        typingentries[index].Approved = true;
        DataManager.setData(typingentries, "./typing_articles4.json");
        quote.delete();
        embedoutput.title = `Your typecontest submission has been accepted. Awaiting payment...`
        message.author.send({embed: embedoutput})
      };
      if(collected.first().emoji.name === "false") {
        typingentries.remove(index)
        DataManager.setData(typingentries, "./typing_articles4.json");
        quote.delete();
        embedoutput.title = `Your typecontest submission has been denied.`
        message.author.send({embed: embedoutput})
      };
    });
  })
  .catch(`Some error somewhere.`);
};

function parseLeaderboard(message, page) {
  let guild = message.guild;
  let server = DataManager.getGuildData(guild.id);
  let args = message.content.slice(server.prefixes.prefix.length).match(messageSplitRegExp);
  let command = args.shift().toLowerCase();
  let argument = message.content.slice(command.length + server.prefixes.nadeko.length).trim();
  let source = config.sources[0];
  for(let i = 0; i < config.sources.length; i++) for(let j = 0; j < config.sources[i].length; j++) {
    if(message.content.toLowerCase().includes(config.sources[i][j].toLowerCase())) {
      source = config.sources[i];
      break;
    }
  }
  let sourcevariants = source[1] + "variants";
  let sourceProfileURL = source[1] + "ProfileURL";
  let active = message.content.includes("active") ? true : false;
  let [m, n] = [-1, -1];
  let emoji = "";
  let variant = config[sourcevariants].filter(function(variant) {
    for(let i = 0; i < args.length; i++) if(args[i] === variant[1]) {
      m = i;
      return variant;
    }
  });
  variant = variant ? variant[0] : variant;
  let collectedvariants = message.channel.topic ? config[sourcevariants].filter(function(variant) {
    return message.channel.topic.includes(variant[1]);
  }) : [] ;
  collectedvariants = collectedvariants.concat(config[sourcevariants].filter(function(variant) {
    return message.channel.name === variant[3];
  }));
  if(collectedvariants[0]) {
    variant = collectedvariants[0];
    for(let i = 0; i < config[sourcevariants].length; i++) {
      if(variant[1] === config[sourcevariants][i][1]) n = i;
    }
  };
  console.log(m, n);
  if(m !== n && m !== -1 && n !== -1) {
    senderrormessage(message.channel, "Wrong channel");
    return;
  }
  if(!variant || !variant[1]) return;
  console.log(variant[1], source[1], active);;
  let leaderboardy = leaderboard.getList(message.guild, variant[1], source[1], active);
  let array = [];
  for(let i = 0; i < 10; i++) if(leaderboardy.list[i + 10 * page]) {
    array[i] = [];
    array[i][0] = "[" + leaderboardy.list[i + 10 * page].username + `](${(config[sourceProfileURL].replace("|", leaderboardy.list[i + 10 * page].source))}) ` + leaderboardy.list[i + 10 * page].rating;
  };
  let leaderboardembed = getleaderboard(array, page, false);
  leaderboardembed.title = getemojifromname(variant[4]) + ` House Rankings on ${source[0]} for${active ? "active ": " "}${variant[0]} players`;
  leaderboardembed.color = server.colors.generic;
  return [leaderboardembed, Math.ceil(leaderboardy.list.length / 10)];
};

function survey() {
  let surveydata = DataManager.getData("./survey.json");
  let interval = 3600000;
  let guild = client.guilds.get(config.houseid);
  let [online, idle, dnd, total] = [0, 0, 0, 0];
  let lm = {
    "lm1": 0,
    "lm2": 0,
    "lm4": 0,
    "lm8": 0,
    "lm24": 0
  };
  guild.members.forEach(function(member) {
    
    let tally = DataManager.getData();
    let dbuser = tally.find(dbuser => dbuser.id === member.id);
    if(member.presence.status === "online") online++;
    if(member.presence.status === "idle") idle++;
    if(member.presence.status === "dnd") dnd++;
    if(dbuser && dbuser.lastmessagedate) {
      if(Date.now() - dbuser.lastmessagedate < 3600000) lm.lm1++;
      if(Date.now() - dbuser.lastmessagedate < 7200000) lm.lm2++;
      if(Date.now() - dbuser.lastmessagedate < 14400000) lm.lm4++;
      if(Date.now() - dbuser.lastmessagedate < 28800000) lm.lm8++;
      if(Date.now() - dbuser.lastmessagedate < 86400000) lm.lm24++;
    }
    total++;
  });
  surveydata[Date.now()] = {
    "online": online,
    "idle": idle,
    "dnd": dnd,
    "total": total,
    "lm": lm
  };
  DataManager.setData(surveydata, "./survey.json");
};

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

function getFenEmbed(imageUrl, text, lichessAnalysisUrl, inhand) {
  let winhand = (inhand.replace(/[^A-Z]/g, '')).split("");
  let binhand = (inhand.replace(/[^a-z]/g, '')).split("");
  for(let i = 0; i < winhand.length; i++) {
    winhand[i] = getemojifromname("white" + winhand[i].toLowerCase());
  };
  for(let i = 0; i < binhand.length; i++) binhand[i] = getemojifromname("black" + binhand[i]);
  let winhandstring = winhand.join(" ");
  let binhandstring = binhand.join(" ");
  let embed = {};
  embed.color = config.colors.generic;
  embed.description = inhand.includes("1") ? winhandstring + "\n" + binhandstring : binhandstring + "\n" + winhandstring;
  embed.title = text;
  embed.url = lichessAnalysisUrl;
  embed.image = embedimage(imageUrl);
  return embed;
}

function getguidefrompage(message, page) {
  let guild = message.guild;
  let server = DataManager.getGuildData(guild.id);
  let args = message.content.slice(server.prefixes.prefix.length).match(messageSplitRegExp);
  let command = args.shift().toLowerCase();
  let argument = message.content.slice(command.length + server.prefixes.nadeko.length).trim();
  let guidename = args[0];
  let embeds = DataManager.getData("./embeds.json");
  let guide = embeds.guides[guidename];
  return [guide[page], guide.length];
}

function paginator(message, functionname, period, manualmaxpages) {
  let page = 0;
  functionname.replace("page", page); 
  let evaluated = eval(functionname);
  let [paginatedpage, maxpages] = ["", ""];
  if(evaluated && evaluated[0]) {paginatedpage = evaluated[0]} else return;
  if(evaluated && evaluated[1]) {maxpages = evaluated[1]} else return;
  if(!paginatedpage) return;
  if(!maxpages) maxpages = manualmaxpages;
  if(!maxpages) maxpages = 1;
  console.log(maxpages);
  paginatedpage.footer = paginatedpage.footer && maxpages === 1 ? paginatedpage.footer : embedfooter(`${page + 1} / ${maxpages}`);
  message.channel.send(paginatedpage.content, {embed: paginatedpage})
  .then(paginatedmessage => {
    if(maxpages < 2) return;
    let reactionsfilter = (reaction, user) => (reaction.emoji.name === "⬅" || reaction.emoji.name === "➡") && !user.bot;
    let pagetracker = 0;
    paginatedmessage.react("⬅");
    setTimeout(() => {
      paginatedmessage.react("➡");
    }, 500);
    let collector = paginatedmessage.createReactionCollector(reactionsfilter, {
      time: period
    })
    collector.on("collect", (collected) => {
      for(let [key, value] of collected.users) {
        let user = getuser(message.guild, key);
        if(!user.bot) collected.remove(user);
      };
      if(collected.emoji.name === "➡") {
        if(page + 1 >= maxpages) return;
        page++;
        functionname.replace("page", page);
        let evaluated = eval(functionname);
        if(evaluated) [paginatedpage, maxpages] = evaluated;
        paginatedpage.footer = embedfooter(`${page + 1} / ${maxpages}`);
        paginatedmessage.edit(paginatedpage.content, {embed: paginatedpage})
      };
      if(collected.emoji.name === "⬅") {
        if(page - 1 < 0) return;
        page--;
        functionname.replace("page", page); 
        let evaluated = eval(functionname);
        if(evaluated) [paginatedpage, maxpages] = evaluated;
        paginatedpage.footer = embedfooter(`${page + 1} / ${maxpages}`);
        paginatedmessage.edit({embed: paginatedpage})
      };
    });
    collector.on("end", (collected) => {
      paginatedmessage.clearReactions()
    })
  })
  .catch(`Some error somewhere.`);
};

function trophyhandler(message, command, args, argument) {
  if(!checkowner(message.author)) {
    senderrormessage(message.channel, `Insufficient permission to do this.`);
    return
  };
  let user = getuser(message.guild, args[0])
  if(!user) {senderrormessage(message.channel, `No user found!`); return}
  let newstring = argument.slice(args[0].length + 1 + (command.startsWith("add") ? 0 : args[1].length + 1), argument.length)
  let trophyindex = parseInt(args[1]);
  let tally = DataManager.getData();
  let dbuser = getdbuserfromuser(user);
  let dbindex = getdbindexfromdbuser(dbuser)
  if(command.startsWith("add")) {
    if(!dbuser.trophy) {
      tally[dbindex].trophy = [];
      tally[dbindex].trophy[0] = newstring;
      DataManager.setData(tally);
      sendgenericembed(message.channel, `Awarded :trophy: **${newstring}** to **${user.tag}**!\n**${user.tag}** now has **${tally[dbindex].trophy.length}** trophies.`)
    } else
    if(dbuser.trophy.includes(newstring)) {
      senderrormessage(message.channel, `**${user.tag}** already had trophy **${newstring}**.`);
    } else {
      tally[dbindex].trophy.push(newstring);
      DataManager.setData(tally);
      sendgenericembed(message.channel, `Awarded :trophy: **${newstring}** to **${user.tag}**!\n**${user.tag}** now has **${tally[dbindex].trophy.length}** trophies.`)
    }
  } else
  if(command.startsWith("updatetrophy") || command.startsWith("deletetrophy")) {
    if(command.startsWith("deletetrophy")) newstring = "";
    if(trophyindex > dbuser.trophy.length - 1) {
      senderrormessage(`**${user.tag}** only has **${dbuser.trophy.length}** trophies.\nTrophy index **${trophyindex}** is not valid.`);
      return;
    }
    tally[dbindex].trophy[trophyindex] = newstring ? newstring : "";
    if(tally[dbindex].trophy && !tally[dbindex].trophy[0]) delete tally[dbindex].trophy;
    DataManager.setData(tally);
    sendgenericembed(message.channel, `:trophy: **${dbuser.trophy[trophyindex]}** for **${user.tag}** ${newstring ? "updated to **" + newstring + "**." : "removed."}`)
  }
};

function DMfunctions(message) {
  let timestamp = getISOtime(message.createdAt);
  if(message.embeds.length !== 0) {
    let embedoutput = embedreceiver(message.embeds[0])
    var searchposition;
    embedoutput.content = message.content ? message.content.startsWith("On ") && message.content.includes("\, user **") && message.content.includes("** said\:") ? message.content : `On ${timestamp}, user **${message.author.tag}** said:\n\`\`\`${message.content}\`\`\`` : `On ${timestamp}, user **${message.author.tag}** said:`;
    embedoutput.color = config.colors.generic;
    sendtoowner({embed: embedoutput});
  } else {
    if(message.content) {
      let fetchedmessage = (message.createdTimestamp ? `\nAt ${getISOtime(message.createdTimestamp)}, **${message.author.tag}** said` : "") + ("\`\`\`" + message.content + "\`\`\`");
      clearvar()
      embedoutput.title = `DM received from ${message.author.tag}`;
      embedoutput.description = fetchedmessage;
      embedoutput.color = config.colors.generic;
      sendtoowner({embed: embedoutput});
    }
  }
};

function partyfunction(time) {
  setInterval(() => {
    if(partymode.active) {
      let number = getrandomrange(1, 10);
      let partymessage = "";
      for(let i = 0; i < number; i++) {
        partymessage += `:tada:` + (i < number -1 ? " " : ``);
      };
      partymode.channel.send(partymessage)
    }
  }, time)  
};

function updatepinned(guild, channelname, messageid, content) {
  if(!channelname || !messageid || !content) return;
  let channel = getchannelfromname(guild, channelname);
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

function tickethandler(message, args, command, argument, server) {
  command = args.shift().toLowerCase();
  argument = argument.slice(command.length + 1);
  if(command === "add") {
    let tag = message.author.tag;
    let id = message.author.id;
    if(!args[0] || args[0] === "0") {
      senderrormessage(message.channel, `Invalid claim amount!`);
      return;
    };
    if(isNaN(args[0])) {
      let killboolean = false;
      let searchstring = args.shift().toLowerCase();
      let user = getuser(message.guild, searchstring)
      if(!user) {
        message.react(getemojifromname("closed"));
        killboolean = true;
      };
      if(killboolean) return;
      tag = user.tag;
      id = user.id;
      argument = argument.slice(searchstring.length + 1);
    };
    let amount = args[0];
    let reason = argument.slice(args[0].length).trim().length > 75 ? argument.slice(args[0].length).trim().slice(0, 75) : argument.slice(args[0].length).trim();
    let messageid = message.id;
    if(!server.tickets) {
      server.tickets = [];
      server.tickets[0] = {id, tag, amount, reason, messageid}
      DataManager.setGuildData(server);
    } else {
      server.tickets.push({id, tag, amount, reason, messageid});
      DataManager.setGuildData(server);
    };
    message.react(getemojifromname("in_progress"));
    message.reply(`Ticket added for user **${tag}** claiming **${amount}** because of ${reason}.`)
    .then(msg => {
      msg.delete(10000)
    })
    .catch(`Some error somewhere.`);
    embedoutput = tickets(message.guild);
    updatepinned(message.guild, "transaction-log", "435455324439183370", {embed: embedoutput});
    return;
  } else
  if(command === "close") {
    if(!args[0]) return;
    if(args[0] === "all") {
      server.tickets = [];
      DataManager.setGuildData(server);
      message.react(getemojifromname("tick"));
      message.channel.send(`All ticket successfully closed!`)
      .then(msg => {
        msg.delete(5000)
      })
      .catch(`Some error somewhere.`);
      embedoutput = tickets(message.guild);
      updatepinned(message.guild, "transaction-log", "435455324439183370", {embed: embedoutput});
      return;
    };
    let index = [];
    if(args[1] && isNaN(args[1])) {
      if(isNaN(args[0]) || args[0] === "0"|| args[0] > server.tickets.length) {
        senderrormessage(message.channel, `Invalid ticket index!`);
        return;
      } else {
        index[0] = parseInt(args[0]) - 1;
        let embed = {};
        embed.title = `Ticket ${args[0]} closed.`;
        embed.color = server.colors.generic;
        embed.fields = [];
        embed.fields = embedfielder(embed.fields, `Claim`, server.tickets[index[0]].amount + " :cherry_blossom:", false);
        embed.fields = embedfielder(embed.fields, `Your Reason`, server.tickets[index[0]].reason, false);
        embed.fields = embedfielder(embed.fields, `Mod Replies`, argument.slice(args[0].length).trim(), false);
        let user = getuser(message.guild, server.tickets[index[0]].id)
        user.send({embed: embed})
        let helpchannel = getchannelfromname(message.guild, "help");
        helpchannel.fetchMessage(server.tickets[index[0]].messageid)
        .then(msg => {
          msg.clearReactions();
          msg.react(getemojifromname("closed"));
        })
        .catch(console.error);
      }
    } else {
      for(let i = 0; i < args.length; i++) {
        if(isNaN(args[i]) || !args[i] || args[i] === "0" || args[i] > server.tickets.length) {
          senderrormessage(message.channel, `Invalid ticket index!`);
          return;
        } else {
          index[i] = parseInt(args[i]) - 1;
        }
      }
    };
    message.react(getemojifromname("tick"));
    message.delete(5000);
    for(let i = 0; i < index.length; i++) {
      console.log(index[i])
      let helpchannel = getchannelfromname(message.guild, "help");
      helpchannel.fetchMessage(server.tickets[index[i]].messageid)
      .then(msg => {
        msg.clearReactions();
        msg.react(getemojifromname("closed"));
        console.log(msg.content);
      })
      .catch(console.error);
      message.channel.send(`Ticket ${index[i] + 1} successfully closed!`)
      .then(mesg => {
        mesg.delete(5000);
      })
      .catch(`Some error somewhere.`);
    };
    server.tickets = server.tickets.remove(index);
    DataManager.setGuildData(server);
    embedoutput = tickets(message.guild);
    updatepinned(message.guild, "transaction-log", "435455324439183370", {embed: embedoutput});
  };
}

function ticketgivehandler(message, args, command, argument, user, server) {
  let indexes = server.tickets.findAllIndexes(x => x.id === user.id && x.amount === args[0]);
  var index;
  if(indexes.length === 0) return;
  if(indexes.length > 1) { // checks if multiple
    let channel = message.channel;
    for(let i = 0; i < indexes.length; i++) {
      indexes[i] = indexes[i] + 1
    }
    clearvar();
    embedoutput.title = `Which ticket to remove?`;
    embedoutput.description = indexes.join(" ");
    message.channel.send({embed: embedoutput}) // sends embed asking which index
    .then(originalmessage => {
      originalmessage.delete(10000)
    })
    .catch(`Some error somewhere.`);
    let filter = msg => msg.author.id === message.author.id && !isNaN(msg.content) && indexes.indexOf(Number(msg.content)) !== -1; //only accepts responses that are valid indexes
    channel.awaitMessages(filter, {
      max: 1,
      time: 30000,
      errors: ['time'],
    })
    .then((collected) => {
      collected.first().react(getemojifromname("tick")); // reacts to that message with a tick
      index = Number(collected.first().content) -1; // takes 1 from the number since the array starts at 0 and the human embed starts at 0
      message.react(getemojifromname("tick")); 
      let helpchannel = getchannelfromname(message.guild, "help");
      helpchannel.fetchMessage(server.tickets[index].messageid)
      .then(msg => {
        msg.clearReactions();
        setTimeout(()=>{
          msg.react(getemojifromname("paid")) // finds the #help message and reacts to it
        }, 2000);
      });
      server.tickets.remove(index); // removes the entry from the server db
      DataManager.setGuildData(server);
      embedoutput = tickets(message.guild);
      updatepinned(message.guild, "transaction-log", "435455324439183370", {embed: embedoutput}); //updates pinned message with new server
      message.channel.send(`Ticket ${index + 1} successfully closed!`) // replies
      .then(msg => {
        collected.first().delete(5000)
        msg.delete(5000); // deletes
      })
      .catch (console.error);
      message.delete(5000); //deletes
      })
      .catch(function(){
        console.log(message.author.tag + " timed out.")
      });
  } else {
    index = indexes[0]
    let helpchannel = getchannelfromname(message.guild, "help");
    helpchannel.fetchMessage(server.tickets[index].messageid)
    .then(msg => {
      msg.clearReactions();
      setTimeout(()=>{
        msg.react(getemojifromname("paid"))
      }, 2000);
    })
    .catch (console.error);
    server.tickets.remove(index);
    DataManager.setGuildData(server);
    embedoutput = tickets(message.guild);
    updatepinned(message.guild, "transaction-log", "435455324439183370", {embed: embedoutput});
    message.react(getemojifromname("tick"));
    message.channel.send(`Ticket ${index + 1} successfully closed!`)
    .then(msg => {
      msg.delete(5000);
      message.delete(5000);
    })
    .catch(`Some error somewhere.`);
  }
}

function tickets(guild) {
  let server = DataManager.getGuildData(guild.id);
  let array = [];
for(let i = 0; i < server.tickets.length; i++) {
    array[i] = [];
    array[i][0] = `${server.tickets[i].tag ? server.tickets[i].tag : server.tickets[i].user} (${server.tickets[i].id})`;
    array[i][1] = server.tickets[i].amount + " :cherry_blossom: " + server.tickets[i].reason;
  };
  if(server.tickets[0]) embedoutput = getleaderboard(array, 0, false);
  embedoutput.title = `${getemojifromname("thehouse")} House :cherry_blossom: Claimants`
  embedoutput.footer = embedfooter(server.tickets[0] ? `Should clear automatically upon '.give x person'.` : `All tickets have been cleared!`)
  embedoutput.color = server.colors.generic;
  return embedoutput;
};

function databasepositionhandler(message, args, command, argument, server) {
  let [bidamount, checkuser, databasestring, positionstring, dbindex] = args;
  if(!bidamount || !checkuser || !databasestring || !positionstring) return;
  if(!checkowner(getuser(message.guild, checkuser)) || databasestring.toLowerCase() !== "database" || isNaN(bidamount) ) return;
  let user = message.author;
  let filter = msg => msg.author.id === bouncerbot.id && msg.embeds && msg.embeds[0] && msg.embeds[0].description.includes("gifted");
  let channel = message.channel;
  channel.awaitMessages(filter, {
    max: 1,
    time: 20000,
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
      if(dbindex === 0 && !checkowner(message.author)) return;
      if(dbindex === newdbindex) {
        clearvar()
        embedoutput.title = `Buying a Database Position`;
        embedoutput.description = `Transaction could not be verified. Error: **you already own this position!**\nPlease seek refund.`;
        embedoutput.color = server.colors.error;
        embedsender(channel, embedoutput);
        return;
      } else 
      if(!isNaN(dbindex)) {
        let previoustotal = tally[newdbindex].bidamount ? tally[newdbindex].bidamount : 0;
        let oldbidamount = tally[dbindex].bidamount ? tally[dbindex].bidamount : 0;
        let newbidamount = tally[newdbindex].bidamount ? tally[newdbindex].bidamount + bidamount : bidamount;
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
          newbidamount = Math.floor(newbidamount * 0.95);
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
          let announcementschannel = getchannelfromname(message.guild, "announcements");
          announcementschannel.fetchMessage("432539249024303105")
          .then (message => {
            clearvar();
            embedoutput = dbpositions(message.guild);
            message.edit({embed: embedoutput});
          })
          .catch(console.error);
        }
      }
    } else
    if((!dbindex && dbindex !== 0) || isNaN(dbindex) ) {
      clearvar()
      embedoutput.title = `Buying a Database Position`;
      embedoutput.description = `Transaction could not be verified. Error: incorrect formatting, please seek refund.`;
      embedoutput.color = server.colors.error;
      addfield(`Format`, "`.give [bid amount] theLAZYmd#2353 Database Position [desired position]`", false);
      addfield(`Example`, "`.give 100 theLAZYmd#2353 Database Position 0`", false);
      embedsender(channel, embedoutput);
      return;
    }
  })
  .catch(function(error) {
    console.log(`${message.author} introduced an error. ${error}`)
  });
};

function dbpositions(guild) {
  let tally = DataManager.getData();
  let server = DataManager.getGuildData(guild.id);
  let array = [];
  for(let i = 1; i < 10; i++) {
    let medal = "";
    if(i === 1) {medal = " :first_place:"}
    if(i === 2) {medal = " :second_place:"}
    if(i === 3) {medal = " :third_place:"}
    array[i - 1] = [];
    array[i - 1][0] = `${tally[i].username}`;
    array[i - 1][1] = (tally[i].bidamount ? tally[i].bidamount : 0) + " :cherry_blossom:" + medal;
  }
  clearvar()
  embedoutput = getleaderboard(array, 0);
  embedoutput.title = `${getemojifromname("thehouse")} House Database Positions`
  embedoutput.footer = embedfooter(`... dbpositions to see how this all works. ${tally.length - 1} positions available.`)
  embedoutput.color = server.colors.generic;
  return embedoutput;
};

function logshadowban(server, user) {
  server.shadowbanned && server.shadowbanned[0] ? server.shadowbanned.push([user.id, false]) : server.shadowbanned = []; server.shadowbanned[0] = [user.id, false];
  DataManager.setGuildData(server);
};

function shadowban(server, user) {
  for(let i = 0; i < server.shadowbanned.length; i++) {
    if(user.id === server.shadowbanned[i][0] && !server.shadowbanned[i][1]) {
      server.shadowbanned[i][1] = true;
      DataManager.setGuildData(server);
    }
  }
};

function unshadowban(server, user) {
  for(let i = 0; i < server.shadowbanned.length; i++) {
    if(user.id === server.shadowbanned[i][0] && server.shadowbanned[i][1]) {
      server.shadowbanned[i][1] = false;
      DataManager.setGuildData(server);
    }
  }
};

function executeshadowban(message, server) {
  var boolean;
  for(let i = 0; i < server.shadowbanned.length; i++) {
    if(message.author.id === server.shadowbanned[i][0] && server.shadowbanned[i][1]) {
      message.delete();
      boolean = true;
    }
  }
  return boolean;
};

function bidamount(message, args, command, argument, server) {
  let user = args[0] ? getuser(message.guild, args[0]) : message.author;
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
    sendgenericembed (message.channel, `${field.toProperCase()} **${newstring}** added for **${user.tag}**.`)
  }
};

function updatefield(message, user, field, fieldindex, newstring) {
  let tally = DataManager.getData();
  let dbuser = getdbuserfromuser(user);
  let dbindex = getdbindexfromdbuser(dbuser)
  if(parseInt(field) > dbuser[field].length - 1) return;
  if(fieldindex) {
    tally[dbindex][field][fieldindex] = newstring ? newstring : "";
  } else {
    delete tally[dbindex][field]
  };
  // tally[dbindex][field].clean();
  if(tally[dbindex][field] && !tally[dbindex][field][0]) {delete tally[dbindex][field]}
  DataManager.setData(tally);
  sendgenericembed(message.channel, `${field.toProperCase()} for **${user.tag}** ${newstring ? "updated to **" + newstring + "**." : "removed."}`)
}

function pingsubs(message) {
  let server = DataManager.getGuildData(message.guild.id);
  if(message.channel.id === getchannelfromname(message.guild, server.channels.live).id && (message.author.id === bouncerbot.id || message.author.id === harmonbot.id)) {
    if(message.author.id === bouncerbot.id) {
      if(!(message.embeds[0] && message.embeds[0].author && message.embeds[0].author.name)) return;
      pingrole(message.channel, server.roles.livenotifications);
    } else {
      pingrole(message.channel, server.roles.livenotifications);
    }
  } return;
};

function aslhandler(message, args, command, argument, server) {
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
      if(dbuser.modverified && dbuser.modverified[0] === "modverified") {delete tally[dbindex].modverified};
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
    if(dbuser.modverified && dbuser.modverified[0] === "modverified") {delete tally[dbindex].modverified};
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
};

function removesource(message, args, command, argument, server) {
  if(args.length === 1) {
    let source = args[0].toLowerCase().replace(".","");
    tracker.remove(message.guild.id, source, message.member.id, message);
  } else
  if(args.length === 2) {
    let source = args[0].toLowerCase().replace(".", "");
    let user = getuser(message.guild, args[1])
    if(!user) return;
    if(source === "chesscom" || source === "lichess" || source === "bughousetestcom") {
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

function checker(message, args, argument, server) {
  for(let i = 0; i < server.er.length; i++) {
    let trigger = server.er[i]
    if(trigger[2]) {
      if(message.content.toLowerCase().includes(trigger[0].toLowerCase())) {
        let emoji = getemojifromname(trigger[1]);
        if(!emoji) return;
        message.react(emoji.id);
      }
    } else 
    if(!trigger[2]) {
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

function redditlinks(message, args, command, argument) {
  if(command.startsWith("/r/")) {
    sendgenericembed(message.channel, `[${command}](http://www.reddit.com${command})`)
  } else
  if(command.startsWith("r/")) {
    sendgenericembed(message.channel, `[/${command}](http://www.reddit.com/${command})`)
  };
};

function triviareaction(message) {
  var payoutoptions = [6,4,2,0];
  var claimoptions = [null,17,13,11,8,5,0];
  let triviagame = {};
  let args = [];
  let name = [];
  let payoutmsg = [];
  let payoutaggregate = "";

  if(!message.author.bot) {
    args = message.content.split("\n");
    if(!args[0] || !args[1] || !args[2]) return;
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
  if(name[0] === "No" || name.length < 1) return;
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
  embedsender(message.channel, embedoutput);
}

function clearvar () {
  embedoutput = {};
};

// 'get' based functions

function checkowner(member) {
  let ownerboolean = false;
  for(let i = 0; i < config.ids.owner.length; i++) {
    if(member.id === config.ids.owner[i]) {
      ownerboolean = true;
    };
  };
  return ownerboolean;
};

function checkrole(member, rolename) {
  let role = getrolefromname(member.guild, rolename)
  if(!member.roles) {member = getmemberfromuser(member.guild, member)}
  return (member.roles.has(role.id));
};

function getchannelfromname(guild, channelname) {
  if(!(typeof channelname === "string")) return;
  let channel = guild.channels.find(channel => channelname.toLowerCase() === channel.name.toLowerCase())
  if(!channel) {console.log("No channel found!")};
  return channel;
};

function getrolefromname(guild, rolename) {
  if(!(typeof rolename === "string")) return;
  let role = guild.roles.find(role => rolename.toLowerCase() === role.name.toLowerCase())
  if(!role) {console.log("No role found!")};
  return role;
};

function pingrole(channel, rolename) {
  let role = getrolefromname(channel.guild, rolename) ? getrolefromname(channel.guild, rolename) : rolename;
  channel.send(role + "");
};

function getuser(guild, searchstring, exactmode) {
  if(searchstring.length < 3) {
    return null
  } else {
    let user = "";
    user = getuserfromid(searchstring);
    if(!user) user = getuserfromusername(searchstring, exactmode);
    if(!user) user = getuserfromtag(searchstring);
    if(!user) user = getuserfromnickname(guild, searchstring, exactmode);
    if(!user) user = getuserfromaliases(searchstring);
    return user;
  }
};

function getuserfromid(snowflake) {
  if(snowflake.startsWith (`<@!`) && snowflake.endsWith (`>`)) {snowflake = snowflake.slice(3, snowflake.length -1)};
  if(snowflake.startsWith (`<@`) && snowflake.endsWith (`>`)) {snowflake = snowflake.slice(2, snowflake.length -1)};
  let user = client.users.find(user => snowflake === user.id)
  return user;
};

function getuserfromusername(string, exactmode) {
  let user = client.users.find(user => exactmode ? user.username.toLowerCase() === string.toLowerCase() : user.username.toLowerCase().startsWith(string.toLowerCase()));
  return user;
};

function getuserfromtag(string) {
  let user = client.users.find(user => string.toLowerCase() === user.tag.toLowerCase())
  return user;
};

function getuserfromnickname(guild, string, exactmode) {
  let member = guild.members.find(member => member.nickname && (exactmode ? member.nickname.toLowerCase() === string.toLowerCase() : member.nickname.toLowerCase().startsWith(string.toLowerCase())))
  if(!member) {return member} else return member.user;
};

function getuserfromaliases(searchstring) {
  let tally = DataManager.getData();
  let id = "";
  let user = "";
  for(let i = 0; i < tally.length; i++) {
    for(let j = 0; j < config.sources.length; j++) {
      let dbuser = tally[i]
      let source = config.sources[j][1];
      if(dbuser[source] && dbuser[source].toLowerCase().startsWith(searchstring.toLowerCase())) {
        id = dbuser.id;
        break;
      }
    };
    if(id) break;
  };
  if(id) user = getuserfromid(id);
  return user;
}

function getmemberfromuser(guild, user) {
  let member = guild.members.find(member => user.id === member.id)
  if(!member) {return} else {return member};
};

function getemojifromname(name) {
  if(name) {
    let emoji = client.emojis.find("name", name);
    return emoji;
  } else return;
};

function messagecount(message, user, update) {
  user ? user = user : user = message.author;
  let dbuser = getdbuserfromuser (user);
  if(!dbuser) return;
  clearvar()
  embedoutput.description = update ? `Message count for **${user.tag}** is now **${dbuser.messages.toLocaleString()}** messages.` : `**${user.tag}** has sent **${dbuser.messages.toLocaleString()}** messages.`;
  embedsender(message.channel, embedoutput);
  embedoutput = {};
};

function getdbuserfromuser(user) {
  if(!user) return;
  let tally = DataManager.getData();
  let dbuser = tally.find(dbuser => dbuser.id === user.id);
  if(!dbuser) {
    console.log("No dbuser found, creating one...");
    let newuser = config.dbtemplate;
    newuser.id = user.id;
    newuser.username = user.tag;
    tally.push (newuser);
    DataManager.setData(tally);
    console.log("User " + newuser.username + " has been logged in the database!");
  };
  dbuser = tally.find(dbuser => user.id === dbuser.id);
  return dbuser;
};

function getdbuserfromusername(username) {
  let tally = DataManager.getData();
  let dbuser = tally.find(dbuser => username === dbuser.username);
  return dbuser;
};

function getdbindexfromid(id) {
	let tally = DataManager.getData();
	let index = tally.findIndex(index => id === index.id)
	return index;
};

function getdbindexfromdbuser(dbuser) {
  if(!dbuser) return;
  let tally = DataManager.getData();
  return tally.findIndex(index => dbuser.id === index.id)
};

function returnmessagefromid(message, args, command, argument, server) {
  let channel = args[1] ? getchannelfromname(message.guild, args[1]) : message.channel;
  let id = args[0];
  clearvar();
  channel.fetchMessage(id)
    .then(msg => {
      let timestamp = getISOtime (msg.createdAt);
      if(msg.embeds.length !== 0) {
        let embedinput = embedreceiver(msg.embeds[0])
        var searchposition;
        embedinput.content = msg.content ? msg.content.startsWith("On ") && msg.content.includes("\, user **") && msg.content.includes("** said\:") ? msg.content : `On ${timestamp}, user **${msg.author.tag}** said:\n\`\`\`${msg.content}\`\`\`` : `On ${timestamp}, user **${msg.author.tag}** said:`;
        message.channel.send(embedinput.content, {embed: embedinput})
      } else {
        if(msg.content) {
          let fetchedmsg = (msg.createdTimestamp ? `\nAt ${getISOtime (msg.createdTimestamp)}, **${msg.author.tag}** said` : "") + ("\`\`\`" + msg.content + "\`\`\`");
          clearvar()
          embedoutput.title = `Fetched Message for ${message.author.tag}`;
          embedoutput.description = fetchedmsg;
          embedsender(message.channel, embedoutput);
          message.delete();
        };
      }
    })
    .catch(console.error);
};

function getmemberroles(member) {
  var rolelist = member.roles.map(role => role.name)
  return rolelist;  
};

function getprofile(message, page) {
  let embedprofile = {};
  let guild = message.guild;
  let server = DataManager.getGuildData(guild.id);
  let args = message.content.slice(server.prefixes.prefix.length).match(messageSplitRegExp);
  let command = args.shift().toLowerCase();
  let argument = message.content.slice(command.length + server.prefixes.nadeko.length).trim();
  let user = argument ? getuser(message.guild, argument) : message.author;
  if(!user) {
    senderrormessage(message.channel, `No user found.`)
    return;
  };
  let dbuser = getdbuserfromuser(user);
  let dbindex = getdbindexfromdbuser(dbuser);
  let member = getmemberfromuser(guild, user);
  let rolelist = getmemberroles(member);
  rolelist.splice(0, 1);
  let ratinglist = {};
  let userprofile = {};
  let alias = {};
  let region = "None set.";
  let sourcecount = 0;
  let icon = "";
  var lastmessage;
  var medal;
  for(let i = 0; i < server.regions.length; i++) {
    let role = getrolefromname(guild, server.regions[i]);
    if(checkrole(member, role.name)) {
      region = server.regions[i];
    };
  };
  for(let i = 0; i < config.sources.length; i++) {
    let source = config.sources[i][1];
    if(dbuser[source]) {
      ratinglist[source] = parsesourceratingdata(dbuser, source);
      userprofile[source] = parsesourceprofiles(dbuser, source);
      sourcecount++;
    };
  };
  let info = fieldhandler([["Age: ", dbuser.age], ["Sex: ", dbuser.sex ? (getemojifromname(dbuser.sex) ? getemojifromname(dbuser.sex) : dbuser.sex) : ""], ["Location: ", dbuser.location], ["Region: ", region]]);
  let ids = fieldhandler([["UID: ", "`" + user.id + "`", false], ["Position in Database: ", dbindex]])
  let joined = fieldhandler([["Discord: ", getISOtime(user.createdTimestamp).slice(4, 15)],[`${guild.name}: `, getISOtime(member.joinedTimestamp).slice(4, 15)]])
  let trophies = dbuser.trophy ? fieldhandler(dbuser.trophy, ":trophy: ", true) : "";
  let roles = rolelist ? fieldhandler(rolelist) : "" ;
  let modnotes = dbuser.modnotes ? fieldhandler(dbuser.modnotes, "") : "" ;
  alias.specifiers = [member.nickname, dbuser.lichess, dbuser.chesscom, dbuser.bughousetest];
  alias.list = [user.username];
  for(let i = 0; i < alias.specifiers.length; i++) {
    if(alias.specifiers[i] && !alias.list.inArray(alias.specifiers[i])) alias.list.push(alias.specifiers[i]);
  }
  alias.uniques = fieldhandler(alias.list.slice(1), "", true);
  if(dbindex === 1) medal = ":first_place: **First in Database.**";
  if(dbindex === 2) medal = ":second_place: **Second in Database.**";
  if(dbindex === 3) medal = ":third_place: **Third in Database.**";
  if(dbuser.lastmessage) lastmessage = (dbuser.lastmessagedate ? `\nSent at ${getISOtime(dbuser.lastmessagedate)}.` : "") + (dbuser.lastmessage.startsWith("<:") && dbuser.lastmessage.endsWith (">") ? "\n" + dbuser.lastmessage : "\`\`\`" + dbuser.lastmessage + "\`\`\`");
  if(user.bot) icon = getemojifromname("bot");
  if(dbuser.patron) icon = getemojifromname("patron");
  embedprofile.title = `${icon ? icon + " " : ""}Profile for ${dbuser.title ? getemojifromname(dbuser.title) + " " : ""}${user.tag}`;
  embedprofile.color = member.displayColor;
  embedprofile.thumbnail = embedthumbnail(user.avatarURL ? user.avatarURL : "https://i.imgur.com/EncsMs8.png");
  embedprofile.description = (dbuser.finger ? "```" + dbuser.finger + "```" : "") + (dbuser.modnotes ? "```diff\n-mod notes\n" + dbuser.modnotes + "```" : "");
  if(page === 0) {
    if(alias.uniques) embedprofile.fields = embedfielder(embedprofile.fields, "a.k.a.", alias.uniques, false);
    if(info) embedprofile.fields = embedfielder(embedprofile.fields, (dbuser.modverified ? " " + getemojifromname(dbuser.modverified[0]) : "") + "Info", info, true);
    embedprofile.fields = embedfielder(embedprofile.fields, `Joined Date`, joined, info ? true: false);
    embedprofile.fields = embedfielder(embedprofile.fields, "Index", ids, dbuser.messages ? true : false);
    if(dbuser.messages) embedprofile.fields = embedfielder(embedprofile.fields, "Messages Sent", dbuser.messages.toLocaleString(), true);
    if(dbuser.lastmessage) embedprofile.fields = embedfielder(embedprofile.fields, "Last Message", lastmessage, false);
    // addfield ("Roles", roles ? roles : "None", true)
    if(dbuser.trophy || medal) embedprofile.fields = embedfielder(embedprofile.fields, "House Trophies", (medal ? medal : "") + (trophies && medal ? `\n` : "") + (trophies ? trophies : ""), true);
    embedprofile.footer = embedfooter("Use !finger to change your finger message.");
  } else
  if(page === 1) {
    for(let i = 0; i < config.sources.length; i++) {
      let source = config.sources[i][1];
      if(dbuser[source]) embedprofile.fields = embedfielder(embedprofile.fields, `${getemojifromname(source)} ${config.sources[i][0]}`, `${userprofile[source]}\n${ratinglist[source]}`, true);
    };
  };
  return [embedprofile, sourcecount > 0 ? 2 : 1];
  // + \n\u200B
};

function sendtoowner(message) {
  if(!message) throw "Failed to define a message."
  for(let i = 0; i < config.ids.owner.length; i++) {
    let owner = client.users.get(config.ids.owner[i])
    if(owner) {
      owner.send(message);
    }
  };
  return;
};

// embed section of functions

function embedsender(channel, embed) {
  channel = channel.channel ? channel.channel : channel;
  let server = DataManager.getGuildData(channel.guild.id);
  embed.color = embed.color ? embed.color : server.colors.generic;
  channel.send(embed.content, {embed: embed})
  .catch((e) => console.log(JSON.stringify(e)));
  clearvar()
  return;
};

function fieldhandler(array, messageconstant, boolean) {
  let string = "";
  if(!messageconstant) {
    for(let i = 0; i < array.length; i++) {
      if(typeof array[i] === "array" || typeof array[i] === "object" ) {
        if(array[i][1] || array[i][1] === 0) {
          string += (array[i][2] === false ? array[i][0] + array[i][1] + (i < array.length -1 ? `\n` : `` ) : array[i][0] + "**" + array[i][1] + "**" + (i < array.length -1 ? `\n` : ``));
        }
      } else 
      if(typeof array[i] === "string") {
        string += array[i] + (i < array.length -1 ? `\n` : ``);
      }
    }
  } else {
    for(let i = 0; i < array.length; i++) {
      if(array[i]) {
        string += (boolean ? messageconstant + "**" + array[i] + "**" + (i < array.length -1 ? `\n` : ``) : messageconstant + array[i] + (i < array.length -1 ? `\n` : ``));
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
    embedoutput.fields[0] = {name, value, inline}
  } else {
    embedoutput.fields.push({name, value, inline});
  }
};

function embedfielder(fields, name, value, inline) {
  inline = inline ? inline : false;
  if(!fields) {
    fields = [];
    fields[0] = {name, value, inline}
  } else fields.push({name, value, inline});
  return fields;
};

function embedauthor (name, icon_url) {
  let author = {};
  if(name) author.name = name;
  if(icon_url) author.icon_url = icon_url;
  return author;
};

function embedthumbnail(link) {
  let thumbnail = {};
  if(link) thumbnail.url = link;
  return thumbnail
};

function embedimage(link) {
  let image = {};
  if(link) image.url = link;
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
  for(let i = 0; i < property.length; i++) if(embed[property[i]]) {
    embedinput[property[i]] = embed[property[i]];
  };
  if(embed.author) {
    let name = "";
    let icon_url = "";
    if(embed.author.name) name = embed.author.name;
    if(embed.author.icon_url) icon_url = embed.author.icon_url;
    if(name || icon_url) embedinput.author = embedauthor(name ? name : "", icon_url ? icon_url : "");
  };
  if(embed.footer) {
    let text = "";
    let icon_url = "";
    if(embed.footer.text) text = embed.footer.text;
    if(embed.footer.icon_url) icon_url = embed.footer.icon_url;
    if(text || icon_url) embedinput.footer = embedfooter(text ? text : "", icon_url ? icon_url : "");
  };
  if(embed.image) {
    let url = "";
    if(embed.image.url) url = embed.image.url;
    if(url) embedinput.image = embedimage(url);
  };
  if(embed.thumbnail) {
    let url = "";
    if(embed.thumbnail.url) url = embed.thumbnail.url;
    if(url) embedinput.thumbnail = embedthumbnail(url);
  };
  if(embed.fields) {
    embedinput.fields = [];
    for(let i = 0; i < embed.fields.length; i++) {
      let name = "";
      let value = "";
      let inline = "";
      if(embed.fields[i].name) name = embed.fields[i].name;
      if(embed.fields[i].value) value = embed.fields[i].value;
      if(embed.fields[i].inline) inline = embed.fields[i].inline;
      if(name || value || inline) {
        embedinput.fields[i] = {};
        name = name ? name : "\u200b";
        value = value ? value : "\u200b";
        inline = inline ? inline : false;
        embedinput.fields[i] = {name, value, inline}
      };
    };
  };
  return embedinput;
};

function cr(message, trigger, reply) {
  let server = DataManager.getGuildData(message.guild.id);
  let args = message.content.slice(server.prefixes.prefix.length).trim().split(/ +/g);
  let command = args.shift().toLowerCase();
  if(command === trigger) {
    message.channel.send(reply)
  };
};

function er(message, command, args, server) { // emoji reactions service
  let member = getmemberfromuser(message.guild, message.author);
  if(!checkowner(message.author)) return;
  if(!checkrole (member, "mods")) return;
  if(command === "aer") {
    let erca = args[2] ? true : false;
    let emoji = getemojifromname(args[1]);
    if(!emoji) {
      senderrormessage (message.channel, "No emoji found!")
    } else {
      server.er[0] ? server.er.push([args[0], args[1], erca]) : server.er[0] = [args[0], args[1], erca];
      DataManager.setGuildData(server);
      let emoji = getemojifromname(args[1]);
      if(!emoji) return;
      message.react(emoji.id);
    }
  } else

  if(command === "uer") {
    let index = server.er.findIndex(trigger => trigger[0] === args[0]);
    let erca = args[2] || false;
    server.er[index] = ([args[0], args[1], erca]);
    DataManager.setGuildData(server);
    let emoji = getemojifromname("tick");
    if(!emoji) return;
    message.react(emoji.id);
  } else
  
  if(command === "erca") {
    if(args.length === 0) return;
    let index = server.er.findIndex(trigger => trigger[0] === args[0]);
    let newerca = !server.er[index][2]
    server.er[index] = ([server.er[index][0], server.er[index][1], newerca]);
    DataManager.setGuildData(server);
    let emoji = getemojifromname("tick");
    if(!emoji) return;
    message.react(emoji.id);
  } else

  if(command === "der") {
    let index = server.er.findIndex(trigger => trigger[0] === args[0]);
    console.log(index);
    console.log(server.er);
    server.er = server.er.remove(index);
    console.log(server.er);
    DataManager.setGuildData(server);
    let emoji = getemojifromname("tick");
    if(!emoji) return;
    message.react(emoji.id);
  };

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
  for(let i = 0; i < 6; i++) {
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
  embedsender(message.channel, embedoutput);
};

function senderrormessage(channel, description) {
  clearvar()
  let server = DataManager.getGuildData(channel.guild.id);
  embedoutput.description = description;
  embedoutput.color = server.colors.error;
  embedsender(channel, embedoutput);
};

function sendgenericembed(channel, description) {
  clearvar()
  embedoutput.description = description;
  channel = channel.channel ? channel.channel : channel;
  embedsender(channel, embedoutput);
};

function enabletestingmode(server, message, LAZYbot, bouncer) {
  let user = getuser(message.guild, "LAZYbot", true);
  let channel = getchannelfromname(message.guild, server.channels.bot2);
  if(bouncer != "false") channel.overwritePermissions(bouncerbot, {
    'READ_MESSAGES': false,
    'SEND_MESSAGES': false 
  });
  if(LAZYbot != "false") channel.overwritePermissions(user, {
    'READ_MESSAGES': false,
    'SEND_MESSAGES': false
  });
  channel = getchannelfromname(message.guild, server.channels.bot);
  if(bouncer != "false") channel.overwritePermissions(bouncerbot, {
    'READ_MESSAGES': false,
    'SEND_MESSAGES': false
  });
  if(LAZYbot != "false") channel.overwritePermissions(user, {
    'READ_MESSAGES': false,
    'SEND_MESSAGES': false
    });
  server.testingmodeboolean = true;
  DataManager.setGuildData(server);
};

function disabletestingmode(server, message, LAZYbot, bouncer) {
  let user = getuser(message.guild, "LAZYbot", "true");
  let channel = getchannelfromname(message.guild, server.channels.bot2);
  if(bouncer != "false") channel.overwritePermissions(bouncerbot, {
    'READ_MESSAGES': true,
    'SEND_MESSAGES': true
  })
  if(LAZYbot != "false") channel.overwritePermissions(user, {
    'READ_MESSAGES': true,
    'SEND_MESSAGES': true
  })

  channel = getchannelfromname(message.guild, server.channels.bot);
  if(bouncer != "false") channel.overwritePermissions(bouncerbot, {
    'READ_MESSAGES': true,
    'SEND_MESSAGES': true
  })
  if(LAZYbot != "false") channel.overwritePermissions(user, {
    'READ_MESSAGES': true,
    'SEND_MESSAGES': true
  })
  sendgenericembed (message.channel, `**Testing mode disabled.**`)
  server.testingmodeboolean = false;
  DataManager.setGuildData(server);
};

function backupdb(degree, interval) {
  let tally = DataManager.getData();
  if(!tally) return;
  let time = gettime (interval)
  degree = degree ? degree : "1";
  if((degree !== "1") && (degree !== "2") && (degree !== "3")) {degree = "1"};
  if(interval) {
    setInterval(() => {
      DataManager.setData(tally, `./dbbackup${degree}.json`);
      console.log(`Database backed up to dbbackup${degree} at ${gettime(Date.now())}.`);
      config.backupdb[degree - 1] = getISOtime (Date.now())
      DataManager.setData(config, "./config.json");
    }, interval);
  } else {
      DataManager.setData(tally, `./dbbackup${degree}.json`);
      console.log(`Database backed up to dbbackup${degree} at ${getISOtime(Date.now())}.`);
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

Array.prototype.inArray = function(string) { 
  for(let i = 0; i < this.length; i++) { 
      if(string.toLowerCase().replace(/[.,#!$%\^&;:{}<>=-_`\"~()]/g,"").trim() === this[i].toLowerCase().replace(/[.,#!$%\^&;:{}<>=-_`\"~()]/g,"").trim()) return true; 
  }
  return false;
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
  let guild = client.guilds.get(serverID);
  let server = DataManager.getGuildData(serverID);
  let channel = getchannelfromname(guild, server.channels.mod);
  channel.send(error).catch((e) => console.log(JSON.stringify(e)));
}

function onTrackError(serverID, error, message) {
  console.log(error);
  senderrormessage(message.channel, error);
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
  let server = DataManager.getGuildData(message.guild.id);
  let channel = message.channel;
  let user = getuser(message.guild, userID);
  let member = getmemberfromuser(message.guild, user);
  if(source === "chesscom") {source = "chess.com"};
  clearvar()
  embedoutput.title = `Stopped tracking via !remove command`;
  embedoutput.description = `Unlinked **${user.tag}** from ${source} account **${username}**.`;
  embedoutput.color = server.colors.ratings;
  embedsender(channel, embedoutput);
};

function onTrackSuccess(serverID, userID, source, sourceusername, message) {
  let server = DataManager.getGuildData(message.guild.id);
  let channel = message.channel
  let user = getuser(message.guild, userID);
  let member = getmemberfromuser(message.guild, user);
  let dbuser = getdbuserfromuser(user);
  let sourceratings = source + "ratings";
  let newRole = getrolefromname(message.guild, server.roles.beta);
  let unranked = member.roles.find("name", server.roles.unranked);
  if(unranked) {
    member.removeRole(unranked).catch((e) => console.log(JSON.stringify(e)));
  };
  member.addRole(newRole).then(() => {
    let sourceratinglist = parsesourceratingdata(dbuser, source);
    let sourceuserprofile = parsesourceprofiles(dbuser, source);
    clearvar()
    embedoutput.title = `${getemojifromname(source.toLowerCase().replace(".",""))} Linked ${member.user.username} to '${sourceusername}'`
    embedoutput.description = `${sourceuserprofile}\nAdded to the role **${newRole.name}**. Current highest rating is **${dbuser[sourceratings].maxRating}**\n` + sourceratinglist;
    embedoutput.color = server.colors.ratings;
    embedsender(channel, embedoutput);
  }).catch(function(error) {
    console.log("Error adding new role", error);
  });
};

function onAuthenticatorSuccess(serverID, userID, source, sourceusername, message) {
  return;
};

function onRatingUpdate(message, user, rankingobject) {
  let server = DataManager.getGuildData(message.guild.id);
  let channel = message.channel
  let member = getmemberfromuser(message.guild, user);
  let dbuser = getdbuserfromuser(user);
  let ratingembed = {};
  ratingembed.color = server.colors.ratings;
	for(let i = 0; i < config.sources.length; i++) {
    let source = config.sources[i][1];
    if(dbuser[source]) {
      let sourceratings = source + "ratings";
      let sourceratinglist = parsesourceratingdata(dbuser, source, rankingobject);
      let sourceuserprofile = parsesourceprofiles(dbuser, source);
      ratingembed.fields = embedfielder(ratingembed.fields, `${getemojifromname(source)} ${rankingobject ? `${dbuser[source]} Rankings` : `Updated ${dbuser[source]}`}`, `${sourceuserprofile} ${rankingobject ? `                                \u200B\n` : `\nCurrent highest rating is **${dbuser[sourceratings].maxRating}**                     \u200B\n`}` + sourceratinglist, true)
    }
  };
  embedsender(channel, ratingembed);
};

function parsesourceratingdata(dbuser, source, rankingobject) {
  let sourcevariants = source + "variants";
  let sourceratings = source + "ratings";
  let sourcerankings = source + "rankings";
  let sourceratingData = rankingobject ? `**${rankingobject ? "Overall" : "Highest"}: ${dbuser[sourceratings].maxRating}**\n` : ""; //${rankingobject[sourcerankings]}`;
	for(let i = 0; i < config[sourcevariants].length; i++) {
    if(dbuser[source]) {
      let variant = config[sourcevariants][i];
      if(dbuser[sourceratings]) {
        let rating = dbuser[sourceratings][variant[1]];
        let ranking = "";
        if(rankingobject) ranking = rankingobject[sourcerankings][variant[1]]
        if(rating && !rankingobject || rating && !rating.toString().endsWith("?") && rankingobject) sourceratingData += `${variant[0]}: ${rating.toString().endsWith("?") ? "" : "**" }${rating}${rating.toString().endsWith("?") ? "" : "**" } ${ranking ? `(#` + ranking + `)` : ""}${i < config[sourcevariants].length -1 ? "\n" : ""}`;
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

function getsourcetitle(source) {
	let sourcetitle = "";
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

function getleaderboard(array, page, inline, pagekey) {
  let embed = {};
  embed.description = "";
  if(!array[0]) return;
  let bivariateboolean = false;
  let limit = array.length;
  for(let i = 0; i < limit; i++) {
    if(array[i][1] || array[i][1] === 0) {
      bivariateboolean = true;
    }
  }
  for(let i = 0; i < limit; i++) {
    if(bivariateboolean) {
      if(array[i][0].length > 17 && inline !== false) {
        array[i][0] = array[i][0].slice(0, 17);
      };
      embed.fields = embedfielder(embed.fields, `#${i + 1 + page * (pagekey ? pagekey : 9)} ${array[i][0]}`, array[i][1], inline === false ? false : true)
    } else {
      embed.description += `**#${i + 1 + page * (pagekey ? pagekey : 10)}** ${array[i][0] + (i < 10 ? "\n" : "")}`;
    } 
  };
  return embed;
}