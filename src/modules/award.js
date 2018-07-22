const Parse = require("../util/parse.js");

class Award extends Parse {

  constructor(message) {
    super(message)
  }

  on() {
    this.message.delete();
  }
}

module.exports = Award;