const Discord = require("discord.js");
const client = new Discord.Client();
const fs = require("fs");

const config = require("./config.json");
const package = require("./package.json");
const tally = JSON.parse(fs.readFileSync("./messagelog.json", "utf8"));

  var i;
      dbcounter = [];
      embedoutput = [];
      embedoutput.footer = [];
      sendembed = [];
      fetchedmessage = [];
      lastmessage = [];

//console startup section

client.on("ready", () => {
  console.log ("bleep bloop! It's showtime.");
  var guild = client.guilds.get(config.guild);
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

const guild = client.guilds.get(config.guild);
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
  let dbuser = getdbuserfromuser;
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
  let channel = member.guild.channels.get("390260363410800650");
  let dbuser = getdbuserfromuser (message, user);
  if (dbuser == undefined) return;
  embedoutput.description = `**${member.user.tag}** has left **${guild.name}**. Had **${dbuser.messages ? dbuser.messages.toLocaleString() : 0}** messages.`;
  embedoutput.color = 15406156;
  embedbuilder (embedoutput);
  channel.send (sendembed);

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

    if(message.author.id !== config.ownerID) return;

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
    embedsender (message, embedoutput);

  } else

  if (command === "ustodecimal") {

    let usodds = Number(args[0]);
    if (usodds == NaN) return;
    clearvar();
    embedoutput.title = "US to Decimal Odds";
    embedoutput.color = 16738560;
    if (usodds < 0) {embedoutput.description = (1 - 100/usodds).toFixed(1)};
    if (usodds > 0) {embedoutput.description = (1 + usodds/100).toFixed(1)};
    embedsender (message, embedoutput);

  } else
  
  if (command === "fetch") {

    let channel = message.channel;
    if (!(args[1] == undefined)) return;
    if (!(args[0].length == 18)) return;

    fetchiemessage(message, args[0]);
    message.channel.send(fetchedmessage);

  } else

  if ((command === "botcontingencyplan" || command === "bcp")) {
    clearvar();
    let boolean1 = checkrole (message.member, "mods");
    if (boolean1 == false) return;
    let role = getrolefromname ("Bot-In-Use")
    if (role == undefined) return;
    let boolean2 = checkrole (nadekobot, role.name)
    if (boolean2 == true) return;
    nadekobot.addRole(role);
    embedoutput.description = `**${message.author.tag}** Successfully added role **${role.name}** to **Nadeko#6685**`;
    embedsender (message, embedoutput);
  } else

  if ((command === "botcontingencyover" || command === "bco")) {
    let boolean1 = checkrole (message.member, "mods");
    if (boolean1 == false) return;
    let role = getrolefromname ("Bot-In-Use")
    if (role == undefined) return;
    let boolean2 = checkrole (nadekobot, role.name)
    if (boolean2 == false) return;
    nadekobot.removeRole(role);
    embedoutput.description = `**${message.author.tag}** Successfully removed role **${role.name}** from **Nadeko#6685**`;
    embedsender (message, embedoutput);
  } else 

  if (command === "fb") {
    if ((args[0] == null) || (message.author.id !== config.ownerID)) return;
    clearvar ();
    let user = getuser (args[0]);
    let member = getmemberfromuser (user);
    embedoutput.title = "⛔️ User Banned";
    embedoutput.fields = [];
    embedfielder ("Username", user.tag, true);
    embedfielder ("ID", user.id, true);
    embedsender (message, embedoutput);
    let role = getrolefromname ("muted")
    let boolean1 = checkrole (member, role.name)
    if (boolean1 == true) return;
    member.addRole(role);
  };

});

