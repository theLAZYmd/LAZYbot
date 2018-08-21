const Parse = require("../util/parse.js");
const ModMailConstructor = require("./modmail.js");
const Router = require("../util/router.js");

class DM extends Parse {

  constructor(message) {
    super(message);
    this.ModMail = new ModMailConstructor(message);
  }

  route () {
    const ElectionConstructor = require("./election.js");
    const Election = new ElectionConstructor(this.message);
    if(this.message.content.startsWith("#VoterID")) {
      Election.vote.setData();
    } else
    if(this.message.content === "mobile") {
      Election.ballot.runMobile(this.author)
    } else {
      this.mail();
    }
  }

  mail () { //handles the input for dms
    if (this.author.bot) return; //if bot, return
    let guilds = []; //define an array for all possible guilds
    for(let [id, guild] of this.client.guilds) {
      if (guild.members.has(this.author.id)) guilds.push(guild);
    }; //and fill it with all guilds the bot has access to that the user is a member of.
    Router.logCommand({
      "author": this.author,
      "args": this.message.content,
      "command": "DM"
    }, {
      "file": "Mod Mail",
      "prefix": ""
    }); //log valid DMs received as a command
    if (guilds.length === 1) return this.ModMail.receiver(guilds[0]); //if there's only one guild, proceed to modmail
    let title = "Sending new ModMail on LAZYbot";
    let description = "Please select a server to send this modmail to:\n";
    for(let i = 0; i < guilds.length; i++) {
      description += (i + 1) + "⃣ **" + guilds[i].name + "**\n";
    };
    this.Output.sender({title, description}) //if more than one guild, send an embed letting them know
    .then(msg => {
      for(let i = 0; i < guilds.length; i++) {
        setTimeout(() => {
          msg.react((i + 1) + "⃣");
        }, i * 1000); //react to it with options
      };
      let filter = (reaction, user) => {
        if(user.bot) return false;
        let number = reaction.emoji.name.match(/([1-9])⃣/);
        if (Number(number[1]) < guilds.length) return true;
        return false;
      };
      msg.awaitReactions(filter, { //wait for them to react back
        "max": 1,
        "time": 30000,
        "errors": ["time"]
      })
      .then(collected => {
        let number = Number(collected.first().emoji.name.match(/([1-9]⃣)/));
        msg.delete();
        return this.ModMail.receiver(guilds[number - 1]); //and if valid input, send of modmail for that guild
      })
      .catch(() => {
        msg.delete();
      });
    })
    .catch(e => console.log(e));
  }

}

module.exports = DM;

Date.gettime = function (ms) {
  let time = new Date(ms);
  time.hours = time.getUTCHours();
  time.minutes = time.getUTCMinutes();
  time.seconds = time.getUTCSeconds();
  time.milliseconds = time.getUTCMilliseconds();
  time.days = Math.floor(time.hours/24);
  time.hours = time.hours - (24 * time.days);
  return time;
}

Date.getISOtime = function(ms) {
  return Date.gettime(ms).toString().slice(0, 24); 
}