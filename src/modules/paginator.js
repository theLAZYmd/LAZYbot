const Parse = require("../util/parse.js");
const Embed = require("../util/embed.js");
const DataManager = require("../util/datamanager.js");

class Paginator extends Parse {
  constructor(message) {
    super(message);
    if (!this.reactionmessages[this.server.id]) this.reactionmessages[this.server.id] = {};
    this.paginator = this.reactionmessages[this.server.id].paginator || {};
  }

  async setData(paginator) {
    this.reactionmessages.paginator = paginator;
    DataManager.setServer(this.reactionmessages, "./src/data/reactionmessages.json");
  }

  /*VALID INPUTS FOR PAGINATOR

  Paginator takes an embed an adds ⬅ ➡ reactions to it. When these are clicked, a message is edited with another (similar looking embed)
  i.e. the 'second page' of that embed.

  Paginator takes input arguments of an array of embeds and a period over which to accept valid reactions. It stores these (temporarily) in reactionmessages.json
  When reaction is triggered, it changes the pagecount to either ++ or -- and loads the next embed in that array
  */

  async sender(embedgroup, period, path) {
    try {
      let embed = embedgroup[0];
      let emojis = ["⬅", "➡"];
      emojis.push(period === Infinity ? "🔄" : "❎");
      embed.footer = embed.footer && embedgroup.length === 1 ? embed.footer : Embed.footer(`1 / ${embedgroup.length}`);
      let msg = await this.Output[embedgroup.length < 2 ? "sender" : "reactor"](embed, this.channel, emojis);
      this.paginator[msg.id] = {
        embedgroup,
        "period": period === Infinity ? "Infinity" : (period || 30000),
        "page": 0,
        "author": this.author.id
      };
      if (this.command === "...") this.paginator[msg.id].path = path;
      this.setData(this.paginator);
      if (period === Infinity || period > 2147483647) return;
      setTimeout(() => {
        msg.clearReactions()
          .catch((e) => console.log(e));
        delete this.paginator[msg.id];
        this.setData(this.paginator);
      }, period);
    } catch (e) {
      if (e) this.Output.onError(e);
    }
  }

  async react(reaction, user, data) {
    try {
      if (reaction.emoji.name === "➡") data.page++;
      if (reaction.emoji.name === "⬅") data.page--;
      if (reaction.emoji.name === "🔄") data.page = 0;
      reaction.remove(user);
      if (reaction.emoji.name === "❎" && user.id === data.author) reaction.message.delete();
      if (!/➡|⬅|🔄/.test(reaction.emoji.name)) throw "";
      if (data.page < 0 || data.page >= data.embedgroup.length) throw "";
      let embed = data.embedgroup[data.page];
      if (!embed) throw "Couldn't generate embed for page " + (data.page + 1) + ".";
      embed.footer = Embed.footer(`${data.page + 1} / ${data.embedgroup.length}`);
      this.Output.editor(embed, reaction.message);
      this.paginator[reaction.message.id] = data;
      this.setData(this.paginator);
    } catch (e) {
      if (e) this.Output.onError(e);
    }
  }

}

module.exports = Paginator;