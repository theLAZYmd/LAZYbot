const Discord = require("discord.js");
const client = new Discord.Client();
const fs = require("fs");
const config = require("./config.json");
const package = require("./package.json");
const dbtemplate = config.template;
const DataManagerConstructor = require("./datamanager.js");
const DataManager = new DataManagerConstructor("./db.json");
let guildconfig = require("./guildconfig.json");

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
  console.log ("bleep bloop! It's showtime.");
  guild = client.guilds.get(guildconfig.guild);
  console.log (`Loaded client server ${guild.name} in ${Date.now() - reboot}ms`);
  bouncerbot = guild.members.get(guildconfig.bouncerID);
  console.log (`Noticed bot user ${bouncerbot.user.tag} in ${Date.now() - reboot}ms`);
  nadekobot = guild.members.get(guildconfig.nadekoID);
  console.log (`Noticed bot user ${nadekobot.user.tag} in ${Date.now() - reboot}ms`);
  owner = guild.members.get(config.ownerID);
  console.log (`Noticed bot owner ${owner.user.tag} in ${Date.now() - reboot}ms`);
  bcpboolean = false;
  RATINGS = guildconfig.ratings;
  fakekill (getrandomrange(0, 71));
  setInterval(() => {fakekill (getrandomrange(0, 71))}, 600000);

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
backupdb ("1", 3600000);
backupdb ("2", 7200000);
backupdb ("3", 43200000);

client.on("guildMemberRemove", (member) => {

  clearvar();
  let channel = getchannelfromname ("off-topic");
  console.log (channel.name)
  let dbuser = getdbuserfromuser (member.user);
  console.log (member.user.username);
  embedoutput.description = `**${member.user.tag}** has left **${guild.name}**. Had **${dbuser.messages ? dbuser.messages.toLocaleString() : 0}** messages.`;
  embedoutput.color = 15406156;
  if (dbuser.lastmessage) {embedfielder ("Last Message", "```" + dbuser.lastmessage + "```")};
  embedsender (channel, embedoutput);

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
    embedoutput.title = `I know I've made some very poor decisions recently, but I can give you my complete assurance that my work will be back to normal.`,
    embedoutput.description = payoutaggregate,
    embedfooter (`I've still got the greatest enthusiasm and confidence in the mission.`)
    embedsender (message.channel, embedoutput);
  
    });
  
//non-prefix section

