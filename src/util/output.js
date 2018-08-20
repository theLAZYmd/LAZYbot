const config = require("../config.json");
const Render = require("./render.js");
const Embed = require("./embed.js");
const Parse = require("./parse.js");
const DataManager = require("./datamanager.js");

class Output extends Parse {

  constructor(message) {
    super(message);
  }

  sender(embed, NewChannel) {
    if(this.debug) return () => {};
    return new Promise((resolve, reject) => {
      Embed.sender(embed, NewChannel ? NewChannel : this.channel)
      .then(message => {
        resolve(message)
      })
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
    let Output = this;
    return new Promise((resolve, reject) => {
      Output.sender({
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
    }
  }

  reactor (embed, channel, emojis) {
    return new Promise ((resolve, reject) => {
      this.sender(embed, channel) //send it
      .then((msg) => {
        for (let i = 0; i < emojis.length; i++) { //then react to it
          setTimeout(() => {
            msg.react(emojis[i])
          }, i * 1000); //prevent api spam and to get the order right
        };
        return msg;
      })
      .then((msg) => resolve(msg))
    })
    .catch((e) => console.log(e));
  }

}

module.exports = Output;