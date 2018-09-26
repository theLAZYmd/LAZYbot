const Parse = require("../util/parse.js");
const DataManager = require("../util/datamanager.js");
const packagestuff = DataManager.getFile("./package.json");
const config = DataManager.getFile("./src/config.json");

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

  upversion (argument) {
    let version = packagestuff.version.split(".", 3);
    if (!argument) version[2] = (Number(version[2]) + 1).toString();
    else if (argument.toLowerCase().includes("big")) version[1] = (Number(version[1]) + 1).toString();
    else if (argument.toLowerCase().includes("huge")) version[0] = (Number(version[0]) + 1).toString();
    this.version(version.join("."));
  }

  downversion (argument) {
    let version = packagestuff.version.split(".", 3);
    if (!argument) version[2] = (Number(version[2]) - 1).toString();
    else if (argument.toLowerCase().includes("big")) version[1] = (Number(version[1]) - 1).toString();
    else if (argument.toLowerCase().includes("huge")) version[0] = (Number(version[0]) - 1).toString();
    this.version(version.join("."));
  }

  version (version) {
    version = version.match(/[0-9]+.[0-9]+.[0-9]/);
    if (!version) return this.Output.generic("You are using LAZYbot version v." + packagestuff.version);
    packagestuff.version = version[0];
    DataManager.setFile(packagestuff, "./package.json");
    this.guild.me.setNickname(`LAZYbot${this.client.user.id === config.ids.betabot ? "beta" : ""} v.` + version)
    this.Output.generic(`${packagestuff.name} version has been ${this.command === "upversion" ? "upped" : "modified"} to **v.${version}**!`);
  }


}

module.exports = Set;