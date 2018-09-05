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
    this.client = message ? message.client : LAZYbot.client;
    this.cmdAliases = this.guild ? Aliases._all.concat(Aliases[this.guild.id] || []) : Aliases.all;
    if (typeof this.message === "object") this.message.content = message && message.content && typeof message.content === "string" ?
      message.content
      .replace("’", "'")
      .replace("…", "...")
      .replace("“", "\"")
      .replace("”", "\"")
      .replace(/[\u200B-\u200D\uFEFF]/g, '') :
      "";
    if (this.message) this.author = message.author;
    if (this.message) this.channel = message.channel;
    if (this.message && this.message.content && this.server) {
      for (let [key, alias] of this.cmdAliases)
        if (this.message.content.toLowerCase().includes(key.toLowerCase()))
          this.message.content = this.message.content.replace(key, alias.replace(/\${([a-z]+)}/gi, value => this.server.prefixes[value.match(/[a-z]+/i)]))
    };
  }

  //DATA

  get server () {
    if (!this._server) {
      if (this.guild) this._server = DataManager.getServer(this.guild.id);
    };
    return this._server || "";
  }

  get reactionmessages() {
    if (!this._reactionmessages) {
      if (this.guild) this._reactionmessages = DataManager.getServer(this.guild.id, "./src/data/reactionmessages.json");
    };
    return this._reactionmessages || "";
  }

  //Methods

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
    let SearchConstructor = require("./search.js");
    return new SearchConstructor(this.message);
  }

  get Check() {
    if (!this._Check) {
      let CheckConstructor = require("./check.js");
      return new CheckConstructor(this.message);
    };
    return this._Check;
  }

  get guild() {
    if (this._guild) return this._guild;
    if (!this._guild && this.member) this._guild = this.member.guild;
    if (!this._guild && this.message) this._guild = this.message.guild || this.message._guild;
    return this._guild || "";
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
      let prefixes = this.server ? this.server.prefixes : {
        "generic": "!",
        "nadeko": "."
      };
      for (let prefix of Object.values(prefixes))
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

module.exports = Parse;