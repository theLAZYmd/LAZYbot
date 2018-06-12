const Discord = require("discord.js");
const client = new Discord.Client();
const fs = require("fs");
const config = require("./config.json");
const guildconfig = require("./guildconfig.json");
const package = require("./package.json");
const tally = JSON.parse(fs.readFileSync("./db.json", "utf8"));
const dbtemplate = config.template;

var guild;
var bouncerbot;
var nadekobot;
var owner;
var reboot;

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

var acceptedlinkdomains = [
  "http://lichess.org",
  "http://www.chess.com",
  "http://bughousetest.com",
  "https://lichess.org",
  "https://www.chess.com",
  "https://bughousetest.com"
];
var regions = [
  "Americas",
  "Europe",
  "Middle East / Africa",
  "Asia / Australia",
];

//section for message logging

client.on("message", message => {
  
  if (message.author.bot) return;
  let user = message.author;
  let dbuser = getdbuserfromuser (user);
  let dbindex = getdbindexfromdbuser (dbuser)
  if (dbindex == -1) return;

  tally[dbindex].messages++;
  if (!((message.content.startsWith(guildconfig.prefix)) || (message.content.startsWith(guildconfig.nadekoprefix)))) {
    tally[dbindex].lastmessage = message.content > 500 ? message.content.slice(0, 500).replace("\`") + "..." : message.content.replace("\`");
    tally[dbindex].lastmessagedate = message.createdTimestamp;
  };
  if (tally == undefined) return;
  fs.writeFile("./db.json", JSON.stringify(tally, null, 4), (err) => {
    if (err) console.error(err)
  });
});

//leave message 

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
//section for commands that integrate with Nadeko

