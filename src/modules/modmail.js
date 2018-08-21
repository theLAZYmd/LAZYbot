const Parse = require("../util/parse.js");
const Embed = require("../util/embed.js");
const DataManager = require("../util/datamanager.js");

class ModMail extends Parse {
  constructor(message) {
    super(message);
    this.modmail = this.reactionmessages.modmail || {};
  }

  setData (modmail) {
    this.reactionmessages.modmail = modmail;
    DataManager.setServer(this.reactionmessages, "./src/data/reactionmessages.json");
  }

  receiver (guild) { //receive a guild as an input, set it to this.guild
    this.guild = guild;
    for(let [id, attachment] of this.message.attachments) {
      this.message.content += " [Image Attachment](" + attachment.url + ")"; //if there's any images, append them as a link to the DM image
    };
    if (this.modmail) { //if the server has had modmail in the past
      for(let id in this.modmail) { //for each record
        if (this.modmail[id].tag === this.author.tag && !this.modmail[id].full) { //if the user hasn't mailed in the past or the post is more than 2000 characters, make a new one
          if (Date.now() - this.modmail[id].timeout < 86400000) return; //if the user is timed out return completely
          let channel = this.Search.channels.get(this.server.channels.modmail);
          return channel.fetchMessage(id) //so if they have a chat history, find it
            .then((modmail) => {
              let embed = modmail.embeds[0];
              if (Date.now() - this.modmail[modmail.id].lastMail < 1800000 && embed.fields[embed.fields.length - 1].name.includes("user wrote:")) {
                embed.fields[embed.fields.length - 1].value += "\n" + this.message.content;
                this.editor(embed, modmail); //and if they had last message, less than half an hour ago, merely append it with new line
                this.modmail[modmail.id].lastMail = Date.now();
              } else {
                this.sender(embed.fields); //otherwise we're making a new post, extending the fields of the old post
                modmail.delete(); //so delete the message
                delete this.modmail[modmail.id]; //and delete the record
              };
              this.setData(this.modmail);
            })
            .catch(() => {
              this.Output.generic("Couldn't find message. Please confirm that message no longer exists.", channel)
              .then((msg) => { //if couldn't find the message, chances are it's been accidentally deleted
                let filter = m => m.content && m.content.match(/true|yes|confirm/gi); //so output then wait for confirmation
                msg.channel.awaitMessages(filter, {
                  "max": 1,
                  "time": 180000,
                  "errors": ["time"]
                })
                .then((collected) => {
                  msg.delete();
                  collected.first().react("✅")
                  delete this.modmail[id]; //and delete the record
                  this.sender([]); //and make a new post
                  this.setData(this.modmail);
                })
                .catch((e) => console.log(e))
              })
              .catch((e) => console.log(e));
            })
        }
      }
    } else this.modmail = {}; //if there's no modmail stored for this channel 
    this.sender([]); //if it's a new message it gets sent straight
  }

  sender (fields) { //make a new post. All posts look the same, but you can have more 'previous' fields to add a history
    let timestamp = Date.getISOtime(this.message.createdAt);
    this.Output.reactor({
      "title": "ModMail Conversation for " + this.author.tag,
      "fields": Embed.fielder(fields || [], "On " + timestamp + ", user wrote:", this.message.content, false)
    }, this.Search.channels.get(this.server.channels.modmail), ["❎", "✉", "👁", "❗", "⏲"])
    .then((modmail) => { //fields are past fields, + new one for the last message
      this.modmail[modmail.id] = { //and create a new record with the new message created entry
        "tag": this.author.tag,
        "lastMail": Date.now()
      };
      this.setData(this.modmail);
    })
    .catch((e) => console.log(e));
  }

  editor (embed, message) {
    if (JSON.stringify(Embed.receiver(embed)).length < 2000) return this.Output.editor(embed, message); //check if the message would be more than 2000 characters
    this.sender([]); //if so, create a new post
    this.modmail[message.id].full = true; //and set that post to 'read-only' mode
    this.setData(this.modmail);
  }

  react (reaction, user) {
    switch (reaction.emoji.name) {
      case "❎":
        this.close(reaction.message, user, this.modmail[reaction.message.id]);
        reaction.remove(user);
        break;
      case "✉":
        this.reply(reaction.message, user, this.modmail[reaction.message.id]);
        reaction.remove(user);
        break;
      case "👁": //"seen" 
        break;
      case "❗":
        this.warn(reaction.message, user, this.modmail[reaction.message.id]);
        reaction.remove(user);
        break;
      case "⏲":
        this.timeout(reaction.message, user, this.modmail[reaction.message.id]);
        reaction.remove(user);
        break;
      default:
        reaction.remove(user);
        break;
    }
  }

  close (message, mod, mailInfo) {
    message.delete();
    delete this.modmail[message.id];
    this.setData(this.modmail);
    this.Output.generic("**" + mod.tag + "** closed the ModMail conversation for **" + mailInfo.tag + "**.")
  }

