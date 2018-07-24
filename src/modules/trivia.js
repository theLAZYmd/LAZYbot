const Parse = require("../util/parse.js");
const DataManager = require("../util/datamanager.js");

class Trivia extends Parse {

  constructor(message) {
    super(message)
  }

  init (args) {
    if(this.server.states.trivia) return;
    for(let i = 0; i < args.length; i++) {
      if(args[i] === "--pokemon" || args[i] === "-p") return;
    };
    this.server.states.trivia = true;
    DataManager.setServer(this.server);
  }

  end () {
    if(!this.server.states.trivia) return;
    this.server.states.trivia = false;
    if(this.server.trivia.players) {
      for(let player in this.server.trivia.players) {
        delete this.server.trivia.players[player];
      }
    };
    DataManager.setServer(this.server);
  }

  onNewMessage () {
    if(this.author.bot) return;
    let trivia = this.server.trivia || {};
    let players = trivia.players || {};
    if(players[this.author.id] || players[this.author.id] === false) return;
    players[this.author.id] = true;
    this.Output.generic(`**${this.author.tag}**: joined rated trivia. Type \`cancel\` in 10s to cancel.`)
    .then(message => {
      let filter = msg => !msg.author.bot && msg.author.id === this.author.id && msg.content && msg.content.toLowerCase() === "cancel";
      let collector = message.channel.createMessageCollector(filter, {
        "time": 10000,
        "max": 1
      })
      collector.on("collect", (msg) => {
        delete players[this.author.id];
        this.Output.generic(`**${this.author.tag}**: is not playing this round of trivia.`);
        msg.delete()
        .catch(e => console.log(e));
      });
      collector.on("end", (collected) => {
        message.delete()
        .catch(e => console.log(e));
      })
    })
    .catch(e => console.log(e));
    trivia.players = players;
    this.server.trivia = trivia;
    DataManager.setServer(this.server);
  }

  rank (message, args, command, argument) {
    if(args.length === 0) {
      let user = message.author;
      let dbuser = getdbuserfromuser(user);
      message.channel.send({embed: {
          title: "**Trivia Rating**",
          description: `**${dbuser.username}** ${dbuser.triviarating || 1500}${!dbuser.triviaprovisional ? "?" : ""}`,
          color: 53380
        }
      });
    } else {
      let user = getuser(message.channel, args[0]);
      let dbuser = getdbuserfromuser(user);
      if(dbuser) { 
        message.channel.send({embed:{
            title: "**Trivia Rating**",
            description: `**${dbuser.username}** ${dbuser.triviarating}${!dbuser.triviaprovisional ? "?" : ""}`,
            color: 53380
          }
        });
      } else {
        message.channel.send({embed:{
            title: "**Trivia Rating**",
            description: `**User Not Found**`,
            color: 53380
          }
        });
      }
    }
  }
  
  ratingUpdate (message) {
    if(!this.server.states.trivia) return;
    if(message.embeds[0].title === 'Trivia Game Ended' || message.embeds[0].title === 'Final Results') {
      const initialRating = 1500;
      const ratingSpread = 1589;
      let triviagame = {
        "header": message.embeds[0].author.name,
        "title": message.embeds[0].title,
        "description": message.embeds[0].description
      };
      const args = triviagame.description.split("\n");
      let allString = [];
      let totalSuccessNumber = 0;
      let continueProgram = true;
      let runOnce = true;
      let totalScore = 0;
      let tally = DataManager.getData();
      for(let i = 0; i < args.length; i++) {
        let desArray = args[i].split(' '); 
        let name = args[i].split("*").join("").split(/ +/g).shift();
        let user = getuser(message.guild, name);
        let dbuser = getdbuserfromuser(user) || { "triviarating": 1500  };
        let currentRating = dbuser.triviarating || 1500;
        let successNumber = Math.pow(10, (currentRating - initialRating) / ratingSpread);
        totalSuccessNumber += successNumber;
        totalScore += Number(desArray[2]);
      };
      for(let i = 0; i < args.length; i++) {
        let desArray = args[i].split(' ');
        let name = args[i].split("*").join("").split(/ +/g).shift();
        let user = getuser(message.guild, name);
        let dbuser = getdbuserfromuser(user);
        if(!dbuser) break;
        let dbindex = getdbindexfromdbuser(dbuser);
        let currentRating = dbuser.triviarating || 1500;
        let successNumber = Math.pow(10, (currentRating - initialRating) / ratingSpread);
        if(runOnce === true) {
          if(desArray[2] >= 10) {
            runOnce = false;
            continueProgram = true;
            runOnce = false;
          } else
          if(desArray[2] < 10) {
            continueProgram = false;
            break;
          }
        };
        let successNumberShare = successNumber / totalSuccessNumber;
        let estimatedScore = successNumberShare * totalScore;
        let newRating = Math.max(50 - (dbuser.triviagames || 0) * 3, 10) * (desArray[2] - estimatedScore);
        let theRating = Number(newRating) + Number(currentRating);
        let sign = "";
        if(Math.round(newRating) > 0) sign = "+";
        let ratingmsg = `**${name}** ${Math.round(theRating)}${(dbuser.triviagames || 0) < 10 ? "?" : ""} (${sign}${Math.round(newRating)})`;
        allString.push(ratingmsg);
        tally[dbindex].triviarating = Math.round(theRating);
        if(tally[dbindex].triviagames) tally[dbindex].triviagames++;
        else tally[dbindex].triviagames = 1;
        if(!!tally[dbindex].triviagames && tally[dbindex].triviagames >= 10) tally[dbindex].triviaprovisional = true;
        else tally[dbindex].triviaprovisional = false;
      };
      DataManager.setData(tally);
      if(continueProgram) {
          message.channel.send({embed:{
              title: "**Trivia Rating Update**",
              description: allString.join("\n"),
              color: 53380
            }});
      } else {
        let triviaembed = {};
        triviaembed.title = "**Trivia Update**";
        triviaembed.description = "__**Only 10+ Point Games Are Rated**__";
        setTimeout(embedsender(message.channel, triviaembed), 5000);
      }
    }
    this.end();
  }

}

module.exports = Trivia;