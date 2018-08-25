const Parse = require("../util/parse.js");

class Award extends Parse {

  on () {
    this.message.delete();
  }

  timely () {
    this.Output.onError("Testing mode is enabled, `.timely` cannot be used in this channel.");
  }
}

module.exports = Award;