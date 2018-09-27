const Main = require("./main.js");

class Input extends Main {
  
  constructor(message) {
    super(message);
  }

  get output () {    
    let Constructor = require("./output.js");
    return new Constructor(this.message);
  }

  get action () {    
    let Constructor = require("./action.js");
    return new Constructor(this.message);
  }

  async incoming() { //new DM received to create new modmail conversation
    try {
      for (let [id, attachment] of this.message.attachments)
        this.message.content += " [Image Attachment](" + attachment.url + ")"; //if there's any images, append them as a link to the DM image
          if (this.message.content.length > 1024) return this.Output.onError("Your message must be less than 1024 characters!\nPlease shorten it by **" + (this.message.content.length - 1024) + "** characters.");
      let data = {
        "mod": false,
        "user": this.author,
        "content": this.message.content,
        "command": "DM"
      };
      if (!this.modmail) { //if there's no modmail stored for this server 
        this.modmail = {
          "_timeout": {}
        };
        this.log(data);
        return this.output.anew(data);
      }
	    if (this.modmail._timeout[this.author.tag]) { //check if they're timed out
        if (Date.now() - this.modmail._timeout[this.author.tag] < 86400000) return; //if so, return completely
        delete this.modmail._timeout[this.author.tag]; //otherwise delete any old timeout
      }
	    await this.log(data);
      await this.sort(data);
      this.message.react("📨");
    } catch (e) {
      if (e) this.Output.onError(e)
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
          if (arg === "-s" || args === "--server") {
            data.mod.flair = true;
            continue;
          } else throw "Invalid flag given \"" + arg + "\"!";
        }
	      let user = this.Search.users.get(arg);
        if (!user) {
          this.Output.onError("Couldn't find user" + arg + "!");
          continue;
        }
	      data.users.push(user);
      }
	    this.message.delete();
      if (data.users.length === 0) throw "No valid users to whom a message can be sent.";
      let msg = await this.Output.response({
        "title": "Sending new ModMail to " + data.users.map(user => user.tag).join(", "),
        "description": "**" + data.mod.tag + "** Please type your message below (sending as " + (data.mod.flair ? "server" : "yourself") + ")"
      }, true);
      if (msg.attachments)
        for (let [id, attachment] of msg.attachments)
          msg.content += " [Image Attachment](" + attachment.url + ")"; //if there's any images, append them as a link to the DM image
      data.content = msg.content;
      if (data.content.length > 1024) throw "Your message must be less than 1024 characters!\nPlease shorten it by **" + (data.content.length - 1024) + "** characters.";
      this.log(data);
      for (let user of data.users) {
        data.user = user;
        this.output.send(data);
        await this.sort(Object.assign({}, data)); //{mod, content, user}
      }
	    msg.delete();
    } catch (e) {
      if (e) this.Output.onError(e);
    }
  }

}

module.exports = Input;