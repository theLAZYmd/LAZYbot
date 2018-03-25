const Discord = require("discord.js");
const client = new Discord.Client();
const fs = require("fs");

const config = require("./config.json");
const package = require("./package.json");
const tally = JSON.parse(fs.readFileSync("./messagelog.json", "utf8"));

  var i;
  var j;
  var k;
      dbcounter = [];
      userData = [];
      messageID = [];
      embedoutput = [];
      embedoutput.footer = [];
      sendembed = [];
      trigger = [];
      reponse = [];
      fetchedmessage = [];
      lastmessage = [];
      role = [];
      rolename = [];
      checkuser = [];
      member = [];
      user = [];

      killboolean = false;
      iboolean = false;
      modboolean = false;
      roleboolean = false;
      offlineboolean = false;

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
  guild = client.guilds.get(config.guild);
  nadekobot = guild.members.get("116275390695079945");
});

//repeated stuff section
/*client.on("ready", () => {
  var interval = setInterval (checkbounceronline(), 600000);
}); */

//section for message logging

client.on("message", message => {
  
  if (message.author.bot) return;

  let userid = message.author.id;

  usersearchparameter (message, userid)
  if (dbcounter == undefined) return;
  tally[dbcounter].messages++;

  fs.writeFile("./messagelog.json", JSON.stringify(tally, null, 4), (err) => {
    if (err) console.error(err)
  });
});

//leave message 

client.on("guildMemberRemove", (member) => {

  let guild = member.guild;
  let channel = member.guild.channels.get("390260363410800650");
  dbcounter = null;
  usersearchmessages (member.user.id)
  embedoutput.description = `**${member.user.tag}** has left **${guild.name}**. Had **${dbcounter ? userData[dbcounter].messages.toLocaleString() : 0}** messages.`;
  embedoutput.color = 15406156;
  embedbuilder (embedoutput);
  channel.send (sendembed);
  embedoutput = {};

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

    if(message.author.id !== config.ownerID) return;

    let [newNadekoPrefix] = args;  
    config.nadekoprefix = newNadekoPrefix
    fs.writeFile("./config.json", JSON.stringify(config, null, 4), (err) => console.error);

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
  } else
  
  if (command === "fetch") {

    let channel = message.channel;
    if (!(args[1] == undefined)) return;
    if (!(args[0].length == 18)) return;

    fetchiemessage(message, args[0]);
    message.channel.send(fetchedmessage);

  } else
  
  if ((command === "botcontingencyplan" || command === "bcp")) {
    checkmod (message.member);
    if (modboolean == false) return; modboolean = false;
    returnrole (nadekobot, "365938486534209536")
    if (roleboolean == true) return;
    let role = guild.roles.get("365938486534209536")
    nadekobot.addRole(role);
    embedoutput.description = `**${message.author.tag}** Successfully added role **${role.name}** to **Nadeko#6685**`;
    embedsender (message, embedoutput);
  } else

  if ((command === "botcontingencyover" || command === "bco")) {
    checkmod (message.member);
    if (modboolean == false) return; modboolean = false;
    returnrole (nadekobot, "365938486534209536")
    if (roleboolean == false) return; roleboolean = false;
    nadekobot.removeRole(role);
    embedoutput.description = `**${message.author.tag}** Successfully removed role **${role.name}** from **Nadeko#6685**`;
    embedsender (message, embedoutput);
  } else

  if ((command === "bàn") || (command === "fb")) {
    args[0] == null ? killboolean = true : killboolean = false;
    message.author.id !== config.ownerID ? killboolean = true : killboolean = false;
    varclear ();
    getuser (args[0]);
    if (killboolean == true) return;
    embedoutput.title = "⛔️ User Banned";
    embedoutput.fields = [];
    embedfielder ("Username", user.tag, true);
    embedfielder ("ID", user.id, true);
    embedsender (message, embedoutput);
    returnrole (member, "390270667154784288")
    if (roleboolean == true) return; roleboolean = false;
    let role = guild.roles.get("390270667154784288");
    member.addRole(role);
  };

});

