const Parse = require("../util/parse.js");
const Embed = require("../util/embed.js");
const DataManager = require("../util/datamanager.js");
const Router = require("../util/router.js");

class ModMail extends Parse {
  constructor(message) {
    super(message);
    this.modmail = this.reactionmessages.modmail || {};
    this.channel = this.Search.channels.get(this.server.channels.modmail);
  }

  setData(modmail) {
    this.reactionmessages.modmail = modmail;
    DataManager.setServer(this.reactionmessages, "./src/data/reactionmessages.json");
  }

  /*data object {
    "mod": false if it's a new user mail. Otherwise it's the user object of the mod who sent the message {
      "flair": true if new mail was sent with -s flag, or message was reacted with 🗣 emoji
    },
    "user": the user object of the conversation,
    "name": appears for mod actions, outputted to name fields
    "content": the last line of the conversation, to be processed
    "message": the conversation. Exists when the new message is a reply and history is found.
    "embed": message.embeds[0]. The embed to be sent.
  }*/

  async log(data) {
    try {
      let args = [];
      if (data.content) args.unshift(data.content);
      if (data.mod && data.user) args.unshift(data.user.tag);
      if (data.mod && data.users) args.unshift(...data.users.map(user => user.tag));
      if (data.mod && /reply|send/.test(data.command)) args.unshift(data.mod.flair ? "server" : "self");
      Router.logCommand({
        "author": data.mod ? data.mod : data.user,
        "args": args,
        "command": data.command
      }, {
        "file": "Mod Mail",
        "prefix": ""
      })
    } catch (e) {
      if (e) this.Output.onError("log " + e);
    }
  }

  async send(data) {
    try {
      this.Output.sender({
        "title": data.title ? data.title : "New mail from " + (data.mod.flair ? "server " : data.mod.tag + " via ") + this.guild.name + ":",
        "description": data.content
      }, data.user);
    } catch (e) {
      if (e) this.Output.onError("send " + e);
    }
  }

  async anew(data = {}) { //called for any new modmail conversation
    try {
      this.renew(Object.assign({
        "embed": {
          "title": "ModMail Conversation for " + data.user.tag,
          "fields": data.embed && data.embed.fields ? data.embed.fields.slice(-1) : []
        }
      }, data))
    } catch (e) {
      if (e) this.Output.onError("anew " + e);
    }
  }

  async append(data) { //called for a reply where the previous messages sent by the user was in the last half an hour. Adds to last field.
    try {
      data.embed.fields[data.embed.fields.length - 1].value += "\n" + data.content;
      this.editor(data); //and if they had last message, less than half an hour ago, merely append it with new line
      this.modmail[data.message.id].lastMail = Date.now();
      this.setData(this.modmail);
    } catch (e) {
      if (e) this.Output.onError("append " + e);
    }
  }

  async amend(data) { //called for a reply, adds a new field to the last message
    try {
      let name = "On " + Date.getISOtime(Date.now()) + ", " + data.mod.tag + (data.mod.flair ? " 🗣" : "") + " wrote:";
      data.embed.fields = Embed.fielder(data.embed.fields, name, data.content, false)
      this.editor(data); //and if they had last message, less than half an hour ago, merely append it with new line
      if (!data.mod) this.modmail[data.message.id].lastMail = Date.now();
      this.setData(this.modmail);
    } catch (e) {
      if (e) this.Output.onError("amend " + e);
    }
  }

  async moderate(data) { //adds a moderator message as a new field. Edits to do so.
    try {
      data.embed.fields = Embed.fielder(data.embed.fields, data.name, "", false)
      this.editor(data); //and if they had last message, less than half an hour ago, merely append it with new line
    } catch (e) {
      if (e) this.Output.onError("moderate " + e);
    }
  }

  async renew(data) { //resposts conversation with new field added. Deletes old one.
    try {
      let name = "On " + Date.getISOtime(Date.now()) + ", ";
      if (!data.mod) name += "user";
      else name += data.mod.tag + (data.mod.flair ? " 🗣" : "");
      name += " wrote:";
      data.embed.fields = Embed.fielder(data.embed.fields, name, data.content, false);
      let modmail = await this.Output.reactor(data.embed, this.channel, ["❎", "🗣", "👤", "❗", "⏲"]);
      if (data.message && this.modmail[data.message.id]) {
        data.message.delete();
        this.modmail[modmail.id] = this.modmail[data.message.id];
        if (!data.mod) this.modmail[modmail.id].lastMail = Date.now();
        delete this.modmail[data.message.id];
      } else this.modmail[modmail.id] = {
        "tag": data.user.tag,
        "lastMail": Date.now()
      };
      this.setData(this.modmail);
      return modmail;
    } catch (e) {
      if (e) this.Output.onError("renew " + e);
    }
  }

  async editor(data) { //check if the edited message is too long
    try {
      if (JSON.stringify(Embed.receiver(data.embed)).length < 2000) return await this.Output.editor(data.embed, data.message); //check if the message would be more than 2000 characters 
      data.message.clearReactions(); //clear reactions from the old message
      this.modmail[message.id].overflow = msg.id; //set the overflow to true
      this.setData(this.modmail);
      let msg = await this.anew(data);
    } catch (e) {
      if (e) this.Output.onError("editor " + e);
    }
  }

