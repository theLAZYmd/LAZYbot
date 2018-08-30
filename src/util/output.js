const config = require("../config.json");
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
      if (!NewMessage) throw "**this.Output.editor():** Couldn't find message to edit.";
      return await Embed.editor(embed, NewMessage);
    } catch (e) {
      if (e) this.onError(e);
    }
  }

  async generic(description, NewChannel) {
    try {
      return await this.sender({
        description
      }, NewChannel);
    } catch (e) {
      if (e) this.onError(e);
    }
  }

  async data(json, NewChannel) {
    try {
      let string = JSON.stringify(json, null, 2).replace(/`/g, "\\`");
      let index = Math.ceil(string.length / 2048);
      let keylength = Math.floor(string.length / index);
      for (let i = 0; i < index; i++)
        this.sender({
          "color": 9359868,
          "description": "```json\n" + string.slice(i * keylength, (i === index.length - 1 ? index.length : i * keylength + keylength)) + "```",
          "footer": Embed.footer((i + 1) + " / " + index)
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
        "time": 30000
      }, data);
      data.emojis = ["✅", "❎"];
      let msg = await this.reactor(data.embed ? data.embed : {
        "description": data.description ? data.description : "**" + data.author.tag + "** Please confirm " + data.action + "."
      }, data.channel, data.emojis);
      let filter = (reaction, user) => data.emojis.includes(reaction.emoji.name) && (data.author.id === user.id || (data.role && this.Search.members.byUser(user).roles.has(data.role.id)));
      let collected = await msg.awaitReactions(filter, {
        "max": 1,
        "time": data.time,
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
        "role": "",
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
      let msg = await this.reactor({author,
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