const Parse = require("../../util/parse.js");
const Color = require("../Profile/color.js");

class Currency extends Parse {

  on () {
    this.message.delete().catch(() => {});
  }

  timely () {
    this.Output.onError("Testing mode is enabled, `.timely` cannot be used in this channel.");
  }

  buy (args) {
    switch (args[0].toLowerCase()) {
      case "6":
        Color.add(this.member);
      case "choosecolor":
        Color.add(this.member);
    }
  }

  gild (messageReaction, user) {
    if (messageReaction.emoji.id === "481996881606475798" && !user.bot) return messageReaction.remove(user);
  }

}

module.exports = Currency;