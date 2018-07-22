const Parse = require("../util/parse.js");
const Embed = require("../util/embed.js");

class Utility extends Parse { //fairly miscelanneous functions

  constructor(message) {
    super(message);
  }

  uptime() {
    let time = Date.gettime(Date.now() - this.reboot);
    return this.Output.generic(`**${time.days}** days, **${time.hours}** hours, **${time.minutes}** minutes, and **${time.seconds}** seconds since ${Math.random() > 0.5 ? "**bleep bloop! It's showtime**" : "last reboot"}.`);
  }

  fetch(message, args) { //function needs a channel input
    let channel = args.length === 2 && this.Search.getChannel(args[1]) ? this.Search.getChannel(args[1]) : message.channel; //if second argument provided, that's the channel to look in
    let id = args[0];
    channel.fetchMessage(id)
      .then(msg => {
        let timestamp = Date.getISOtime(msg.createdAt);
        if(msg.embeds.length !== 0) {
          let embedinput = Embed.receiver(msg.embeds[0]);
          embedinput.content = msg.content ?
            (msg.content.startsWith("On ") && msg.content.includes("\, user **") && msg.content.includes("** said\:") ? msg.content :
            `On ${timestamp}, user **${msg.author.tag}** said:\n\`\`\`${msg.content}\`\`\``)
            : `On ${timestamp}, user **${msg.author.tag}** said:`;
          this.Output.sender(embedinput);
        } else
        if(msg.content) {
          let fetchedmsg =
            (msg.createdTimestamp ? `\nAt ${Date.getISOtime (msg.createdTimestamp)}, **${msg.author.tag}** said` : "") +
            ("\`\`\`" + msg.content + "\`\`\`");
          this.Output.sender({
            "title": `Fetched Message for ${message.author.tag}`,
            "description": fetchedmsg
          });
          message.delete();
        }
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