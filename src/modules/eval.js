const Parse = require("../util/parse.js");
const DBuser = require("../util/dbuser.js");
const DataManager = require("../util/datamanager.js");
const Embed = require("../util/embed.js");
const DebuggingConstructor = require("../util/debugging.js");
const Router = require("../util/router.js");
const request = require("request");
const rp = require("request-promise");

class Eval extends Parse {

  constructor(message) {
    super(message);
    this.Debugging = new DebuggingConstructor(this.client);
  }

  async run(args, argument) {
    try {
      if (!this.Check.owner(this.author)) throw "That command is bot owner only.\nIf you are not an active developer on the bot, you cannot use this command."; //extra protection, in case permission.js fails
      if (argument.startsWith("```") && argument.endsWith("```")) argument = argument.slice(args[0].length, -3).trim();
      else throw "Incorrect formatting! Use a code block!";
      console.log(argument);
      eval(argument);
    } catch (e) {
      if (e) this.Output.onError(e)
    };
  }
}

module.exports = Eval;