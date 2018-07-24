const Parse = require("../util/parse.js");
const config = require("../config.json");

class Award extends Parse {

  constructor(message) {
    super(message)
  }

  on() {
    if(this.author.id === config.ids.bot) this.message.delete();
  }
}

module.exports = Award;