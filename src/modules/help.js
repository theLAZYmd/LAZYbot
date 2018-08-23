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
        if(commands[i].aliases[j].toLowerCase() === args[0].toLowerCase() || this.server.prefixes[commands[i].prefix] + commands[i].aliases[j].toLowerCase() === args[0].toLowerCase()) {
          this.cmdInfo = commands[i];
          break;
        }
      }
    };
    if(!this.cmdInfo) return this.Output.onError("Couldn't find that command. Please verify that that command exists.\nNote: some commands get removed for stability issues.");
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

  get prefix () {
    return this.server.prefixes[this.cmdInfo.prefix];
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
    return "`" + this.prefix + this.cmdInfo.usage.join("`\n`" + this.prefix) + "`";
  }
}

module.exports = Help;