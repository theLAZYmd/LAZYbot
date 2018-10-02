const Parse = require("../util/parse.js");
const Embed = require("../util/embed.js");

class Paginator extends Parse {
  constructor(message) {
    super(message);
  }

  get paginator() {
    if (this._paginator) return this._paginator;
    return this.reactionmessages.paginator;
  }

  set paginator(paginator) {
    let reactionmessages = this.reactionmessages;
    reactionmessages.paginator = paginator;
    this.reactionmessages = reactionmessages;
    this._paginator = paginator;
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
      let paginator = this.paginator;
      let emojis = ["⬅", "➡"];
      emojis.push(period === Infinity ? "🔄" : "❎");
      embed.footer = embed.footer && embedgroup.length === 1 ? embed.footer : Embed.footer(`1 / ${embedgroup.length}`);
      let msg = await this.Output[embedgroup.length < 2 ? "sender" : "reactor"](embed, this.channel, emojis);
      paginator[msg.id] = {
        embedgroup,
        "period": period === Infinity ? "Infinity" : (period || 30000),
        "page": 0,
        "author": this.author.id,
        "cmdID": this.message.id
      };
      if (this.command === "...") paginator[msg.id].path = path;
      this.paginator = paginator;
      if (period === Infinity || period > 2147483647 || (this.command && this.command === "...")) return;
      setTimeout(() => {
        msg.clearReactions()
          .catch(() => {});
        delete paginator[msg.id];
        this.paginator = paginator;
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
      if (reaction.emoji.name === "❎" && user.id === data.author) {
        reaction.message.delete();
        let paginator = this.paginator;        
        let msg = await this.channel.fetchMessage(paginator[reaction.message.id].cmdID).catch(() => {});
        if (msg) msg.delete();
        delete paginator[reaction.message.id];
        this.paginator = paginator;
        throw "";
      }
	    reaction.remove(user);
      if (!/^(?:➡|⬅|🔄)$/.test(reaction.emoji.name)) throw "";
      if (data.page < 0 || data.page >= data.embedgroup.length) throw "";
      let paginator = this.paginator;
      let embed = data.embedgroup[data.page];
      if (!embed) throw "Couldn't generate embed for page " + (data.page + 1) + ".";
      embed.footer = Embed.footer(`${data.page + 1} / ${data.embedgroup.length}`);
      this.Output.editor(embed, reaction.message);
      paginator[reaction.message.id] = data;
      this.paginator = paginator;
      if (data.page === 0 || data.period !== "Infinity") throw "";
      if (!this.client.timeouts) this.client.timeouts = {};
      if (this.client.timeouts[reaction.message.id]) clearTimeout(this.client.timeouts[reaction.message.id]);
      this.client.timeouts[reaction.message.id] = setTimeout(() => {
        reaction.emoji.name = "🔄";
        this.client.emit("messageReactionAdd", reaction, user);
      }, 600000);
    } catch (e) {
      if (e) throw e;
    }
  }

}

module.exports = Paginator;