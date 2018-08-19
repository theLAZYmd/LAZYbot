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
    let guilds = [];
    for(let [id, guild] of this.client.guilds) {
      if (guild.members.has(this.author.id)) guilds.push(guild.id);
    };
    if (guilds.length === 1 || true) this.ModMail.receiver(guilds[0]); //need to know which guild I'm modmailing to
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