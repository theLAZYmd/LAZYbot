const config = require("../config.json");
const DBuser = require("../util/dbuser.js");

class Parse {

  constructor(message) { //everything extends to here
    this.message = message;
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
    return DBuser.getfromuser(this.user)
  }

  get dbindex () {
    return DBuser.getdbindex(this.dbuser)
  }

  get content () {
    let content = this.message.content ? this.message.content : (this.message.embeds[0] ? this.message.embeds[0].description : "");
    content = content && typeof content === "string" ? content.replace("’", "'").replace("…", "...").replace("“", "\"").replace("”", "\"").replace(/[\u200B-\u200D\uFEFF]/g, '') : content;
    return content || "";
  }

  get command () {
    if(this.bot) {
      if(this.message.embeds[0].author) return this.message.embeds[0].author.name;
    } else {
      let args = this.content.slice(this.prefix.length).match(/[^\s]+/gi);
      if(args) return args.shift().toLowerCase();
    };
    return "";
  }

  get prefix () {
    for(let prefix in this.server.prefixes) {
      if(this.content.startsWith(this.server.prefixes[prefix])) return this.server.prefixes[prefix];
    };
    return "";
  }

  get args () {
    let firstargs = this.content.slice(this.prefix.length).match(/[^\s]+/gi) || [];
    return !!this.prefix ? firstargs.slice(1) : firstargs;
  }

  get argument () {
    return this.args.join(" ");
  }
/*
  get member () {
    let user = this.Search.get(this.args[0]);
    return user ? this.Search.getMember(user) : this.message.member;
  }*/

  static command (message) {
    let cmdInfo = new Parse(message);
    return cmdInfo;
  }

  static RatingData(dbuser, source, rankingobject) {
    let sourceratings = source + "ratings";
    let sourcerankings = source + "rankings";
    let sourceratingData = rankingobject ? `**${rankingobject ? "Overall" : "Highest"}: ${dbuser[sourceratings].maxRating}**\n` : ""; //${rankingobject[sourcerankings]}`;
    for(let i = 0; i < config.variants[source].length; i++) {
      if(dbuser[source]) {
        let variant = config.variants[source][i];
        if(dbuser[sourceratings]) {
          let rating = dbuser[sourceratings][variant[1]];
          let ranking = "";
          if(rankingobject) ranking = rankingobject[sourcerankings][variant[1]]
          if(rating && !rankingobject || rating && !rating.toString().endsWith("?") && rankingobject) sourceratingData += `${variant[0]}: ${rating.toString().endsWith("?") ? "" : "**" }${rating}${rating.toString().endsWith("?") ? "" : "**" } ${ranking ? `(#` + ranking + `)` : ""}${i < config.variants[source].length -1 ? "\n" : ""}`;
        }
      };
    };
    return sourceratingData;
  }
  
  static Profiles(dbuser, source) {
    return `[${dbuser[source]}](${(config.url[source].profile.replace("|", dbuser[source]))})`;
  }

  static sourcefromTitle(sourceTitle) {
    for(let i = 0; i < config.sources.length; i++) {
      if(config.sources[i][0] === sourceTitle) return config.sources[i][1];
    };
    return;
  }

  static sourceTitle(source) {
    for(let i = 0; i < config.sources.length; i++) {
      if(config.sources[i][1] === source) return config.sources[i][0];
    };
    return;
  };

}

module.exports = Parse;