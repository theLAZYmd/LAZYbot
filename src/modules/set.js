const Parse = require("../util/parse.js");
const DataManager = require("../util/datamanager.js");

class Set extends Parse {

  constructor(message) {
    super(message);
  }

  username(args) {
    if(args.length !== 1) return;
    let newUsername = args[0];
    if(newUsername !== this.client.user.username) {
      this.client.user.setUsername(newUsername);
      this.Output.generic(`Bot username has been updated to **${newUsername}**`);
    }
    else this.Output.onError(`Bot username was already **${this.client.user.tag}**!`);
  }

  genericprefix(argument) {
    let newPrefix = argument.replace("\"", "").replace("`", "");
    this.server.prefixes.generic = newPrefix
    DataManager.setServer(this.server);
    this.Output.generic(`**${this.author.tag}** has updated the generic prefix on **${this.guild.name}** to **${newPrefix}** !`);
    console.log(`${this.author.username} [${this.author.id}] has updated the generic prefix to ${newPrefix}.`);
  }

  nadekoprefix(argument) {
    let newPrefix = argument.replace("\"", "").replace("`", "");
    this.server.prefixes.nadeko = newPrefix
    DataManager.setServer(this.server);
    this.Output.generic(`**${this.author.tag}** has updated the nadeko prefix on **${this.guild.name}** to **${newPrefix}** !`);
    console.log(`${this.author.username} [${this.author.id}] has updated the nadeko prefix to ${newPrefix}.`);
  }


}

module.exports = Set;