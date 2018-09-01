const config = require("../config.json");
const DBuser = require("./dbuser.js");
const DataManager = require("./datamanager.js");
const Embed = require("./embed.js");
const Aliases = DataManager.getFile("./src/data/aliases.json");
const Permissions = require("./permissions.js");

class Parse {

  constructor(message) { //everything extends to here
    this.message = message;
    this.member = message ? message.member : "";
    this.client = message ? message.client : this.Bot.client;
    this.guild = this.member ? this.member.guild : this.client.guilds.get(config.houseid);
    this.aliases = this.guild ? Aliases._all.concat(Aliases[this.guild.id] || []) : Aliases.all;
    if (!message) return;
    this.message.content = message && message.content && typeof message.content === "string" ?
      message.content
      .replace("’", "'")
      .replace("…", "...")
      .replace("“", "\"")
      .replace("”", "\"")
      .replace(/[\u200B-\u200D\uFEFF]/g, '') :
      "";
    this.author = message.author;
    this.channel = message.channel;
    this.server = this.guild ? DataManager.getServer(this.guild.id) : "";
    if (this.message.content && this.server) {
      for (let [key, alias] of this.aliases)
        if (this.message.content.toLowerCase().includes(key.toLowerCase()))
          this.message.content = this.message.content.replace(key, alias.replace(/\${([a-z]+)}/gi, value => this.server.prefixes[value.match(/[a-z]+/i)]))
    };
    this.reactionmessages = this.guild ? DataManager.getServer(this.guild.id, "./src/data/reactionmessages.json") : "";
  }

  get Bot() {
    if (!this._Bot) {
      this._Bot = require("../lazybot.js");
    }
    return this._Bot;
  }

  get Output() {
    if (!this._Output) {
      let OutputConstructor = require("./output.js");
      this._Output = new OutputConstructor(this.message);
    };
    return this._Output;
  }

  get Permissions() {
    if (!this._Permissions) this._Permissions = Permissions;
    return this._Permissions;
  }

  get Paginator() {
    if (!this._Paginator) {
      let PaginatorConstructor = require("../modules/paginator");
      this._Paginator = new PaginatorConstructor(this.message);
    };
    return this._Paginator;
  }

  get Search() {
    if (!this._Search) {
      let SearchConstructor = require("./search.js");
      this._Search = new SearchConstructor(this.message);
    };
    return this._Search;
  }

  get Check() {
    if (!this._Check) {
      let CheckConstructor = require("./check.js");
      return new CheckConstructor(this.message);
    };
    return this._Check;
  }

  get user() {
    this._user = this.member ? this.member.user : "";
    return this._user;
  }

  set user(value) {
    this._user = value;
  }

  get dbuser() {
    if (!this.user) return "";
    return DBuser.getUser(this.user);
  }

  get dbindex() {
    if (!this.dbuser) return "";
    return DBuser.byIndex(this.dbuser);
    //if (!this._dbindex) this._dbindex = this.dbuser ? DBuser.byIndex(this.dbuser) : "";
    //return this._dbindex;
  }

  get command() {
    if (!this._command) {
      if (!this.message) return "";
      if (this.author ? this.author.bot && this.message.embeds && this.message.embeds[0] : false) {
        if (this.message.embeds[0].author) this._command = this.message.embeds[0].author.name;
      } else {
        let args = this.message.content.slice(this.prefix.length).match(/[^\s]+/gi);
        if (args) this._command = args.shift().toLowerCase();
      };
    };
    return this._command || "";
  }

  get prefix() {
    if (!this._prefix) {
      for (let prefix of Object.values(this.server.prefixes))
        if (this.message.content.startsWith(prefix)) {
          this._prefix = prefix;
          continue;
        }
    }
    return this._prefix || "";
  }

  get args() {
    let firstargs = this.message.content.slice(this.prefix.length).match(/[^\s]+/gi) || [];
    return this.prefix ? firstargs.slice(1) : firstargs;
  }

  get argument() {
    return this.args.join(" ");
  }

  static command(message) {
    let cmdInfo = new Parse(message);
    return cmdInfo;
  }

  static ratingData(dbuser, source, username) {
    try {
      let account = dbuser[source.key][username];
      if (!account) throw "No account found for that username!";
      let rating = [];
      for (let [key, variant] of Object.entries(config.variants[source.key]))
        if (account[key]) rating.push([variant.name, (account[key].endsWith("?") ? "" : "**") + account[key] + (account[key].endsWith("?") ? "" : "**")]);
      return Embed.getFields(rating);
    } catch (e) {
      if (e) throw e;
    }
  }

  static profile(dbuser, source, username) {
    return `[${username}](${(config.sources[source.key].url.profile.replace("|", username))})`;
  }

}

Parse.client = "";

module.exports = Parse;