const Parse = require("../util/parse.js");
const ModMailConstructor = require("./modmail.js");
const Router = require("../util/router.js");

class DM extends Parse {

  constructor(message) {
    super(message);
    this.ModMail = new ModMailConstructor(message);
  }

  route() {
    const ElectionConstructor = require("./election.js");
    const Election = new ElectionConstructor(this.message);
    if (this.message.content.startsWith("#VoterID")) {
      Election.vote.setData();
    } else
    if (this.message.content === "mobile") {
      Election.ballot.runMobile(this.author)
    } else {
      this.incoming();
    }
  }

  async incoming() { //handles the input for dms
    try {
      if (this.author.bot) return; //if bot, return
      let guilds = []; //define an array for all possible guilds
      for (let guild of Array.from(this.client.guilds.values()))
        if (guild.members.has(this.author.id)) guilds.push(guild); //and fill it with all guilds the bot has access to that the user is a member of.
      for (let [id, attachment] of this.message.attachments)
        this.message.content += " [Image Attachment](" + attachment.url + ")"; //if there's any images, append them as a link to the DM image
      if (this.message.content.length > 1024) return this.Output.onError("Your message must be less than 1024 characters!\nPlease shorten it by **" + (this.message.content.length - 1024) + "** characters.");
      let index = guilds.length === 1 ? 0 : await this.Output.choose({
        "title": "Sending new ModMail on LAZYbot",
        "type": "server",
        "options": guilds.map(guild => guild.name)
      });
      this.ModMail.dm(guilds[index]); //and if valid input, send of modmail for that guild
    } catch (e) {
      if (e) this.Output.onError("incoming" + e);
    }
  }

  async outgoing(args) {
    try {
      let data = {
        "command": "send",
        "users": []
      };
      data.mod = this.author;
      data.mod.flair = false;
      for (let arg of args) {
        if (arg.startsWith("-")) {
          if (args === "-s" || args === "--server") {
            data.mod.flair = true;
            continue;
          } else throw "Invalid flag given \"" + arg + "\"!";
        };
        let user = this.Search.users.get(arg);
        if (!user) {
          this.Output.onError("Couldn't find user" + arg + "!");
          continue;
        };  
        data.users.push(user);
      };
      this.message.delete();
      let msg = await this.Output.response({
        "title": "Sending new ModMail to " + data.users.map(user => user.tag).join(", "),
        "description": "**" + data.mod.tag + "** Please type your message below (sending as " + (data.mod.flair ? "server" : "yourself") + ")"
      }, true);
      if (msg.attachments)
        for (let [id, attachment] of msg.attachments)
          msg.content += " [Image Attachment](" + attachment.url + ")"; //if there's any images, append them as a link to the DM image
      data.content = msg.content;
      if (data.content.length > 1024) throw "Your message must be less than 1024 characters!\nPlease shorten it by **" + (data.content.length - 1024) + "** characters.";
      this.ModMail.log(data);
      for (let user of data.users) {
        data.user = user;
        await this.ModMail.sort(Object.assign({}, data)); //{mod, content, user}
      };
      msg.delete();
    } catch (e) {
      if (e) this.Output.onError("outgoing" + e);
    }
  }

}

module.exports = DM;