client.on("message", (message) => {

  if (!message.content.startsWith(config.prefix) || message.author.bot) return;

  const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  if (command === "prefix" || command === "lazybotprefix") {

    if(message.author.id !== config.ownerID) return;

    let [newPrefix] = args;
    config.prefix = newPrefix
    fs.writeFile("./config.json", JSON.stringify(config, null, 4), (err) => console.error);

    message.channel.send(`Prefix has been updated to **${newPrefix}** !`);
    console.log(`${message.author.username} [${message.author.id}] has updated the prefix to ${newPrefix}`);
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
    if (args[0] == null) {
      returnrole (message.member, "401836464071245826")
      if (!(rolename == "Silver")) return;
      let userid = message.author.id;
      messagecount (message, userid);
    } else {
      if(message.author.id !== config.ownerID) return;
      var userid = args[0].replace(/[.,#!$%\^&;:{}<>=-_`~()]/g,"");
      if (!(userid.length == 18)) return;
      console.log (userid);
      let member = guild.members.get(userid);
      if (member == undefined) return;
      let user = member.user;
      console.log (user.username);
      messagecount (message, userid, user);
    }
  } else

  if (command === "lastmessage") {

    getlastmessage (message.author);
    message.channel.send(lastmessage);
    lastmessage = [];

  }

  cr (message, "marco", "polo!");
  cr (message, "ready", "I am ready!");
  cr (message, "owner", "theLAZYmd#2353");
  cr (message, "who", "I am LAZYbot#2309");
  cr (message, "help", "This is a pretty basic bot, there isn't much it can help you with.");
  cr (message, "party", ":tada:");
  cr (message, "test", "I'm working!");

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

function getlastmessage (author) {

  lastmessage = author.lastMessage.content;

}

function fetchiemessage (message, longmessageid) {

  message.channel.fetchMessage(longmessageid)
  .then ((message) => {
    let fetchedmessage = message.content;
  });

  function postembed (message, whichguide) {

    message.channel.send(guide.whichguide)

  }

};

function getuser (argument) {
  var userid = argument.replace(/[.,#!$%\^&;:{}<>=-_`~()]/g,"");
  if (!(userid.length == 18)) {killboolean = true};
  guild = client.guilds.get(config.guild);
  member = guild.members.get(userid);
  if (member == undefined) return;
  user = member.user;
}

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

function varclear () {
  embedoutput = {};
  member = [];
  user = [];
  userid = [];
  killboolean = false;
}

function checkmod (member) {
  returnrole (member, "390253470172708876")
  if (rolename == "mods") {modboolean = true};
  role = [];
  rolename = [];
};

function returnrole (member, rolecheck) { //used to check if member has role
  if (member.roles.get(rolecheck) == null) {
    role = null;
    roleboolean = false;
  } else {
    role = member.roles.get(rolecheck);
    rolename = member.roles.get(rolecheck).name;
    roleboolean = true;
  };
 
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

function cr (message, trigger, reponse) {

  const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();
  const response = reponse;

  if(command === trigger) {message.channel.send(response)};

};

function usersearchparameter (message, parameter, author) {

  author ? author = author : author = message.author;

  if (message.author.bot) return;

  let checkthing = parameter;

  for (let i = 0; i < tally.length; i++) {
    
    userData[i] = tally[i];

    if (tally[i].userid == checkthing) {
      iboolean = true
      dbcounter = i;
    };
  }

  if (iboolean == false) {
    if (parameter == undefined) return;
    if (author.tag == undefined) return;
    tally.push ({
      userid: parameter,
      username: author.tag,
      messages: 0,
    })
  if (tally == undefined) return;

  fs.writeFile("./messagelog.json", JSON.stringify(tally, null, 4), (err) => {
    if (err) console.error(err)
  });

  for (let i = 0; i < tally.length; i++) {
    
    userData[i] = tally[i];

    if (tally[i].userid == checkthing) {
      iboolean = true
      dbcounter = i;
    };
  }

}};

function usersearchmessages (id) {

  let checkthing  = id;
  iboolean = false;

  for (let i = 0; i < tally.length; i++) {
    
    userData[i] = tally[i];

    if (tally[i].userid == checkthing) {
      iboolean = true
      dbcounter = i;
    };
  }


}; 

function messagecount (message, userid, author) {
  author ? author = author : author = message.author;
  usersearchparameter(message, userid, author)
  embedoutput.description = `**${author.tag}** has sent **${userData[dbcounter].messages.toLocaleString()}** messages.`
  embedsender (message, embedoutput);
  embedoutput = {};

}
