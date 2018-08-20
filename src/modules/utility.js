const Parse = require("../util/parse.js");
const Embed = require("../util/embed.js");

class Utility extends Parse { //fairly miscelanneous functions

  constructor(message) {
    super(message);
  }

  uptime () {
    let time = Date.gettime(Date.now() - this.reboot);
    return this.Output.generic(`**${time.days}** days, **${time.hours}** hours, **${time.minutes}** minutes, and **${time.seconds}** seconds since ${Math.random() > 0.5 ? "**bleep bloop! It's showtime**" : "last reboot"}.`);
  }

  jsonify () {
    this.find ((msg, embedinput) => {
      if (!embedinput) return this.Output.onError("No embeds found to JSONify!");
      this.Output.generic("```json\n" + JSON.stringify(embedinput, null, 4) + "```");
    }, (error) => {
      this.Output.onError(error)
    })
  }

  fetch (message) {
    this.find ((msg, embedinput = {}) => {
      embedinput.content = embedinput.title ? "Fetched Message for " + this.author.tag + "\n" : "";
      if(!embedinput.title) embedinput.title = "Fetched Message for " + this.author.tag;
      if (msg.content) {
        if (msg.content.startsWith("On ") && msg.content.includes("\, user **") && msg.content.includes("** said\:")) {
          embedinput.content += msg.content;
        } else {
          embedinput.content += msg.createdTimestamp ? "\nAt" + Date.getISOtime(msg.createdTimestamp) + ", **" + msg.author.tag + "** said" : "";
          embedinput.content += "\`\`\`" + msg.content + "\`\`\`";
        }
      };
      this.Output.sender(embedinput);
      message.delete();
    }, (error) => {
      this.Output.onError(error)
    })
  }

  find (resolve, reject) { //function needs a channel input
    let id = this.args[0], channel = this.channel;
    if (this.args.length === 2) {
      channel = this.Search.channels.get(args[1]);
      if (!channel) return reject("No such channel!");
    }; //if second argument provided, that's the channel to look in
    channel.fetchMessage(id)
    .then(msg => {
      return resolve(msg.content, msg.embeds && msg.embeds[0] ? Embed.receiver(msg.embeds[0]) : "");
    })
    .catch(e => this.Output.onError(e)); //if no message found, say so
  }

}

module.exports = Utility;

Date.gettime = function(ms) {
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