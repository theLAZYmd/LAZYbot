const Parse = require("../util/parse.js");
const Embed = require("../util/embed.js");
const DataManager = require("../util/datamanager.js");
const commands = DataManager.getFile("./src/data/commands.json");

class Help extends Parse {
  constructor(message) {
    super(message);
  }

  run(args) {
    for(let i = 0; i < commands.length; i++) {
      for(let j = 0; j < commands[i].aliases.length; j++) {
        if(commands[i].aliases[j].toLowerCase().startsWith(args[0].toLowerCase().replace(/[^a-z]+/g, ""))) {
          this.cmdInfo = commands[i];
          break;
        }
      }
    };
    if(!this.cmdInfo) return this.Output.onError("Couldn't find that command. Please verify that that command exists.\nNote: some commands get removed for stability issues.")
    this.Output.sender(this);
  }

  get color () {
    return 11126483
  }

  get title () {
    return "`" + this.prefix + this.cmdInfo.aliases.join("`**/**`" + this.prefix) + "`";
  }

  get description () {
    return this.cmdInfo.description
      .replace(/\${([a-z]+)}/gi, value => this.server.prefixes[value.match(/[a-z]+/i)])
      //.replace(/\${generic}/gi, this.server.prefixes.generic)
      //.replace(/\${nadeko}/gi, this.server.prefixes.nadeko);
  }

  get fields () {
    let fields = [];
    fields = Embed.fielder(fields,
      "Usage",
      this.usage,
      false
    );
    return fields;
  }

  get footer () {
    return Embed.footer("Module: " + this.cmdInfo.module);
  }

  get usage () {
    let string = "";
    for(let i = 0; i < this.cmdInfo.usage.length; i++) {
      string += "`" + this.prefix + this.cmdInfo.usage[i] + (i < this.cmdInfo.usage.length -1 ? "` or\n" : "`");
    };
    return string;
  }
}

module.exports = Help;