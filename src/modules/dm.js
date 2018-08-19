const Embed = require("../util/embed.js");
const Parse = require("../util/parse.js");
const ModMailConstructor = require("./modmail.js");

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

  mail () {
    if (this.author.bot) return;
    let guilds = [], guild;
    for(let [id, guild] of this.client.guilds) {
      if (guild.members.has(this.author.id)) guilds.push(guild.id);
    };
    if (guilds.length === 1) return this.ModMail.receiver(guilds[0]);
    let text = "Please pick which server you would like to send this modmail to:\n";
    for(let i = 0; i < guilds.length; i++) {
      text += (i + 1) + "⃣ **" + this.client.guilds.get(guilds[i]).name + "**\n";
    };
    this.Output.generic(text)
    .then(msg => {
      for(let i = 0; i < guilds.length; i++) {
        setTimeout(() => {
          msg.react((i + 1) + "⃣");
        }, i * 1000);
      };
      let filter = (reaction, user) => {
        if(user.bot) return false;
        let number = reaction.emoji.name.match(/([1-9])⃣/);
        console.log(number);
        if (Number(number[1]) < guilds.length) return true;
        return false;
      };
      msg.awaitReactions(filter, {
        "max": 1,
        "time": 30000,
        "errors": ["time"]
      })
      .then(collected => {
        let number = collected.first().emoji.name.match(/([1-9]⃣)/);
        return this.ModMail.receiver(Number(guilds[number]) - 1)
      })
      .catch(e => console.log(e));
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