client.on("message", (message) => {

  if (!message.content.startsWith(config.prefix) || message.author.bot) return;

  const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();
  const argument = message.content.slice(command.length + config.nadekoprefix.length).trim();

  if (command === "prefix" || command === "lazybotprefix") {

    if(message.author.id !== config.ownerID) return;

    let [newPrefix] = args;
    config.prefix = newPrefix
    fs.writeFile("./config.json", JSON.stringify(config, null, 4), (err) => console.error);

    message.channel.send(`Prefix has been updated to **${newPrefix}** !`);
    console.log (`${message.author.username} [${message.author.id}] has updated the prefix to ${newPrefix}`);
  } else

  if(command === "asl") {
    let [age,sex,location] = args;
    message.channel.send(`Hello **${message.author.username}**, I see you're a **${age}** year old **${sex}** from **${location}**.`);
  } else

  if(command === "ping") {
    embedoutput.description = `** ${message.author.tag}** :ping_pong: ${parseInt(client.ping)}ms`
    embedsender (message, embedoutput)
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

  if (command === "lastmessage") {

    getlastmessage (message.author);
    message.channel.send(lastmessage);
    lastmessage = [];

  } else

  if ((command === "updatemessagecount") || (command === "updatemessages")) {
    
    if(message.author.id !== config.ownerID) return;
    clearvar()
    let user = getuser (args[0])
    let newcount = args[1];
    let dbuser = getdbuserfromuser (user)
    console.log (dbuser);
    if (dbuser == undefined) return;
    let dbindex = getdbindexfromdbuser (user)
    if (dbindex == -1) return;
  
    tally[dbindex].messages = newcount;
    if (tally == undefined) return;
    fs.writeFile("./messagelog.json", JSON.stringify(tally, null, 4), (err) => {
      if (err) console.error(err)
    });
    messagecount (message, user, true);
  };

  cr (message, "marco", "polo!");
  cr (message, "ready", "I am ready!");
  cr (message, "owner", "theLAZYmd#2353");
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

    if(args[i].startsWith("/r/")) {
      args[i] = args[i].replace(/[.,#!$%\^&;:{}=-_`~()]/g,"");
      embedoutput.description = `[${args[i]}](http://www.reddit.com${args[i]})`;
      embedsender (message, embedoutput)
      } else

    if(args[i].startsWith("r/")) {
      args[i] = args[i].replace(/[.,#!$%\^&;:{}=-_`~()]/g,"");
      embedoutput.description = `[/${args[i]}](http://www.reddit.com/${args[i]})`;
      embedsender (message, embedoutput)
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

    if (!(message.author.id == config.bouncerID)) return;
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

  embedoutput.footer = [];
  embedoutput.title = `House Trivia ${name.length}-player Game`,
  embedoutput.description = payoutaggregate,
  embedoutput.footer.text = `Please remember to check for ties.`
  embedsender (message, embedoutput);
  embedoutput = {};

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

function clearvar () {
  embedoutput = {};
};

function checkrole (member, rolename) { //used to check if member has role
  clearvar ()
  console.log (rolename);
  let parameter = getrolefromname (rolename)
  if (member.roles.get(parameter.id)) {return true} else {return false};
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
  return user;
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
  let guild = client.guilds.get(config.guild);
  let member = guild.members.find(member => member.nickname && string.toLowerCase() == member.nickname.toLowerCase())
  console.log (member ? "Nickname found!" : "No nickname found.");
  if (member == null) {return member} else {return member.user};
};

function getmemberfromuser (user) {
  clearvar()
  let guild = client.guilds.get(config.guild);
  let member = guild.members.find(member => user.id == member.id)
  console.log (member ? "Member found!" : "No member found.");
  if (member == null) {return} else {return member};
};

function messagecount (message, user, update) {

  user ? user = user : user = message.author;
  let dbuser = getdbuserfromuser (user);
  if (dbuser == undefined) return;
  update ? embedoutput.description = `Message count for **${user.tag}** is now **${dbuser.messages.toLocaleString()}** messages.` : embedoutput.description = `**${user.tag}** has sent **${dbuser.messages.toLocaleString()}** messages.`;
  embedsender (message, embedoutput);
  embedoutput = {};
  
};

function getdbuserfromuser (user) {

  console.log ("ID Found!");
  let dbuser = tally.find(dbuser => user.id == dbuser.userid);
  if (dbuser == null) {
    console.log ("No dbuser found, creating one...");
    tally.push ({
      userid: user.id,
      username: user.tag,
      messages: 0,
    });
    fs.writeFile("./messagelog.json", JSON.stringify(tally, null, 4), (err) => {
      if (err) console.error(err)
    });
  };
  dbuser = tally.find(dbuser => user.id == dbuser.userid);
  return dbuser;

};

function getdbindexfromdbuser (dbuser) {

  return tally.findIndex(index => dbuser.id == index.userid)

};

function embedsender (message, embedoutput) {

  embedbuilder (embedoutput);
  message.channel.send(sendembed);
  embedoutput = {};

};

function embedfielder (name, value, inline) {

  for (i = 0; i < embedoutput.fields.length; i++) {
    embedoutput.fields[i].inline = (embedoutput.fields[i].inline == undefined ? false : embedoutput.fields[i].inline )};
  embedoutput.fields.push({"name": name, "value": value, "inline": inline})

};

function embedauthor (name, icon_url) {

  embedoutput.author = [];
  embedoutput.author.name = name;
  embedoutput.author.icon_url = icon_url;

};

function embedbuilder (embedoutput) {

  embedoutput.color = (embedoutput.color == undefined ? config.color : embedoutput.color );
  embedoutput.author = embedoutput.name + `, ` + client.user.avatarURL;
  embedoutput.footer = [];

  sendembed = {embed: {
    author: {
      name: embedoutput.author.name,
      icon_url: embedoutput.author.icon_url,
    },
    title: embedoutput.title,
    url: embedoutput.url,
    color: embedoutput.color,
    description: embedoutput.description,
    image: embedoutput.image,
    fields: embedoutput.fields,
    timestamp: embedoutput.timestamp,
    footer: {
      icon_url: embedoutput.footer.icon_url,
      text: embedoutput.footer.text
    }

  }};

};

function cr (message, trigger, reponse) {

  const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();
  const response = reponse;

  if(command === trigger) {message.channel.send(response)};

};

function checkuseronline (checkuser) {
  checkuser = checkuser;
  checkuser.presence.status == "offline" ? offlineboolean = true : offlineboolean = false;
}; 

function checkbounceronine () {
  guild = client.guilds.get(config.guild);
  let bouncerbot = guild.members.get(config.bouncerID);
  checkuseronline (bouncerbot);
}

function getlastmessage (member) {

  lastmessage = member.lastMessage.content;

};

function fetchiemessage (message, longmessageid) {

  message.channel.fetchMessage(longmessageid)
  .then ((message) => {
    let fetchedmessage = message.content;
  });

  function postembed (message, whichguide) {

    message.channel.send(guide.whichguide)

  }

};
