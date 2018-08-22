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
    let object = Commands.genObject(this.server); //get parsed command list of {module: {command: [aliases]}}
    for(let module in object) {
      Embed.fielder(embed.fields, ...Commands.genField(object, module)); //generate fields for outputting
    };
    this.Output.sender(embed);
  }

  static genObject (server) {
    let modules = {};
    for(let i = 0; i < commands.length; i++) {
      if(!modules[commands[i].module]) modules[commands[i].module] = [];
      let aliases = Array.from(commands[i].aliases);
      let key = server.prefixes[commands[i].prefix] + aliases.shift();
      modules[commands[i].module][key] = aliases;
    };
    return Object.keys(modules)
      .sort() //sort it alphabetically
      .reduce((acc, key) => ({ //comment this out if we come up with logical order
        ...acc, [key]: modules[key]
    }), {});
  }

  static genField (object, title) {
    let description = "```css\n"; //to get coloured text
    for(let command in object[title]) {
      if(command === "inArray" || command === "remove") continue; // some weird fucking bug
      description += command
        + " ".repeat(Math.max(1, 18 - command.length)) //spacer, 18 allows 2 across per embed
        + "[" + (object[title][command][0] && object[title][command][0].length <= 5 ? object[title][command][0] : "" )
        //display aliases if aliases are shortcuts
        + "]"; //spacer
      description += " ".repeat(Math.max(0, 24 - description.length)) //space out to prevent back and forth
        + "\u200b" //use non-width space NOTE: THIS DOESN'T ACTUALLY SEEM TO WORK
        + "\n"; //new line
    };
    description += "```";
    return [title, description, true]; //return arguments for field, - a field
  }

}

module.exports = Commands;