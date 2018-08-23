const Parse = require("../util/parse.js");
const UtilityConstructor = require("./utility.js");

class Emoji extends Parse {
  constructor(message) {
    super(message);
    this.Utility = new UtilityConstructor(this.message);
    this.find = this.Utility.find;
  }

  react (args) {
    let id = args.shift();
    this.find([id])
    .then((msg) => {
      this.emoji(args, msg);
      this.message.delete();
    })
    .catch(() => {
      let user = this.Search.users.get(id);
      if (!user) return this.Output.onError("Couldn't find a user or message matching that ID in this channel.");
      this.channel.fetchMessages({
        "limit": 50
      })
      .then((_messages) => {
        let messages = _messages
          .filter(msg => msg.author.id === user.id && msg.id !== this.message.id)
          .sort((a, b) => {
            return b.createdTimestamp - a.createdTimestamp;
          });
        this.emoji(args, messages.first());
        this.message.delete();
      })
    })
  }

  emoji (args, message = this.message) {
    return new Promise ((resolve, reject) => {
      let succeeded = [], failed = [];
      for (let i = 0; i < args.length; i++) {
        let emoji = this.Search.emojis.get(args[i].trim());
        if (emoji.id === "481996881606475798" && this.command !== "gild") continue;
        if (!emoji) {
          failed.push(args[i]);
          continue;
        };
        setTimeout(() => {
          message.react(emoji);
        }, i * 1000);
        succeeded.push(emoji.id);
      };
      if (this.command === "gild") return resolve(succeeded);
      let filter = (reaction, user) => succeeded.includes(reaction.emoji.id) && !user.bot;
      let collector = message.createReactionCollector(filter, {
        "time": 180000
      });
      collector.on("collect", reaction => {
        reaction.remove(this.client.user)
        .catch(e => console.log(e));
      });
      resolve(succeeded);
      if (failed[0]) this.Output.onError("Couldn't find emoji " + failed.join(", ") + ".");
    })
  }

  gild (args) {
    args.push("481996881606475798");
    this.react(args);
    this.channel.send(".take 1 " + this.author.id);
  }

}

module.exports = Emoji;