  async dm() { //new DM received to create new modmail conversation
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
        return this.anew(data);
      };
      if (this.modmail._timeout[this.author.tag]) { //check if they're timed out
        if (Date.now() - this.modmail._timeout[this.author.tag] < 86400000) return; //if so, return completely
        delete this.modmail._timeout[this.author.tag]; //otherwise delete any old timeout
      };
      this.log(data);
      this.sort(data);
    } catch (e) {
      if (e) this.Output.onError("dm " + e)
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
      if (data.users.length === 0) throw "No valid users to whom a message can be sent."
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
        this.send(data);
        await this.sort(Object.assign({}, data)); //{mod, content, user}
      };
      msg.delete();
    } catch (e) {
      if (e) this.Output.onError(e);
    }
  }

  async sort(data) {  //find the relevant modmil
    try {
      for (let [id, mailInfo] of Object.entries(this.modmail)) { //for each record
        if (id.startsWith("_") || mailInfo.tag !== data.user.tag || mailInfo.overflow) continue;
        try {
          let modmail = await this.channel.fetchMessage(id); //so if they have a chat history, find it
          data = Object.assign(data, {
            "message": modmail,
            "embed": modmail.embeds[0]
          });
          if (Date.now() - mailInfo.lastMail < 1800000 && data.embed.fields[data.embed.fields.length - 1].name.includes("user wrote:")) this.append(data);
          else this.renew(data);
        } catch (e) {
          await this.Output.confirm({ //if couldn't find the message
            "channel": this.channel,
            "description": "**" + data.mod.tag + "** Couldn't find message. Please confirm that message no longer exists.",
            "author": data.mod
          });
          this.anew(data); //and make a new post
          delete this.modmail[id]; //and delete the record
          this.setData(this.modmail);
        };
        return; //only gets executed if managed to pass the 'continue's
      };
      this.anew(data);
    } catch (e) {
      if (e) this.Output.onError("sort " + e);
    }
  }

  async react(reaction, user) {
    try {
      let data = {
        "mod": user,
        "message": reaction.message,
        "embed": reaction.message.embeds[0],
      };
      data.user = this.Search.users.byTag(this.modmail[reaction.message.id].tag);
      if (!data.user) throw "User **" + user.tag + "** no longer exists!";
      data.mod.flair = false;
      switch (reaction.emoji.name) {
        case "❎":
          this.close(data);
          break;
        case "🗣":
          data.mod.flair = true;
          this.reply(data);
          break;
        case "👤":
          data.mod.flair = false;
          this.reply(data);
          break;
        case "👁": //"seen" 
          return; //"Don't remove the emoji"
        case "❗":
          this.warn(data);
          break;
        case "⏲":
          this.timeout(data);
          break;
      };
      reaction.remove(user);
    } catch (e) {
      if (e) this.Output.onError("react " + e);
    }
  }

  async reply(data) {
    try {
      let msg = await this.Output.response({
        "author": data.mod,
        "description": "**" + data.mod.tag + "** Please type your response below (replying as " + (data.mod.flair ? "server" : "yourself") + ")"
      }, true);
      if (msg.attachments)
        for (let [id, attachment] of msg.attachments)
          msg.content += " [Image Attachment](" + attachment.url + ")"; //if there's any images, append them as a link to the DM image
      if (msg.content.length > 1024) throw "Your message must be less than 1024 characters!\nPlease shorten it by **" + (msg.content.length - 1024) + "** characters.";
      else data.content = msg.content; //DATA.CONTENT SET
      msg.delete();
      data.command = "reply";
      this.amend(data);
      this.send(data);
      this.log(data);
    } catch (e) {
      if (e) this.Output.onError("reply " + e);
    }
  }

  async close(data) {
    try {
      await this.Output.confirm({
        "action": "closing conversation for user **" + data.user.tag + "**",
        "author": data.mod
      });
      for (let id in this.modmail) {
        if (this.modmail[id].tag === data.user.tag) {
          try {
            let msg = await this.channel.fetchMessage(id)
            msg.delete();
          } catch (e) {};
          delete this.modmail[id];
        }
      };
      this.setData(this.modmail);
      this.Output.generic("**" + data.mod.tag + "** closed the ModMail conversation for **" + data.user.tag + "**.");
      data.command = "close";
      this.log(data);
    } catch (e) {
      if (e) this.Output.onError("close " + e);
    }
  }

  async warn(data) {
    try {
      await this.Output.confirm({
        "action": "warning for user **" + data.user.tag + "**",
        "author": data.mod
      });
      Object.assign(data, {
        "title": "Warning from server " + this.guild.name + ":",
        "content": "You are abusing server modmail. Please be polite and do not spam the inbox.",
        "command": "warn",
        "name": "On " + Date.getISOtime(Date.now()) + ", " + data.mod.tag + " warned user."
      });
      this.moderate(data);
      this.send(data);
      this.log(data);
    } catch (e) {
      if (e) this.Output.onError("warn " + e);
    }
  }

  async timeout(data) {
    try {
      await this.Output.confirm({
        "action": "timeout for user **" + data.user.tag + "**",
        "author": data.mod
      });
      Object.assign(data, {
        "title": "You have been timed out from sending messages to server " + this.guild.name + ":",
        "content": "The mod team will not receive your messages for 24 hours.",
        "command": "timeout",
        "name": "On " + Date.getISOtime(Date.now()) + ", " + data.mod.tag + " timed out user for 24h."
      });
      if (!this.modmail._timeout) this.modmail._timeout = {};
      this.modmail._timeout[data.user.tag] = Date.now();
      this.setData(this.modmail);
      this.moderate(data);
      this.send(data);
      this.log(data);
    } catch (e) {
      if (e) this.Output.onError("timeout " + e);
    }
  }

}

module.exports = ModMail;