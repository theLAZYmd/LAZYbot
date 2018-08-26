const config = require("../config.json");
const Render = require("./render.js");
const Embed = require("./embed.js");
const Parse = require("./parse.js");
const DataManager = require("./datamanager.js");

class Output extends Parse {

  constructor(message) {
    super(message);
  }

  async sender(embed, NewChannel) {
    try {
      if (config.states.debug) throw "";
      if (!embed) throw "**this.Output.sender():** Embed object is undefined.";
      return await Embed.sender(embed, NewChannel ? NewChannel : this.channel);
    } catch (e) {
      if (e) this.onError(e);
    }
  }

  async editor(embed, NewMessage) {
    try {
      if (!embed) throw "**this.Output.editor():** Embed object is undefined.";
      return await Embed.editor(embed, NewMessage ? NewMessage : this.message);
    } catch (e) {
      if (e) this.onError(e);
    }
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
    for (let source in config.sources) {
      if (rankingObject[source]) {
        let sourceratinglist = "";
        if (rankingObject[source]) {
          sourceratinglist +=
            "Overall: **" +
            rankingObject[source].maxRating.rating +
            "** (#" +
            rankingObject[source].maxRating.rank +
            ")\n";
          for (let key in config.variants[source]) {
            let variant = config.variants[source][key];
            if (rankingObject[source][key]) sourceratinglist +=
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

  async generic(description, NewChannel) {
    try {
      return this.sender({
        description
      }, NewChannel);
    } catch (e) {
      if (e) this.onError(e);
    }
  }

  async onError(error, channel = this.channel) {
    try {
      console.log(error);
      let description = typeof error === "object" ? "**" + error.name + ":** " + error.message : error;
      this.sender({
        description,
        "color": config.colors.error
      }, channel)
    } catch (e) {
      if (e) this.onError(e);
    }
  }

  onModError(error) {
    let ModChannel = User.getChannel(server.channels.mod);
    this.onError(error, ModChannel)
  }

  async reactor(embed, channel, emojis) { //sends a message with custom emojis
    try {
      if (!embed) throw "";
      let msg = await this.sender(embed, channel); //send it
      for (let i = 0; i < emojis.length; i++) { //then react to it
        setTimeout(() => {
          msg.react(emojis[i]).catch((e) => console.log(e));
        }, i * 1000); //prevent api spam and to get the order right
      };
      return msg;
    } catch (e) {
      if (e) this.Output.onError(e);
      throw e;
    }
  }

  async confirm(data = {}, r) {
    try {
      data = Object.assign({
        "action": "this action.",
        "channel": this.channel,
        "author": this.author,
        "emojis": ["✅", "❎"]
      }, data);
      let msg = await this.reactor({
        "description": data.description ? data.description : "Please confirm " + data.action + "."
      }, data.channel, data.emojis);
      let filter = (reaction, user) => data.emojis.includes(reaction.emoji.name) && data.author.id === user.id;
      let collected = await msg.awaitReactions(filter, {
        "max": 1,
        "time": 30000,
        "errors": ["time"]
      });
      msg.delete();
      if (collected.first().emoji.name === "✅") return true;
      else {
        if (r) return false;
        else throw "";
      };
    } catch (e) {
      if (e) this.Output.onError(e);
      throw "";
    }
  }

  async choose(data = {}) {
    try {
      data = Object.assign({
        "author": this.author,
        "channel": this.channel,
        "filter": () => {
          return true
        },
        "options": [],
        "time": 18000,
        "title": "",
        "type": "option"
      }, data)
      let emojis = [],
        description = "";
      let author = data.title ? {
        "name": data.title
      } : {};
      let title = `Please choose a${/^(a|e|i|o|u)/.test(data.type) ? "n" : ""} ${data.type}:`;
      for (let i = 0; i < data.options.length; i++) {
        emojis.push((i + 1) + "⃣");
        description += (i + 1) + "⃣ **" + data.options[i] + "**\n";
      };
      emojis.push("❎");
      let msg = await this.reactor({
        author,
        title,
        description
      }, data.channel, emojis);
      let filter = (reaction, user) => {
        if (user.id !== data.author.id) return false;
        if (reaction.emoji.name === "❎") return true;
        let number = reaction.emoji.name.match(/([1-9])⃣/);
        if (Number(number[1]) >= data.options.length) return false;
        return true;
      };
      let collected = await msg.awaitReactions(filter, { //wait for them to react back
        "max": 1,
        "time": 30000,
        "errors": ["time"]
      });
      msg.delete();
      if (collected.first().emoji.name === "❎") throw "";
      let number = Number(collected.first().emoji.name.match(/([1-9]⃣)/));
      return (number - 1); //and if valid input, send of modmail for that guild
    } catch (e) {
      if (e) this.onError(e);
    }
  }

  async response(data = {}, message) {
    try {
      data = Object.assign({
        "author": this.author,
        "channel": this.channel,
        "description": "Please type your response below.",
        "filter": () => {
          return true
        },
        "time": 30000
      }, data);
      let author = data.title ? Embed.author(data.title) : {};
      let msg = await this.reactor({
        "description": data.description
      }, data.channel, ["❎"]);
      let rfilter = (reaction, user) => {
        if (user.id !== data.author.id) return false;
        if (reaction.emoji.name !== "❎") return false;
        return true;
      };
      let mfilter = m => m.author.id === data.author.id && m.content && data.filter(m); //condition, plus user speicifed filter
      try {
        let collected = await Promise.race([
          (async () => {
            let reaction = await msg.awaitReactions(rfilter, { //wait for them to react back
              "max": 1,
              "time": data.time,
              "errors": ["time"]
            });
            if (reaction) return false;
            throw ""
          })().catch(() => {}),
          msg.channel.awaitMessages(mfilter, {
            "max": 1,
            "time": data.time,
            "errors": ["time"]
          })
        ]);
        if (!collected) throw "";
        msg.delete();
        if (message) return collected.first();
        else return collected.first().content;
      } catch (e) {
        msg.delete();
        throw e;
      }
    } catch (e) {
      if (e) this.Output.onError(e);
      throw e;
    }
  }

}

module.exports = Output;