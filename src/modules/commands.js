const Parse = require("../util/parse.js");
const Embed = require("../util/embed.js");
const DataManager = require("../util/datamanager.js");
const commands = DataManager.getFile("./src/data/commands.json");

class Commands extends Parse {
  constructor (message) {
    super(message);
  }

  list () { //command to generate all listing
    let embed = { //define embed first
      "color": 11126483,
      "fields": [],
      "footer": Embed.footer(`Type "${this.server.prefixes.generic}h CommandName" to see help for a specified command. e.g. "${this.server.prefixes.generic}h !profile"`)
    };
    let modules = Object.entries(Commands.genObject(this.server)); //get parsed command list of {module: {command: firstalias}}
    for (let i = 0; i < modules.length; i++) {
      let name = modules[i][0];
      let collection = Object.entries(modules[i][1]);
      let value = "```css\n";
      for (let j = 0; j < collection.length; j++) {
        let [command, alias] = collection[j];
        if (!modules[i][1].hasOwnProperty(command)) continue;
        let line = command
          + " ".repeat(Math.max(1, 18 - command.length)) //spacer, 18 allows 2 across per embed
          + "[" + (alias && alias.length <= 5 ? alias : "" )
          //display aliases if aliases are shortcuts
          + "]"; //spacer
        value += line;
        if (i < modules.length - 1 || !(modules.length & 1)) { //if we're not on the last module or we have an even number of modules
          value += "\n";
          continue;
        };
        if (j === collection.length - 1) continue; //if we're not at the last one of the group continue
        value += !(j & 1) ? " ".repeat(Math.max(0, 28 - line.length)) + "\u200b" : "\n"; //spacer
      };
      value += "```";
      Embed.fielder(embed.fields, name.toProperCase(), value, true); //return arguments for field, - a field
    };
    this.Output.sender(embed);
  }

  static genObject (server) {
    let modules = {}; //we're creating a big object
    for(let cmdInfo of commands) { //for each cmdInfo
      if (!modules[cmdInfo.module]) modules[cmdInfo.module] = {}; //if the object doesn't have that module as a key already, create it. {module: {}}
      let aliases = Array.from(cmdInfo.aliases);
      let key = server.prefixes[cmdInfo.prefix] + aliases.shift(); //{module: {key: firstalias}}
      modules[cmdInfo.module][key] = aliases[0] ? aliases[0] : "";
    };
    return Object.keys(modules) //and return an object sorted alphabetically
      .sort()
      .reduce((acc, key) => ({ //comment this out if we come up with logical order
        ...acc, [key]: modules[key]
    }), {});
  }

}

module.exports = Commands;

String.prototype.toProperCase = function () {
  let words = this.split(/ +/g);
  let newArray = [];
  for (let i = 0; i < words.length; i++) {
    newArray[i] = words[i][0].toUpperCase() + words[i].slice(1, words[i].length).toLowerCase();
  };
  let newString = newArray.join(" ");
  return newString;
}