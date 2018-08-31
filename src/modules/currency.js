const Parse = require("../util/parse.js");
const Color = require("./color.js");

class Currency extends Parse {

  on () {
    this.message.delete();
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

}

module.exports = Currency;