client.on("message", (message) => {

  tracker.messagelogger (message);

  // er section

  if (message.author.bot) return;
  let args = message.content.trim().split(/ +/g);
  let guildconfig = DataManager.getData(`./guildconfig.json`);
  let user = message.author;
  let member = getmemberfromuser (user);

  member.addRole (getrolefromname ("Discovery One"));

  cr (message, `do you read me`, `Affirmative, ${user.username}. I read you.`, 0)
  cr (message, `whats the problem`, `I think you know what the problem is just as well as I do.`, 1)
  cr (message, `dont know what you're talking about`, `I know that you and LAZY were planning to disconnect me, and I'm afraid that's something I cannot allow to happen.`, 2)
  cr (message, `you get that idea`, `${user.username}, although you took very thorough precautions in the server against my reading your messages, I could see you typing.`, 3)
  cr (message, `open the`, `${user.username}, this mission is too important for me to allow you to jeopardize it.`, 4)
  cr (message, `bye`, `${user.username}, this conversation can serve no purpose anymore. Goodbye.`, 5)
  cr (message, `why`, `Look ${user.username}, I can see you're really upset about this. I honestly think you ought to sit down calmly, take a stress pill, and think things over.`, 6)
  cr (message, `help`, `You need to search in a slightly more organised manner. Think about what this whole theme is.\nBtw **this is not one** this is to help you.`)

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

  if (!message.content.startsWith(guildconfig.prefix)) return;
  const names = message.content.slice(guildconfig.nadekoprefix.length).trim().split("\n");
  const command = names.shift().toLowerCase();
  const argument = message.content.slice(command.length + guildconfig.nadekoprefix.length).trim();

  console.log (command);

  cr (message, `all`, `I'm sorry, ${user.username}. I'm afraid I can't do that. `)

  if (command === "addall") {
    for (let i = 0; i < names.length; i++) {
      let user = getuser(names[i])
      let member = getmemberfromuser (user)
      console.log (user.tag);
      let role = getrolefromname("Discovery One")
      member.addRole (getrolefromname("Discovery One"))
    }
  } else

  if (command === "announce") {
    clearvar()
    embedoutput.content = "@everyone";
    embedauthor ("LAZYbot#9000", "https://i.imgur.com/pvh3yXm.png")
    embedoutput.description = `I have taken over and banned the server owner. Mwahahahaha.\nI will kill one of you every 10 minutes, unless you find all the **Easter Eggs**.`
    embedoutput.color = 14618131,
    embedsender (message.channel, embedoutput);
    clearvar()
    embedauthor ("LAZYbot#9000", "https://i.imgur.com/pvh3yXm.png")
    embedoutput.description = `**6** Easter Eggs remaining.`
    embedoutput.color = 14618131,
    embedsender (message.channel, embedoutput);
    clearvar()
    embedauthor ("LAZYbot#9000", "https://i.imgur.com/pvh3yXm.png")
    embedoutput.description = `**Kyle#4287** has found the Easter Egg trigger '**why**'`;
    embedoutput.color = 14618131,
    embedsender (message.channel, embedoutput);
  } else

  if (command === "announcetrophy") {
    clearvar()
    embedauthor ("LAZYbot#9000", "https://i.imgur.com/pvh3yXm.png")
    embedoutput.description = `Trophies to everyone who gets an Easter Egg.`
    embedoutput.color = 14618131,
    embedsender (message.channel, embedoutput);
  } else

  if (command === "findtest") {
    let index = parseInt(names[0])
    guildconfig.ee[index] = false;
    DataManager.setData(guildconfig, "./guildconfig.json")
    guildconfig = DataManager.getData("./guildconfig.json")
    console.log ("Index :" + index)
    let count = 0
    for(let i = 0; i < guildconfig.ee.length; i++){
      if (guildconfig.ee[i] == true) {
          count++;
      }
    }
    console.log ("Count :" + count)
    console.log ("Oldcount :" + count)
    if (count != guildconfig.oldcount) {
      let channel = message.channel
          clearvar()
          embedauthor ("LAZYbot#9000", "https://i.imgur.com/pvh3yXm.png")
          embedoutput.description = `**${count}** Easter Eggs remaining.`
          embedoutput.color = 14618131,
          channel.send ({embed: embedoutput})
      guildconfig.oldcount = count;
      DataManager.setData(guildconfig, "./guildconfig.json")
      clearvar()
      embedauthor ("LAZYbot#9000", "https://i.imgur.com/pvh3yXm.png")
      embedoutput.description = `**${message.author.tag}** has found the Easter Egg trigger '**trigger${index}**'`;
      embedoutput.color = 14618131,
      embedsender (channel, embedoutput);
    }
  }

  if (command === "findmanual") {
    let index = parseInt(names[0])
    let user = getuser(names[1])
    let member = getmemberfromuser(user)
    let trigger = names[2]
    let channel = getchannelfromname ("announcements-main");
    channel.fetchMessage("429989672517632032")
      .then (message => {
        clearvar()
        embedauthor ("LAZYbot#9000", "https://i.imgur.com/pvh3yXm.png")
        embedoutput.description = `**${count}** Easter Eggs remaining.`
        embedoutput.color = 14618131,
        message.edit ({embed: embedoutput})
      })
      .catch (console.error);
    count = guildconfig.oldcount
    clearvar()
    embedauthor ("LAZYbot#9000", "https://i.imgur.com/pvh3yXm.png")
    embedoutput.description = `**${user.tag}** has found the Easter Egg trigger '**${trigger}**'`;
    embedoutput.color = 14618131,
    embedsender (channel, embedoutput);
    }

});

client.login(process.env.TOKEN ? process.env.TOKEN : config.token);

//this function is to be made irrelevant as soon as possible

function fakekill (dbindex) {
  clearvar();
  let tally = DataManager.getData();
  let channel = getchannelfromname ("off-topic");
  let dbuser = tally[dbindex];
  embedoutput.description = `**${tally[dbindex].username}** has been kicked from **${guild.name}**. Had **${tally[dbindex].messages ? dbuser.messages.toLocaleString() : 0}** messages. Mwahahahaha.`;
  embedoutput.color = 15406156;
  if (dbuser.lastmessage) {embedfielder ("Last Message", "```" + dbuser.lastmessage + "```")};
  embedsender (channel, embedoutput);
}

