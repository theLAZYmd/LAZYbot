const config = require("../config.json");
const Render = require("./render.js");
const Embed = require("./embed.js");

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
    this.debug = config.states.debug || false;
  }

  sender(embed, NewChannel) {
    if(this.debug) return () => {};
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
  
  onTrackSuccess(dbuser, source, username) {
    let user = this.Search.users.get(dbuser.id);
    let member = this.Search.members.get(user);
    let newRole = this.Search.roles.get(this.server.roles.beta);
    let account = dbuser[source.key][username];
    member.addRole(newRole)
    .then(() => {
      this.sender({
        "title": this.Search.emojis.get(source.key) + `Linked ${member.user.username} to '${username}'`,
        "description":
          Render.profile(dbuser, source.key, username) + "\n" +
          `Added to the role **${newRole.name}**. Current highest rating is **${account.maxRating}**\n` +
          Render.ratingData(dbuser, source.key, username),
        "color": this.server.colors.ratings
      });
    })
    .catch((e) => console.log("Error adding new role", e));
  }

  onRatingUpdate(dbuser) {
    let embed = {
      "color": this.server.colors.ratings
    };
    let whitespace = "                                \u200B"
    for(let source in config.sources) {
      for(let account in dbuser[source]) {
        let sourceratings = source + "ratings";
        let sourceratinglist = Render.ratingData(dbuser, source, rankingobject);
        let sourceuserprofile = Render.profile(dbuser, source, account);
        embed.fields = Embed.fielder(
          embed.fields,
          `${this.Search.emojis.get(source)} Updated ${dbuser[source]}`,
          sourceuserprofile + "\nCurrent highest rating is **" + dbuser[sourceratings].maxRating + "**" + whitespace + "\n",
          true
        )
      }
    };
    this.sender(embed);
  }

  /* rankingObject:
  { lichess:
   { blitz: { rating: '1879', rank: 46 },
     bullet: { rating: '2056', rank: 37 },
     rapid: { rating: '1997', rank: 28 },
     crazyhouse: { rating: '2158', rank: 31 },
     '3-check': { rating: '1708', rank: 31 },
     maxRating: { rating: '2158', rank: 59 } },
  chesscom:
   { crazyhouse: { rating: '2104', rank: 1 },
     bug: { rating: '2155', rank: 1 },
     maxRating: { rating: '2155', rank: 21 } },
  bughousetest: { maxRating: { rating: '1351', rank: 7 } } }
  */

  onRank(dbuser, rankingObject) {
    let embed = {
      "color": this.server.colors.ratings
    };
    let whitespace = "                                \u200B"
    for(let source in config.sources) {
      if(rankingObject[source]) {
        let sourceratinglist = "";
        if(rankingObject[source]) {
          sourceratinglist +=
            "Overall: **" +
            rankingObject[source].maxRating.rating +
            "** (#" +
            rankingObject[source].maxRating.rank +
            ")\n";
          for(let key in config.variants[source]) {
            let variant = config.variants[source][key];
            if(rankingObject[source][key]) sourceratinglist +=
              variant.name +
              ": " + 
              (rankingObject[source][key].rating.toString().endsWith("?") ? "" : "**") +
              rankingObject[source][key].rating +
              (rankingObject[source][key].rating.toString().endsWith("?") ? "" : "**") +
              " (#" +
              rankingObject[source][key].rank +
              ")\n";
          }
        };
        let sourceuserprofile = Render.profile(dbuser, source, dbuser[source]._main); //dbuser, source, username
        embed.fields = Embed.fielder(
          embed.fields,
          `${this.Search.emojis.get(source)} ${config.sources[source].name} Rankings`,
          sourceuserprofile + whitespace + "\n" + sourceratinglist,
          true
        )
      }
    };
    this.sender(embed);
  }

  onRemoveSuccess(dbuser, source, username) {
    this.sender({
      "title": `Stopped tracking via !remove command`,
      "description": `Unlinked **${username}** from ${source.key} account **${dbuser.username}**.`,
      "color": config.colors.ratings
    })
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
      .catch(e => console.log(e));
    })
  }

  onModError(error) {
    let ModChannel = User.getChannel(server.channels.mod);
    this.onError(error, ModChannel)
  }

  doNothing(error) {
    //do nothing
  }

  toOwner(message) {
    if(!message) throw "Failed to define a message."
    if(this.debug) return () => {};
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
        if(page < 0) return page++;
        if(embed && page < maxpages) {
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