const Parse = require("../util/parse.js");
const DBuser = require("../util/dbuser.js");
const DataManager = require("../util/datamanager.js");
const Embed = require("../util/embed.js");

class Eval extends Parse {

  constructor(message) {
    super(message);
  }

  run (args, argument) {
    if(!this.Check.owner(this.author)) return;
    if(argument.startsWith("```") && argument.endsWith("```")) {
      argument = argument.slice(args[0] === "```js" ? 5 : 3, -3).trim();
      console.log(argument);
      eval(argument)
      return;
    } else {
      this.Output.onError("Incorrect formatting! Use a code block!")
    };
  }
}

module.exports = Eval;