const Embed = require("../util/embed.js");
const Parse = require("../util/parse.js");

class DM extends Parse {

  constructor(message) {
    super(message);
  }

  route () {
    let message = this.message;
    const ElectionConstructor = require("./election.js");
    const Election = new ElectionConstructor(message);
    if(message.content.startsWith("#VoterID")) {
      Election.vote.setData();
    } else
    if(message.content === "mobile") {
      Election.ballot.runMobile(this.author)
    } else {
      this.return();
    }
  }

  return () {
    let message = this.message;
    if(message.author.bot) return;
    let timestamp = Date.getISOtime(message.createdAt);
    if(message.embeds.length !== 0) {
      let embed = Embed.receiver(message.embeds[0])
      embed.content = message.content ? message.content.startsWith("On ") && message.content.includes("\, user **") && message.content.includes("** said\:") ? message.content : `On ${timestamp}, user **${message.author.tag}** said:\n\`\`\`${message.content}\`\`\`` : `On ${timestamp}, user **${message.author.tag}** said:`;
      this.Output.toOwner({embed: embed});
    } else {
      if(message.content) {
        let fetchedmessage = (message.createdTimestamp ? `\nAt ${Date.getISOtime(message.createdTimestamp)}, **${message.author.tag}** said` : "") + ("\`\`\`" + message.content + "\`\`\`");
        let embed = {
          "title": `DM received from ${message.author.tag}`,
          "description": fetchedmessage
        };
        this.Output.toOwner({embed: embed});
      }
    }
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
  return Date.gettime(ms).toString().slice(0, 31); 
}