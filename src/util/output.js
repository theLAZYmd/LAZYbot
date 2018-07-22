const Discord = require("discord.js");
const config = require("../config.json");
//const DataManager = require("./datamanager.js");
//const Parse = require("./parse.js");
const Embed = require("./embed.js");
const DBuser = require("../util/dbuser.js");

class Output {

  constructor(message) {
    this.message = message;
    this.client = this.message.client;
    this.author = this.message.author;
    this.bot = this.author.bot && message.embeds && message.embeds[0];
    this.guild = this.message.guild;
    this.channel = this.message.channel;
    this.server = this.guild ? require("../util/datamanager.js").getServer(this.guild) : "";
    this.member = this.guild ? this.message.member : "";
    this.reboot = this.client.reboot;
    this.httpboolean = this.client.httpboolean;
    this.Search = new (require("../util/search.js"))(this.message);
    this.Check = new (require("../util/check.js"))(this.message);
  }

  sender(embed, NewChannel) {
    return new Promise((resolve, reject) => {
      Embed.sender(embed, NewChannel ? NewChannel : this.channel)
      .then(message => resolve(message))
      .catch(error => this.onError(error));
    })
  }

  editor(embed, NewMessage) {
    return new Promise((resolve, reject) => {
      Embed.editor(embed, NewMessage ? NewMessage : this.message)
      .then(message => resolve(message))
      .catch(error => this.onError(error));
    })
  } 
  
  onTrackSuccess(userID, source, sourceusername) {
    let user = this.Search.get(userID);
    let member = this.Search.getMember(user);
    let dbuser = DBuser.getfromuser(user);
    let newRole = this.Search.getRole(this.server.roles.beta);
    member.addRole(newRole)
    .then(() => {
      let sourceratinglist = this.RatingData(dbuser, source);
      let sourceuserprofile = this.Profiles(dbuser, source);
      Embed.sender(new Discord.RichEmbed()
        .setTitle(`${getemojifromname(source.toLowerCase().replace(".",""))} Linked ${member.user.username} to '${sourceusername}'`)
        .setDescription(`${sourceuserprofile}\nAdded to the role **${newRole.name}**. Current highest rating is **${dbuser.ratings[source].maxRating}**\n` + sourceratinglist)
        .setColor(this.server.colors.ratings)
      , this.channel)
    })
    .catch((error) => console.log("Error adding new role", error));
  }

  onRatingUpdate(user, rankingobject) {
    let dbuser = DBuser.getfromuser(user);
    let embed = new Discord.RichEmbed()
      .setColor(this.server.colors.ratings)
    for(let i = 0; i < config.sources.length; i++) {
      let source = config.sources[i][1];
      if(dbuser[source]) {
        let sourceratings = source + "ratings";
        let sourceratinglist = Parse.RatingData(dbuser, source, rankingobject);
        let sourceuserprofile = Parse.Profiles(dbuser, source);
        embed.addField(`${getemojifromname(source)} ${rankingobject ? `${dbuser[source]} Rankings` : `Updated ${dbuser[source]}`}`, `${sourceuserprofile} ${rankingobject ? `                                \u200B\n` : `\nCurrent highest rating is **${dbuser[sourceratings].maxRating}**                \u200B\n`}` + sourceratinglist, true)
      }
    };
    Embed.sender(embed, this.channel);
  }

  onRemoveSuccess(userID, source, username) {
    let user = this.Search.getuser(userID);
    let member = this.Search.getmemberfromuser(user);
    if(source === "chesscom") source = "chess.com";
    Embed.sender({
      "title": `Stopped tracking via !remove command`,
      "description": `Unlinked **${user.tag}** from ${source} account **${username}**.`,
      "color": config.colors.ratings
    }, this.channel)
  }

  generic(description, NewChannel) {
    return new Promise((resolve, reject) => {
      this.sender({
        "description": description
      }, NewChannel)
      .then(message => resolve(message))
      .catch(e => console.log(JSON.stringify(e)));
    })
  }

  onError(error, NewChannel) {
    let channel = NewChannel ? NewChannel : this.channel;
    console.log(error);
    let description = typeof error === "object" ? "**" + error.name + ":** " + error.message : error;
    return new Promise((resolve, reject) => {
      this.sender({
        "description": description,
        "color": config.colors.error
      }, channel)
      .then(message => resolve(message))
      .catch(e => console.log(JSON.stringify(e)));
    })
  }

  onModError(error) {
    let ModChannel = User.getChannel(server.channels.mod);
    this.onError(error, ModChannel)
  }

  toOwner(message) {
    if(!message) throw "Failed to define a message."
    for(let i = 0; i < config.ids.owner.length; i++) {
      let owner = this.client.users.get(config.ids.owner[i])
      if(owner) owner.send(message);
    };
    return;
  }

  /*VALID INPUTS FOR PAGINATOR

  Paginator takes an embed an adds ⬅ ➡ reactions to it. When these are clicked, a message is edited with another (similar looking embed)
  i.e. the 'second page' of that embed.

  Paginator takes input arguments of the constructor and method to purely produce a page embed.
  That method must take no input values except page.
  Both constructor and method are used because method might draw on inputs from constructor to function.

  Third inpute is the maximum number of pages on the function. Needed to create the footer.
  
  Fourth input is the time period to await ⬅ ➡ reactions.
  Can be modified in the future to use client.on('MessageReaction', () => {}) instead of .awaitReactions

  When paginator is triggered, it loads page 0 of the series.
  Upon MessageReaction, it changes the pagecount to either ++ or -- and calls the given Constructor.method() to return an embed.
  If a null value is returned, this must be because the maxpages value for that series is exceeded (i.e. trying to call the 3rd page when there are only 2).
  If null value therefore, the pagecount is lowered again. Otherwise, the original message is edited with the new embed.
  */

  paginator(Constructor, method, maxpages, _period) {
    let page = 0, period = _period ? _period : 30000;
    let embed = Constructor[method](page);
    embed.footer = embed.footer && maxpages === 1 ? embed.footer : Embed.footer(`${page + 1} / ${maxpages}`);
    this.sender(embed)
    .then(pmsg => {
      if(maxpages < 2) return;
      pmsg.react("⬅");
      setTimeout(() => {
        pmsg.react("➡");
      }, 500); //react with ⬅ ➡
      let reactionsfilter = (reaction, user) => (reaction.emoji.name === "⬅" || reaction.emoji.name === "➡") && !user.bot;
      let collector = pmsg.createReactionCollector(reactionsfilter, {
        "time": period //create a reactions collector
      });
      collector.on("collect", (collected) => {
        for(let [key, value] of collected.users) {
          if(!value.bot) collected.remove(value); //if emoji is reacted with by a user, remove it (for ease)
        };
        if(collected.emoji.name === "➡") page++;
        if(collected.emoji.name === "⬅") page--;
        let embed = Constructor[method](page, true);
        if(embed && page <= maxpages) {
          embed.footer = Embed.footer(`${page + 1} / ${maxpages}`);
          this.editor(embed, pmsg);
        } else page--; //if the maxpagecount is exceeded and the builder
      });
      collector.on("end", (collected) => {
        pmsg.clearReactions().catch(e => console.log(e))
      })
    })
  }

}

module.exports = Output;