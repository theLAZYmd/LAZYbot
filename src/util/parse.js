const config = require("../config.json");
const DBuser = require("./dbuser.js");
const DataManager = require("./datamanager.js");

class Parse {

  constructor(message) { //everything extends to here
    this.message = message;
    this.client = message ? message.client : this.Bot.client;
    this.guild = message ? message.guild : this.client.guilds.get(config.houseid);
    if (!message) return;
    this.message.content = message && message.content && typeof message.content === "string" ?
      message.content
        .replace("’", "'")
        .replace("…", "...")
        .replace("“", "\"")
        .replace("”", "\"")
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
      : "";
    this.author = message.author;
    this.channel = message.channel;
    this.server = this.guild ? DataManager.getServer(this.guild.id) : "";
    this.reactionmessages = this.guild ? DataManager.getServer(this.guild.id, "./src/data/reactionmessages.json") : "";
    this.member = this.guild ? message.member : "";
  }

  get Bot () {
    if (!this._Bot) {
      this._Bot = require("../lazybot.js");
    }
    return this._Bot;
  }

  get Output () {
    if (!this._Output) {
      let OutputConstructor = require("./output.js");
      this._Output = new OutputConstructor(this.message);
    };
    return this._Output;
  }

  get Permissions () {
    if (!this._Permissions) {
      let PermissionsConstructor = require("./permissions.js");
      this._Permissions = new PermissionsConstructor(this.message);
    };
    return this._Permissions;
  }

  get Paginator () {
    if (!this._Paginator) {
      let PaginatorConstructor = require("../modules/paginator");
      this._Paginator = new PaginatorConstructor(this.message);
    };
    return this._Paginator;
  }

  get Search () {
    if (!this._Search) {
      let SearchConstructor = require("./search.js");
      this._Search = new SearchConstructor(this.message);
    };
    return this._Search;
  }

  get Check () {
    if (!this._Check) {
      let CheckConstructor = require("./check.js");
      return new CheckConstructor(this.message);
    };
    return this._Check;
  }

  get user () {  
    if (!this.member) return "";
    return this.member.user;
  }

  get dbuser () {
    if (!this.user) return "";
    return DBuser.getUser(this.user);
    //if (!this._dbuser) this._dbuser = DBuser.getUser(this.user);
    //return this._dbuser;
  }

  get dbindex () {
    if (!this.dbuser) return "";
    return DBuser.byIndex(this.dbuser);
    //if (!this._dbindex) this._dbindex = this.dbuser ? DBuser.byIndex(this.dbuser) : "";
    //return this._dbindex;
  }

  get command () {
    if (!this._command) {
      if (!this.message) return "";
      if (this.author ? this.author.bot && this.message.embeds && this.message.embeds[0] : false) {
        if(this.message.embeds[0].author) this._command = this.message.embeds[0].author.name;
      } else {
        let args = this.message.content.slice(this.prefix.length).match(/[^\s]+/gi);
        if(args) this._command = args.shift().toLowerCase();
      };
    };
    return this._command || "";
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

  static command (message) {
    let cmdInfo = new Parse(message);
    return cmdInfo;
  }
  
}

Parse.client = "";

module.exports = Parse;