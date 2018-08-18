const config = require("../config.json");
const DBuser = require("../util/dbuser.js");

class Parse {

  constructor(message) { //everything extends to here
    this.message = message;
    this.message.content = this.message.content = this.message.content && typeof this.message.content === "string" ?
      this.message.content
        .replace("’", "'")
        .replace("…", "...")
        .replace("“", "\"")
        .replace("”", "\"")
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
      : this.message.content;
    this.client = this.message.client;
    this.author = this.message.author;
    this.bot = this.author.bot && message.embeds && message.embeds[0];
    this.guild = this.message.guild || this.client.guilds.get(config.houseid);
    this.channel = this.message.channel;
    this.server = this.guild ? require("../util/datamanager.js").getServer(this.guild) : "";
    this.member = this.guild ? this.message.member : "";
    this.reboot = this.client.reboot;
    this.httpboolean = this.client.httpboolean;
    this.Search = new (require("../util/search.js"))(this.message);
    this.Check = new (require("../util/check.js"))(this.message);
    this.Output = new (require("../util/output.js"))(message);
  }

  get user () {
    return this._member ? this._member.user : this.member.user;
  }

  get dbuser () {
    return DBuser.getUser(this.user)
  }

  get dbindex () {
    return DBuser.byIndex(this.dbuser)
  }

  get command () {
    if(this.bot) {
      if(this.message.embeds[0].author) return this.message.embeds[0].author.name;
    } else {
      let args = this.message.content.slice(this.prefix.length).match(/[^\s]+/gi);
      if(args) return args.shift().toLowerCase();
    };
    return "";
  }

  get prefix () {
    for(let prefix in this.server.prefixes) {
      if(this.message.content.startsWith(this.server.prefixes[prefix])) return this.server.prefixes[prefix];
    };
    return "";
  }

  get args () {
    let firstargs = this.message.content.slice(this.prefix.length).match(/[^\s]+/gi) || [];
    return !!this.prefix ? firstargs.slice(1) : firstargs;
  }

  get argument () {
    return this.args.join(" ");
  }
/*
  get member () {
    let member = this.Search.members.get(this.args[0]) ;
    return member ? member : this.message.member;
  }*/

  static command (message) {
    let cmdInfo = new Parse(message);
    return cmdInfo;
  }
  
}

module.exports = Parse;