client.on("message", (message) => {

  if (!message.content.startsWith(guildconfig.nadekoprefix) || message.author.bot) return;

  const args = message.content.slice(guildconfig.nadekoprefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();
  const argument = message.content.slice(command.length + guildconfig.nadekoprefix.length).trim();

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
    guildconfig.nadekoprefix = newNadekoPrefix
    fs.writeFile("./guildconfig.json", JSON.stringify(guildconfig, null, 4), (err) => console.error);

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

  if (!message.content.startsWith(guildconfig.prefix) || message.author.bot) return;

  const args = message.content.slice(guildconfig.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();
  const argument = message.content.slice(command.length + guildconfig.nadekoprefix.length).trim();

  if (command === "prefix" || command === "lazybotprefix") {

    if (message.author.id !== owner.id) return;

    let newPrefix = argument;
    guildconfig.prefix = newPrefix
    fs.writeFile("./guildconfig.json", JSON.stringify(guildconfig, null, 4), (err) => console.error);

    message.channel.send(`Prefix has been updated to **${newPrefix}** !`);
    console.log (`${message.author.username} [${message.author.id}] has updated the prefix to ${newPrefix}`);
  } else

  if (command === "setusername") {
    if (message.author.id !== owner.id) return;
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
    
    if (message.author.id !== owner.id) return;
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
      tally[dbindex].messages = newcount;
      if (tally == undefined) return;
      fs.writeFile("./db.json", JSON.stringify(tally, null, 4), (err) => {
        if (err) console.error(err)
      });
      messagecount (message.channel, user, true);
    };
  } else

  if (command === "removedbuser") {
    
    if (message.author.id !== owner.id) return;
    clearvar()
    let user = getuser (args[0], true)
    let dbuser = user ? getdbuserfromuser (user) : getdbuserfromusername (args[0]);
    if (!dbuser) return;
    let dbindex = getdbindexfromdbuser (dbuser)
    if (dbindex == -1) return;

    delete tally[dbindex];
    if (tally == undefined) return;
    fs.writeFile("./db.json", JSON.stringify(tally, null, 4), (err) => {
      if (err) console.error(err)
    });
    
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
        lastmessage = (dbuser.lastmessagedate ? `\nSent at ${getISOtime (dbuser.lastmessagedate)}.` : "") + (dbuser.lastmessage.startsWith("<:") && dbuser.lastmessage.endsWith (">") ? "\n" + dbuser.lastmessage : "\`\`\`" + dbuser.lastmessage + "\`\`\`");
        embedoutput.title = "Last Message";
        embedoutput.description = lastmessage;
        embedsender (message.channel, embedoutput);
      };
    }
  } else

  if ((command === "commands") || (command === "lazybotcommands")) {

    embedoutput.description = "**Nadeko functions**\n```css\n.nadekoprefix        [newPrefix]    {owneronly}\n.fb                  [user]         {owneronly}\n.bcp                 [e/d]          {modsonly}\n.testingmode         [e/d]          {devonly}\n.mf                  [g,t,i]\n.tf                  [g,t,i]\n.decimaltous         [decimalodds]\n.ustodecimal         [usodds]\n.fetch               [messageid]\n.notify              [valid link]```\n**Bot functions**\n```css\n!prefix              [newPrefix]    {owneronly}\n!setusername         [newUsername]  {owneronly}\n!updatemessagecount  [user,msgs]    {owneronly}\n!removedbuser        [user]         {owneronly}\n!asl                 [a,s,l]\n!ping                []\n!uptime              []\n!messages            []\n!lastmessage         []\n!commands            []```\n**Miscellaneous Functions**\n```css\nsubreddit link       [/r/,r/]\nmessage counter      [message]\nleave message        [userLeft]\ntrivia payout msg    [embed,content]```";
    embedthumbnail (config.avatar);
    embedsender (message.channel, embedoutput);

  }  else

  if (command === "profile") {
    let user = argument ? getuser (argument) : message.author;
    if (user == null) {
      senderrormessage(message.channel, `No user found.`)
    } else {
      let embedoutput = getprofile (user);
      embedsender (message.channel, embedoutput);
    }
  } else

  if (command === "addfield") {
    if (message.author.id !== owner.id) return;
    clearvar()
    let newfield = args[0].replace(/[.,#!$%\^&;:{}<>=-_`\"~()]/g,"");
    if (!newfield) return;

    if (tally[0][newfield] || (tally[0][newfield] == "")) {
      senderrormessage (message.channel, "Field already exists!")
    } else {
      for (i = 0; i < tally.length; i++) {
        tally[i][newfield] = ""};
      if (tally == undefined) return;
      fs.writeFile("./db.json", JSON.stringify(tally, null, 4), (err) => {
        if (err) console.error(err)
      })
      sendgenericembed (message, `New field **${newfield}** has been added to each user in db.`);
    };
    
  } else

  if (command === "setfield") {
    if (message.author.id !== owner.id) return;
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
        fs.writeFile("./db.json", JSON.stringify(tally, null, 4), (err) => {
          if (err) console.error(err)
        })
        sendgenericembed (message, `Field **${newfield}** has been set to **${content}** for every user in db.`);
      };
  } else

  if (command === "removefield") {
    if (message.author.id !== owner.id) return;
    clearvar()
    let newfield = args[0].replace(/[.,#!$%\^&;:{}<>=-_`\"~()]/g,"");
    if (!newfield) return;

    if (tally[0][newfield] == undefined) {
      senderrormessage (message.channel, "Field does not exist!")
    } else {
      for (i = 0; i < tally.length; i++) {
        delete tally[i][newfield]};
      if (tally == undefined) return;
      fs.writeFile("./db.json", JSON.stringify(tally, null, 4), (err) => {
        if (err) console.error(err)
      })
      sendgenericembed (message, `Field **${newfield}** has been deleted from each user in db.`);
    };
    
  } else

  if (command === "finger") {
    clearvar()
    let user = message.author;
    let newfinger = inputstring (argument);
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
      senderrormessage (message, `Finger must be within **500** characters.`);
    } else
    if (dbuser.finger == newfinger) {
      senderrormessage (message.channel, `Finger for **${user.tag}** was already as posted.`);
    } else {
      tally[dbindex].finger = newfinger === "clear" ? "" : newfinger;
      if (tally == undefined) return;
      fs.writeFile("./db.json", JSON.stringify(tally, null, 4), (err) => {
        if (err) console.error(err)
      });
      sendgenericembed (message.channel, `Finger for **${user.tag}** has been` + (newfinger === "clear" ? " cleared" : " updated."))
    };
  };

  if (command === "addtrophy") {
    if (message.author.id != owner.id) return;
    let user = getuser (args[0])
    let newtrophy = argument.slice(args[0].length + 1, argument.length)
    if (user == null) return;
    let dbuser = getdbuserfromuser (user);
    if (!dbuser) return;
    let dbindex = getdbindexfromdbuser (dbuser)
    if (dbindex == -1) return;
    if (!dbuser.trophies) {
      tally[dbindex].trophies.push = newtrophy;
      if (tally == undefined) return;
      fs.writeFile("./db.json", JSON.stringify(tally, null, 4), (err) => {
        if (err) console.error(err)
      });
      sendgenericembed (message.channel, `Trophy **${newtrophy}** added for **${user.tag}**.`)
    } else
    if (dbuser.trophies.includes (newtrophy)) {
      senderrormessage (message.channel, `**${user.tag}** already had trophy **${newtrophy}**.`);
    } else {
      tally[dbindex].trophies.push(newtrophy);
      if (tally == undefined) return;
      fs.writeFile("./db.json", JSON.stringify(tally, null, 4), (err) => {
        if (err) console.error(err)
      });
      sendgenericembed (message.channel, `Trophy **${newtrophy}** added for **${user.tag}**.`)
    };
  } else

  if (command === "updatetrophy") {
    if (message.author.id != owner.id) return;
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
    fs.writeFile("./db.json", JSON.stringify(tally, null, 4), (err) => {
      if (err) console.error(err)
    });
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
      args[i] = args[i].replace(/[.,#!$%\^&;:{}<>=-_`~()]/g,"");
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
    let newuser = dbtemplate;
    newuser.id = user.id;
    newuser.username = user.username;
    tally.push (newuser);
    fs.writeFile("./db.json", JSON.stringify(tally, null, 4), (err) => {
      if (err) console.error(err)
    });
    console.log ("User " + newuser.username + " has been logged in the database!");
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
  let dbuser = getdbuserfromuser (user);
  let member = getmemberfromuser (user);
  let rolelist = getmemberroles (member);
  let dbindex = getdbindexfromdbuser (dbuser);
  rolelist.splice(0, 1);
  var roles = "";
  var trophies = "";
  var region = "None set.";
  var lastmessage;
  for (let i = 0; i < rolelist.length; i++) {
    roles +=  rolelist[i] + (i < rolelist.length -1 ? `\n` : ``)
  };
  for (let i = 0; i < tally[dbindex].trophies.length; i++) {
    trophies +=  tally[dbindex].trophies[i] + (i < tally[dbindex].trophies.length -1 ? `\n` : ``)
  };
  for (let i = 0; i < regions.length; i++) {
    let role = getrolefromname (regions[i]);
    if (checkrole (member, role.name)) {
      region = regions[i];
    };
  };
  if (dbuser.lastmessage) {lastmessage = (dbuser.lastmessagedate ? `\nSent at ${getISOtime (dbuser.lastmessagedate)}.` : "") + (dbuser.lastmessage.startsWith("<:") && dbuser.lastmessage.endsWith (">") ? "\n" + dbuser.lastmessage : "\`\`\`" + dbuser.lastmessage + "\`\`\`")}
  embedauthor (`Profile for ${user.tag}`, user.bot ? "https://i.imgur.com/9kS9kxb.png" : "")
  if (dbuser.finger) {
    embedoutput.description = "```" + dbuser.finger + "```";
  };
  embedoutput.color = getrandomdecimalcolor();
  embedthumbnail (user.avatarURL)
  embedfielder ("User ID", user.id, member.nickname ? true : false)
  if (member.nickname) {embedfielder ("a.k.a.", member.nickname, true)}
  embedfielder (`Joined Discord`, getISOtime (user.createdTimestamp).slice(4, 24), true) 
  embedfielder (`Joined ${guild.name}`, getISOtime (member.joinedTimestamp).slice(4, 24), true)
  if (dbuser.messages) {embedfielder ("Messages Sent", dbuser.messages.toLocaleString(), true)}
  embedfielder ("Region", region, true)
  if (dbuser.lastmessage) {embedfielder ("Last Message", lastmessage, false)}
  // embedfielder ("Roles", roles ? roles : "None", true)
  if (trophies) {embedfielder ("House Trophies", trophies, true)}
  embedfooter ("Use !finger to change your finger message.")
  return embedoutput;
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

  const args = message.content.slice(guildconfig.prefix.length).trim().split(/ +/g);
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
  channel.overwritePermissions(user, { 'READ_MESSAGES': false })
  guildconfig.testingmodeboolean = true;
  fs.writeFile(`./guildconfig.json`, JSON.stringify(guildconfig, null, 4), (err) => {
    if (err) console.error(err)
  });
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
  fs.writeFile(`./guildconfig.json`, JSON.stringify(guildconfig, null, 4), (err) => {
    if (err) console.error(err)
  });
};

function backupdb (degree, interval) {
  if (tally == undefined) return;
  degree = degree ? degree : "1";
  if ((degree !== "1") && (degree !== "2") && (degree !== "3")) {degree = "1"};
  if (interval) {
    setInterval(() => {
      fs.writeFile(`./dbbackup${degree}.json`, JSON.stringify(tally, null, 4), (err) => {
        if (err) console.error(err)
      });
      config.backupdb[degree - 1] = getISOtime (Date.now())
      fs.writeFile(`./config.json`, JSON.stringify(config, null, 4), (err) => {
        if (err) console.error(err)
      });
    }, interval);
  } else if (!interval) {
      fs.writeFile(`./dbbackup${degree}.json`, JSON.stringify(tally, null, 4), (err) => {
        if (err) console.error(err)
      });
      config.backupdb[degree - 1] = getISOtime (Date.now())
      fs.writeFile(`./config.json`, JSON.stringify(config, null, 4), (err) => {
        if (err) console.error(err)
      });
  }
  return true;
};

function backupdb (degree) {
  degree = degree ? degree : "1";
  let backup = JSON.parse(fs.readFileSync(`./dbbackup${degree}.json`, "utf8"));
  fs.writeFile(`./db.json`, JSON.stringify(backup, null, 4), (err) => {
    if (err) console.error(err)
  });
  return true;
};