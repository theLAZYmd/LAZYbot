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

  async mail () { //handles the input for dms
    if (this.author.bot) return; //if bot, return
    let guilds = []; //define an array for all possible guilds
    for(let [id, guild] of this.client.guilds)
      if (guild.members.has(this.author.id)) guilds.push(guild); //and fill it with all guilds the bot has access to that the user is a member of.
    Router.logCommand({
      "author": this.author,
      "args": this.message.content,
      "command": "DM"
    }, {
      "file": "Mod Mail",
      "prefix": ""
    }); //log valid DMs received as a command
    for (let [id, attachment] of this.message.attachments) 
      this.message.content += " [Image Attachment](" + attachment.url + ")"; //if there's any images, append them as a link to the DM image
    if (this.message.content.length > 1024) return this.Output.onError("Your message must be less than 1024 characters!\nPlease shorten it by **" + (this.message.content.length - 1024) + "** characters.");
    if (guilds.length === 1) return this.ModMail.receiver(guilds[0]); //if there's only one guild, proceed to modmail
    let options = guilds.map(guild => guild.name);
    let index = await this.Output.choose({
      "title": "Sending new ModMail on LAZYbot",
      "type": "server",
      "options": guilds.map(guild => guild.name)
    });
    this.ModMail.receiver(guilds[index]); //and if valid input, send of modmail for that guild
  }

}

module.exports = DM;