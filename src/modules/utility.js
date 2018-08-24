const Parse = require("../util/parse.js");
const Embed = require("../util/embed.js");

class Utility extends Parse { //fairly miscelanneous functions

  uptime () {
    let time = Date.gettime(Date.now() - this.reboot);
    return this.Output.generic(`**${time.days}** days, **${time.hours}** hours, **${time.minutes}** minutes, and **${time.seconds}** seconds since ${Math.random() > 0.5 ? "**bleep bloop! It's showtime**" : "last reboot"}.`);
  }

  async jsonify () {
    this.find()
    .then((msg, embedinput) => {
      console.log(msg, embedinput);
      if (!embedinput) return this.Output.onError("No embeds found to JSONify!");
      this.Output.generic("```json\n" + JSON.stringify(embedinput, null, 4) + "```");
    })
    .catch((e) => {
      this.Output.onError(e)
    })
  }

  fetch (message) {
    this.find()
    .then((msg, embedinput = {}) => {
      embedinput.content = "";
      if (msg.content) {
        if (msg.content.startsWith("On ") && msg.content.includes("\, user **") && msg.content.includes("** said:")) {
          embedinput.content += msg.content;
        } else {
          if(!embedinput.title) embedinput.title = "Fetched Message for " + this.author.tag + "\n";
          else embedinput.title = "Fetched Message for " + this.author.tag + "\n";
          embedinput.content += msg.createdTimestamp ? "\On " + Date.getISOtime(msg.createdTimestamp) + ", user **" + msg.author.tag + "** said:" : "";
          if (!embedinput.description) embedinput.description = "```" + msg.content + "```";
          else embedinput.content += "```" + msg.content + "```";
        }
      };
      this.Output.sender(embedinput);
      message.delete();
    })
    .catch((e) => {
      this.Output.onError(e)
    })
  }

  find (args = this.args) { //function needs a channel input
    return new Promise ((resolve, reject) => {
      let id = args[0], channel = this.channel;
      if (args.length === 2) {
        channel = this.Search.channels.get(args[1]);
        if (!channel) return reject("No such channel!");
      }; //if second argument provided, that's the channel to look in
      channel.fetchMessage(id)
      .then(msg => {
        return resolve(msg, msg.embeds && msg.embeds[0] ? Embed.receiver(msg.embeds[0]) : "");
      })
      .catch(e => reject(e)); //if no message found, say so
    })
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