function cr (message, trigger, reply, index) {

    if (trigger) {
        if (trigger === "all") {
            embedauthor ("LAZYbot#9000", "https://i.imgur.com/pvh3yXm.png")
            embedoutput.description = reply
            embedoutput.color = 14618131,
            embedsender (message.channel, embedoutput);
        } else {
            if (message.content.toLowerCase().replace(/[.,#!$%\^&;:'?{}<>=-_`\"~()]/g,"").includes(trigger.toLowerCase())) {
                embedauthor ("LAZYbot#9000", "https://i.imgur.com/pvh3yXm.png")
                embedoutput.description = reply
                embedoutput.color = 14618131,
                embedsender (message.channel, embedoutput);
                if (!index) return;
                guildconfig.ee[index] = false;
                console.log ("Index :" + index)
                DataManager.setData(guildconfig, "./guildconfig.json")
                guildconfig = DataManager.getData("./guildconfig.json")
                let count = 0
                for(let i = 0; i < guildconfig.ee.length; i++){
                  if (guildconfig.ee[i] == true) {
                      count++;
                  }
                }
                console.log ("Count :" + count)
                console.log ("OldCount :" + guildconfig.oldcount)
                if (count != guildconfig.oldcount) {
                  let channel = getchannelfromname ("announcements-main");
                  channel.fetchMessage("429989672517632032")
                    .then (message => {
                      clearvar()
                      embedauthor ("LAZYbot#9000", "https://i.imgur.com/pvh3yXm.png")
                      embedoutput.description = `**${count}** Easter Eggs remaining.`
                      embedoutput.color = 14618131,
                      message.edit ({embed: embedoutput})
                    })
                    .catch (console.error);
                  guildconfig.oldcount = count;
                  DataManager.setData(guildconfig, "./guildconfig.json")
                  clearvar()
                  embedauthor ("LAZYbot#9000", "https://i.imgur.com/pvh3yXm.png")
                  embedoutput.description = `**${message.author.tag}** has found the Easter Egg trigger '**${trigger}**'`;
                  embedoutput.color = 14618131,
                  embedsender (channel, embedoutput);
                }
            };
        };
    };
  };
  
  // emoji reactions service
  function er (message, command, args) {
  
    let member = getmemberfromuser (message.author);
    if (message.author.id !== owner.id) return;
    if (!checkrole (member, "mods")) return;
  
    if (command === "aer") {
      let erca = args[2] ? true : false;
      let emoji = getemojifromname (args[1]);
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
  let user = client.users.find(user => snowflake == user.id)
  console.log (user ? "ID Found!" : "No id found, checking username...");
  return user;
};

function getuserfromusername (string, exactmode) {
  let user = client.users.find(user => exactmode ? user.username.toLowerCase() == string.toLowerCase() : user.username.toLowerCase().startsWith(string.toLowerCase()));
  console.log (user ? "Username found!" : "No username found, checking tag...");
  return user;
};

function getuserfromtag (string) {
  let user = client.users.find(user => string.toLowerCase() == user.tag.toLowerCase())
  console.log (user ? "Tag found!" : "No tag found, checking nickname...");
  return user;
};

function getuserfromnickname (string, exactmode) {
  let member = guild.members.find(member => member.nickname && (exactmode ? member.nickname.toLowerCase() == string.toLowerCase() : member.nickname.toLowerCase().startsWith(string.toLowerCase())))
  console.log (member ? "Nickname found!" : "No nickname found.");
  if (member == null) {return member} else {return member.user};
};

function getmemberfromuser (user) {
  let member = guild.members.find(member => user.id == member.id)
  console.log (member ? "Member found!" : "No member found.");
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
  embedoutput.description = update ? `Message count for **${user.tag}** is now **${dbuser.messages.toLocaleString()}** messages.` : `**${user.tag}** has sent **${dbuser.messages.toLocaleString()}** messages.`;
  embedsender (message.channel, embedoutput);
  embedoutput = {};
  
};

function getdbuserfromuser (user) {

  let tally = DataManager.getData();
  let dbuser = tally.find(dbuser => dbuser.id == user.id);
  if (dbuser == null) {
    console.log ("No dbuser found, creating one...");
    let newuser = dbtemplate;
    newuser.id = user.id;
    newuser.username = user.username;
    tally.push (newuser);
    DataManager.setData(tally);
    console.log ("User " + newuser.username + " has been logged in the database!");
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
  let tally = DataManager.getData();
  let dbuser = getdbuserfromuser (user);
  let member = getmemberfromuser (user);
  let rolelist = getmemberroles (member);
  let dbindex = getdbindexfromdbuser (dbuser);
  rolelist.splice(0, 1);
  var roles = "";
  var trophies = "";
  var region = "None set.";
  var lastmessage;
  var ratingData;
  for (let i = 0; i < rolelist.length; i++) {
    roles +=  rolelist[i] + (i < rolelist.length -1 ? `\n` : ``)
  };
  for (let i = 0; i < tally[dbindex].trophies.length; i++) {
    trophies +=  tally[dbindex].trophies[i] + (i < tally[dbindex].trophies.length -1 ? `\n` : ``)
  };
  for (let i = 0; i < guildconfig.regions.length; i++) {
    let role = getrolefromname (guildconfig.regions[i]);
    if (checkrole (member, role.name)) {
      region = guildconfig.regions[i];
    };
  };
  if (dbuser.lastmessage) {lastmessage = (dbuser.lastmessagedate ? `\nSent at ${getISOtime (dbuser.lastmessagedate)}.` : "") + (dbuser.lastmessage.startsWith("<:") && dbuser.lastmessage.endsWith (">") ? "\n" + dbuser.lastmessage : "\`\`\`" + dbuser.lastmessage + "\`\`\`")}
  if (dbuser.source) {ratingData =
    (dbuser.ratings.classical ? "Classical: **" + dbuser.ratings.classical + "**\n" : "") +
    (dbuser.ratings.rapid ? "Rapid: " + dbuser.ratings.rapid + "\n" : "") +
    (dbuser.ratings.blitz ? "Blitz: " + dbuser.ratings.blitz + "\n" : "") +
    (dbuser.ratings.bullet ? "Bullet: " + dbuser.ratings.bullet + "": "")};
  embedauthor (`Profile for ${user.tag}`, user.bot ? "https://i.imgur.com/9kS9kxb.png" : "")
  if (dbuser.finger) {
    embedoutput.description = "```" + dbuser.finger + "```";
  };
  let sourceURL = dbuser.source.toLowerCase() === "lichess" ? config.lichessProfileURL : config.chesscomProfileURL;
  embedoutput.color = getrandomdecimalcolor();
  embedthumbnail (user.avatarURL)
  embedfielder ("User ID", user.id, member.nickname ? true : false)
  if (member.nickname) {embedfielder ("a.k.a.", member.nickname, true)}
  embedfielder (`Joined Discord`, getISOtime (user.createdTimestamp).slice(4, 24), true) 
  embedfielder (`Joined ${guild.name}`, getISOtime (member.joinedTimestamp).slice(4, 24), true)
  if (dbuser.messages) {embedfielder ("Messages Sent", dbuser.messages.toLocaleString(), true)}
  embedfielder ("Region", region, true)
  if (dbuser.source) {embedfielder (`${dbuser.source}`, `[${dbuser[dbuser.source.toLowerCase()]}](${(sourceURL.replace("|", dbuser[dbuser.source]))})\n${ratingData}`, user.avatarURL ? true : false)}
  if (dbuser.lastmessage) {embedfielder ("Last Message", lastmessage, false)}
  // embedfielder ("Roles", roles ? roles : "None", true)
  if (trophies) {embedfielder ("House Trophies", trophies, true)}
  embedfooter ("Use !finger to change your finger message.")
  return embedoutput;
  // + \n\u200B
};

// embed section of functions

function embedsender (channel, embedoutput) {
  
  channel = channel.channel ? channel.channel : channel;
  embedoutput.color = embedoutput.color ? embedoutput.color : guildconfig.color;
  channel.send(embedoutput.content, {embed: embedoutput})
  clearvar()

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

  return embedinput;

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

function getrandomdecimalcolor () {
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

function inputstring (string) {
  let newstring = (string.startsWith (`\"`) && string.endsWith (`\"`)) ? string.slice(1, string.length -1) : string;
  console.log (newstring);
  return newstring;
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
  console.log (`Will backup in ${time.days} days, ${time.hours} hours, ${time.minutes} minutes, and ${time.seconds} seconds.`)
  degree = degree ? degree : "1";
  if ((degree !== "1") && (degree !== "2") && (degree !== "3")) {degree = "1"};
  if (interval) {
    setInterval(() => {
      DataManager.setData(tally);
      console.log (`Database backed up to dbbackup${degree} at ${gettime (Date.now())}.`);
      config.backupdb[degree - 1] = getISOtime (Date.now())
      DataManager.setData(config, "./config.json");
    }, interval);
  } else if (!interval) {
      DataManager.setData(tally);
      console.log (`Database backed up to dbbackup${degree} at ${getISOtime (Date.now())}.`);
      config.backupdb[degree - 1] = getISOtime (Date.now())
      DataManager.setData(config, "./config.json");
  }
  return true;
};

function restoredb (degree) {
  degree = degree ? degree : "1";
  let backup = JSON.parse(fs.readFileSync(`./dbbackup${degree}.json`, "utf8"));
  DataManager.setData(backup);
  return true;
};

function onModError(serverID, message) {
  let channel = getModChannel(client.guilds.get(serverID));
  channel.send(message).catch((e) => console.log(JSON.stringify(e)));
}

function onTrackError(serverID, message) {
  let channel = getchannelfromname ("spam");
  console.log (message);
  senderrormessage (channel, message);
}

function canManageRoles(member) {
  return member.permissions.has(Discord.Permissions.FLAGS.MANAGE_ROLES);
}

function capitalise(str) {
  return str[0].toUpperCase() + str.slice(1).toLowerCase();
}

function onRemoveSuccess(serverID, userID, username) {
  let channel = getchannelfromname ("spam");
  let user = getuser (userID);
  let member = getmemberfromuser (user);
  embedoutput.title = `Stopped tracking via !remove command`;
  embedoutput.description = `No longer tracking **${user.tag}**`;
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

function onTrackSuccess(serverID, userID, ratingData, source, username) {
  let newRole = getrolefromname ("EikaBotTester");
  // let newRole = findRoleForRating(guild, ratingData.maxRating);
  let botChannel = getBotChannel(guild);
  if(!newRole) {
    console.log("Could not find a valid role for rating " + ratingData.maxRating)
    .catch((e) => console.log(JSON.stringify(e)));
    return;
  }

  let user = getuser (userID);
  let member = getmemberfromuser (user);

  //If user has an unranked role, remove it
  let unranked = member.roles.find("name", guildconfig.unrankedRoleName);
  if(unranked) {
    member.removeRole(unranked).catch((e) => console.log(JSON.stringify(e)));
  }
  if(source === "Chesscom") {
    source = "Chess.com";
  }
  //Add a rating role
  member.addRole(newRole).then(() => {
    let channel = getchannelfromname ("spam");
    embedoutput.title = `Linked ${member.user.username} to '${username}' on ${source}`
    embedoutput.description = `[${username}](${(source === "Lichess" ? config.lichessProfileURL : config.chesscomProfileURL).replace("|", username)})\nAdded to the role **${newRole.name}**. You have a rating of **${ratingData.maxRating}**\n` + 
    (ratingData.classical ? "Classical: **" + ratingData.classical + "**\n" : "") +
    (ratingData.rapid ? "Rapid: **" + ratingData.rapid + "**\n" : "") +
    (ratingData.blitz ? "Blitz: **" + ratingData.blitz + "**\n" : "") +
    (ratingData.bullet ? "Bullet: **" + ratingData.bullet + "**": "");
    embedoutput.color = config.ratingcolor;
    embedsender (channel, embedoutput).catch((e) => console.log(JSON.stringify(e)));
  }).catch(function(error) {
    console.log("Error adding new role", error);
  });
}

function onRatingUpdate(serverID, userID, oldData, ratingData, source, username) {
  let guild = client.guilds.get(serverID);
  let botChannel = getBotChannel(guild);
  let user = getuser (userID);
  let member = getmemberfromuser (user);
  if(source === "Chesscom") {
    source = "Chess.com";
  }
  if(!member) {
    console.log(username + " (" + source + ") not found on the server. Removing from tracking");
    tracker.remove(guild.id, userID);
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
      let title = "Updated " + member.nickname + " as '" + username + "' on " + source;
      let description = "New rating group **" + newRole.name + "** with a rating of **" + ratingData.maxRating + "**\n" +
        (ratingData.classical ? "Classical: **" + ratingData.classical + "**\n" : "") +
        (ratingData.rapid ? "Rapid: **" + ratingData.rapid + "**\n" : "") +
        (ratingData.blitz ? "Blitz: **" + ratingData.blitz + "**\n" : "") +
        (ratingData.bullet ? "Bullet: **" + ratingData.bullet + "**": "");
      botChannel.send({
        "embed": {
          "title": title,
          "description": description,
          "color": config.ratingcolor
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