  reply (message, mod, mailInfo) {
    let user = this.Search.users.byTag(mailInfo.tag);
    if (!user) return this.Output.onError("User **" + user.tag + "** no longer exists!");
    this.Output.generic("**" + mod.tag + "** Please type your reply now.")
    .then((msg) => {
      let filter = m => m.author.id === mod.id && m.content;
      msg.channel.awaitMessages(filter, {
        "max": 1,
        "time": 180000,
        "errors": ["time"]
      })
      .then((collected) => {
        let timestamp = Date.getISOtime(Date.now());
        let embed = message.embeds[0];
        embed.fields = Embed.fielder(embed.fields, "On " + timestamp + ", " + mod.tag + " wrote:", collected.first().content, false)
        this.editor(embed, message);
        this.Output.sender({
          "title": "New mail from server " + this.guild.name + ":",
          "description": collected.first().content
        }, user);
        msg.delete();
        collected.first().delete();
      })
      .catch((e) => console.log(e))
    })
    .catch((e) => console.log(e));
  }

  warn (message, mod, mailInfo) {
    let timestamp = Date.getISOtime(Date.now());
    let embed = message.embeds[0];
    embed.fields = Embed.fielder(embed.fields, "On " + timestamp + ", " + mod.tag + " warned user.", "", false)
    this.editor(embed, message);
    this.Output.sender({
      "title": "Warning from server " + this.guild.name + ":",
      "description": "You are abusing the modmail system. Keep requests civil and do not spam the inbox."
    }, this.Search.users.byTag(mailInfo.tag));
  }

  timeout (message, mod, mailInfo) {
    let timestamp = Date.getISOtime(Date.now());
    let embed = message.embeds[0];
    embed.fields = Embed.fielder(embed.fields, "On " + timestamp + ", " + mod.tag + " timed out user for 24h.", "", false)
    this.modmail[message.id].timeout = Date.now();
    this.setData(this.modmail);
    this.editor(embed, message);
    this.Output.sender({
      "title": "You have been timed out from sending messages to server " + this.guild.name + ":",
      "description": "You will not be able to send messages to the mod team for 24 hours."
    }, this.Search.users.byTag(mailInfo.tag));
  }

  //Old code from here onwards

  typeadd (args, argument) {
    let argsindex = -1;
    if(argument.match(/[^a-zA-Z0-9\.!\?',;:"£\$%~\+=()\s\u200B-\u200D\uFEFF-]+/g)) return this.Output.onError(`Invalid characters; please reformat your quote.`);
    for(let i = args.length -1; i >= 0; i--) {
      if(args[i].startsWith("-")) argsindex = i;
    };
    if(argsindex === -1) return this.Output.onError(`No source provided/Incorrect format!`);
    let text = args.slice(0, argsindex).join(" ");
    let source = args.slice(argsindex, args.length).join(" ").slice(1).trim();
    if(text.startsWith(`"`) && text.endsWith(`"`)) text = text.slice(1, -1);
    if(text.length < 265) return this.Output.onError(`Entry **${265 - text.length}** characters too short! Please try again.`);
    if(text.length > 529) return this.Output.onError(`Entry **${text.length - 529}** characters too long! Please try again.`);
    this.Output.generic("Quote added, up for review");
    this.sender({
      "title": "New TypeAdd, " + message.author.tag + ", from " + source,
      "description": text,
      "footer": Embed.footer("Submitted: " + getISOtime(Date.now()) + ", " + text.length + " characters.")
    }, (quote) => {
      let typingentries = DataManager.getData("./typing_articles4.json") || [];
      let newentry = {
        "Source": source,
        "Text": text,
        "Submitter": message.author.tag,
        "SubmitterID": message.author.id,
        "Quote": quote.id,
        "Approved": false
      };
      if(typingentries[0]) {
        typingentries.push(newentry)
      } else {
        typingentries[0] = newentry;
      };
      DataManager.setData(typingentries, "./typing_articles4.json");
      return quote;
    })
    .then(quote => {
      quote.react(getemojifromname("true"));
      setTimeout(() => {
        quote.react(getemojifromname("false"));
      }, 500);
      let quoteinfo = {
        "channel": quote.channel.id,
        "message": quote.id,
        "author": message.author.id,
        "emoji1": true,
        "event1": "true",
        "emoji2": "false",
        "event2": "false"
      };
      if(!server.ticketsv2 || !server.ticketsv2[0]) {
        server.ticketsv2 = [];
        server.ticketsv2[0] = quoteinfo;
      } else {
        server.ticketsv2.push(quoteinfo);
      };
      DataManager.setGuildData(server);
      return [quote, quoteinfo];
    })
    .then(([quote, quoteinfo]) => {
      let reactionsfilter = (reaction, user) => (reaction.emoji.name === "true" || reaction.emoji.name === "false") && !user.bot;
      let collector = quote.createReactionCollector(reactionsfilter, {
        "max": 1,
      })
      collector.on("collect", (collected) => {
        if(collected.emoji.name === "true") {
          emojiListener.emit("true", quoteinfo);
          return;
          };
        if(collected.emoji.name === "false") {
          emojiListener.emit("false", quoteinfo);
          return;
        };
      });
      collector.on("end", (collected)  => {
        quote.clearReactions();
      })
    })
    .catch(`Some error somewhere.`)
  }
}

module.exports = ModMail;

Date.gettime = function(ms) {
  let time = new Date(ms);
  time.hours = time.getUTCHours();
  time.minutes = time.getUTCMinutes();
  time.seconds = time.getUTCSeconds();
  time.milliseconds = time.getUTCMilliseconds();
  time.days = Math.floor(time.hours/24);
  time.hours = time.hours - (24 * time.days);
  return time;
};

Date.getISOtime = function(ms) {
  return Date.gettime(ms).toString().slice(0, 24); 
};