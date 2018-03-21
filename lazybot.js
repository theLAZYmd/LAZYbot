const Discord = require("discord.js");
const client = new Discord.Client();
const fs = require("fs");

const config = require("./config.json");
const package = require("./package.json");
const tally = JSON.parse(fs.readFileSync("./messagelog.json", "utf8"));

const nadekoprefix = config.nadekoprefix;
const prefix = config.prefix;
const nadekoid = config.nadekoID;
  var i;
  var j;
  var k;
      userData = [];
      messageID = [];
      embedoutput = [];
      embedoutput.footer = [];
      sendembed = [];
      trigger = [];
      reponse = [];
      placeholder = [];
      randomboolean = [];
      fetchedmessage = [];
      lastmessage = [];
      role = [];

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

//section for message logging

client.on("message", message => {
  
  if (message.author.bot) return;

  let userid = message.author.id;

  usersearchparameter (message, userid)

  tally[placeholder].messages++;

  fs.writeFile("./messagelog.json", JSON.stringify(tally, null, 4), (err) => {
    if (err) console.error(err)
  });
});

//leave message 

client.on("guildMemberRemove", (member) => {

  let guild = member.guild;
  let channel = member.guild.channels.get("390260363410800650");
  usersearchmessages (member.user.id)
  embedoutput.description = `**${member.user.tag}** has left **${guild.name}**. Had **${userData[placeholder].messages ? 0 : userData[placeholder].messages}** messages.`;
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

    if(message.author.id != config.ownerID) return;

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

  };

});

client.on("message", (message) => {

  if (!message.content.startsWith(config.prefix) || message.author.bot) return;

  const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  if (command === "prefix" || command === "lazybotprefix") {

    if(message.author.id != config.ownerID) return;

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
    returnrole (message.member, "401836464071245826")
    if (!(role == "Silver")) return;
    let userid = message.author.id;
    messagecount (message, userid);
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

  if ((
      !message.content.startsWith ("Final Results")
  ||  !message.content.startsWith ("Trivia Game Ended"))
  && (message.embeds[0].author == undefined
  ||  message.embeds[0].title == undefined
  ||  message.embeds[0].description == undefined
  ||  !(message.embeds[0].title == "Trivia Game Ended" || message.embeds[0].title == "Final Results" )
))
  return;

  for (let i = 0; i < args.length; i++) {
    name[i] = args[i].split(/ +/g).shift();
    name[i] = name[i].split("*").join("");
    }

  if (name[0] == "No results") return;
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

function embedsender (message, embedoutput) {

  embedbuilder (embedoutput);

  message.channel.send(sendembed);

  embedoutput.footer = [];

}

function embedbuilder (embedoutput) {

  if (!(embedoutput.field == undefined)) {

    for (i = 0; i < embedoutput.field.length; i++) {

      embedoutput.field[i].inline = (embedoutput.field[i].inline == undefined ? false : embedoutput.field[i].inline );

      embedoutput.field = `{
        name: ${embedoutput.field[i].name},\n
        value: ${embedoutput.field[i].value}\n
        inline: ${embedoutput.field[i].inline}\n
      }`
    }

    for (i = 0; i < embedoutput.field.length; i++) {
      embedoutput.fields += embedoutput.field[i] + (i < embedoutput.field.length -1 ? `,\n` : ``)
      }
    };

    embedoutput.color = (embedoutput.color == undefined ? config.color : embedoutput.color );
    embedoutput.author = embedoutput.name + `, ` + client.user.avatarURL;
    embedoutput.footer = [];

  sendembed = {embed: {
    author: {
      name: embedoutput.name,
      icon_url: client.user.avatarURL
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

function returnrole (member, rolecheck) {
  rolecheck = rolecheck;
  role = null;
  if (member.roles.get(rolecheck) == null) {role = null} else {role = member.roles.get(rolecheck).name};
}

function cr (message, trigger, reponse) {

  const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();
  const response = reponse;

  if(command === trigger) {message.channel.send(response)};

};

function usersearchparameter (message, parameter) {

  if (message.author.bot) return;

  let checkthing  = parameter;
  randomboolean = false;

  for (let i = 0; i < tally.length; i++) {
    
    userData[i] = tally[i];

    if (tally[i].userid == checkthing) {
      randomboolean = true
      placeholder = i;
    };
  }

  if (randomboolean == false) {
    tally.push ({
      userid: parameter,
      username: message.author.tag,
      messages: 0,
    })
  fs.writeFile("./messagelog.json", JSON.stringify(tally, null, 4), (err) => {
    if (err) console.error(err)
  });

  for (let i = 0; i < tally.length; i++) {
    
    userData[i] = tally[i];

    if (tally[i].userid == checkthing) {
      randomboolean = true
      placeholder = i;
    };
  }

}};

function usersearchmessages (id) {

  let checkthing  = id;
  randomboolean = false;

  for (let i = 0; i < tally.length; i++) {
    
    userData[i] = tally[i];

    if (tally[i].userid == checkthing) {
      randomboolean = true
      placeholder = i;
    };
  }


};

function messagecount (message, userid) {

  usersearchparameter(message, userid)

  embedoutput.description = `**${message.author.tag}** has sent **${userData[placeholder].messages.toLocaleString()}** messages.`
  embedsender (message, embedoutput);
  embedoutput = {};

}
