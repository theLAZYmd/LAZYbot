const Parse = require("../util/parse.js");
const config = require("../config.json");

class Award extends Parse {

  constructor(message) {
    super(message)
  }

  on (channel) {
    channel.awaitMessages((m) => m.author.id === config.ids.bot && m.embeds && m.embeds[0] && m.embeds[0].description.includes("has awarded"), {
      "time": 2000,
      "max": 1
    })
    .then(() => {
      this.message.delete();
    })
    .catch((e) => console.log(e));
  }
}

module.exports = Award;