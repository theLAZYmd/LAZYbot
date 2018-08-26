const config = require("../config.json");
const Parse = require("../util/parse.js");
const Embed = require("../util/embed.js");
const Render = require("../util/render.js");

class Profile extends Parse {

  constructor(message) {
    super(message);
    this._dbuser = Object.assign({}, this.dbuser);
  }

  get() {
    if (this.args.length === 1) { //!profile titsinablender
      let user = this.Search.users.get(this.args[0]);
      if (user) this.member = this.Search.members.get(user);
      else return this.Output.onError(`Couldn't find user!`);
    };
    let embedgroup = [];
    for (let i = 0; i < (1 + Math.ceil(this.chessFields.length / 4)); i++) {
      embedgroup.push(this.build(i));
    };
    this.Paginator.sender(embedgroup, 30000);
  }

  build(page) {
    this.page = page;
    let embed = {};
    let properties = ["title", "color", "thumbnail", "description", "fields"];
    for (let property of properties)
      embed[property] = this[property];
    return Embed.receiver(embed);
  }

  get title() {
    let chessTitle;
    for (let source in config.sources)
      if (this._dbuser[source] && this._dbuser[source]._title) chessTitle = this._dbuser[source]._title;
    let title =
      this.flair.join(" ") + " " +
      "Profile for " +
      (chessTitle ? this.Search.emojis.get(chessTitle.toLowerCase()) + " " : "") +
      this.user.tag;
    return title;
  }

  get flair () {
    let flair = [];
    let conditions = {
      "bot": this.user.bot,
      "patron": this._dbuser.patron
    };
    for (let [key, value] of Object.entries(conditions))
      if (value) flair.push(this.Search.emojis.get(key));
    return flair;
  }

  get color() {
    return this.member.displayColor;
  }

  get thumbnail() {
    return Embed.thumbnail(this.user.avatarURL ? this.user.avatarURL : "https://i.imgur.com/EncsMs8.png");
  }

  get description() {
    let string = "";
    if (this._dbuser.finger) string += "```" + this._dbuser.finger + "```";
    if (this._dbuser.modnotes) string += "```diff\n-mod notes\n" + this._dbuser.modnotes + "```";
    return string;
  }

  get fields() {
    let fields = [];
    let potential = this.PotentialFields;
    for (let field of potential)
      if (field[1]) fields = Embed.fielder(fields, ...field);
    return fields;
  }

  get PotentialFields() {
    if (this.page === 0) {
      return [
        ["a.k.a.", this.aliases, false],
        [(this._dbuser.modverified ? " " + this.Search.emojis.get(this._dbuser.modverified[0]) : "") + "Info", this.info, true],
        ["Joined Date", this.joined, this.info ? true : false],
        ["Index", this.ids, this._dbuser.messages ? true : false],
        ["Messages Sent", this._dbuser.messages.count.toLocaleString(), true],
        ["Last Message", this.lastMessage, false],
        //["Roles", this.roles],
        ["House Trophies", this.award, true]
      ]
    } else return this.chessFields.splice(4 * (this.page - 1), 4); //if page === 1, 1, 2, 3, 4; if page = 2, 5, 6, 7, 8
  }

  get chessFields() {
    let accounts = [];
    for (let [key, source] of Object.entries(config.sources)) {
      for (let account in source) {
        if (!account.startsWith("_")) {
          accounts.push([
            this.Search.emojis.get(key) + " " + config.sources[key].name,
            Render.profile(this._dbuser, key, account) + "\n" + Render.ratingData(this._dbuser, key, account),
            true
          ])
        }
      }
    };
    return accounts;
  }

  get sourcecount() {
    let sourcecount = 0;
    for (let i = 0; i < config.sources.length; i++) {
      let source = config.sources[i][1];
      if (this._dbuser[source]) sourcecount++;
    };
    return sourcecount;
  }

  get footer() {
    if (this.page === 0) {
      return Embed.footer("Use !finger to change your finger message.");
    }
  }

  get aliases() {
    let specifiers = [this.member.nickname, this._dbuser.name]
    if (this._dbuser.lichess) specifiers.concat(Object.keys(this._dbuser.lichess).map(account => !account.startsWith("_")));
    if (this._dbuser.chesscom) specifiers.concat(Object.keys(this._dbuser.chesscom).map(account => !account.startsWith("_")));
    if (this._dbuser.bughousetest) specifiers.concat(Object.keys(this._dbuser.bughousetest).map(account => !account.startsWith("_")));
    let found = [this.user.username];
    for (let i = 0; i < specifiers.length; i++) {
      if (specifiers[i] && !found.inArray(specifiers[i])) found.push(specifiers[i]);
    };
    return Embed.getFields(found.slice(1), "", true);
    //no constant, bolded
  }

  get info() {
    let region = "None set."; //default region sign if none found, measure of number of sources
    for (let i = 0; i < this.server.regions.length; i++) {
      let role = this.Search.roles.get(this.server.regions[i]);
      if (this.Check.role(this.member, role.name)) region = this.server.regions[i];
    };
    return Embed.getFields([
      ["Age", this._dbuser.age],
      ["Sex", this._dbuser.sex ? (this.Search.emojis.get(this._dbuser.sex) ? this.Search.emojis.get(this._dbuser.sex) : this._dbuser.sex) : ""],
      //check if emoji exists, otherwise just display text
      ["Location", this._dbuser.location],
      ["Region", region]
    ], {
      "bold": true
    })
    //4 fields stringified, "Key: value" format, no 'constant'
  }

  get joined() {
    return Embed.getFields([
      ["Discord", Date.getISOtime(this.user.createdTimestamp).slice(4, 15)],
      [this.guild.name, Date.getISOtime(this.member.joinedTimestamp).slice(4, 15)]
    ], {
      "bold": true
    })
    //2 fields stringified, "Key; value" format, no 'constant'
  }

  get ids() {
    return Embed.getFields([
      ["UID", "`" + this.user.id + "`", false],
      ["Position in Database", this.dbindex]
    ], {
      "bold": true
    })
    //2 fields stringified, "Key; value" format, no 'constant'
  }

  get lastMessage() {
    if (!this._dbuser.lastmessage) return "";
    let string =
      (this._dbuser.lastmessagedate ? `\nSent at ${Date.getISOtime(this._dbuser.lastmessagedate)}.` : "") +
      (this._dbuser.lastmessage.startsWith("<:") && this._dbuser.lastmessage.endsWith(">") ?
        "\n" + this._dbuser.lastmessage :
        "\`\`\`" + this._dbuser.lastmessage + "\`\`\`"
      );
    return string;
  }

  get roles() {
    let rolelist = this.Search.members.get(this.member).splice(0, 1);
    return rolelist ? Embed.getFields(rolelist) : ""; //in case we want to display roles in the future.
  }

  get award() {
    let string =
      (this.medal ? this.medal : "") +
      (this.trophies && this.medal ? `\n` : "") +
      (this.trophies ? this.trophies : "");
    return string;
  }

  get medal() {
    let metal = "";
    if (this.dbindex === 1) medal = ":first_place: **First in Database.**";
    if (this.dbindex === 2) medal = ":second_place: **Second in Database.**";
    if (this.dbindex === 3) medal = ":third_place: **Third in Database.**";
    return metal;
  }

  get trophies() {
    return (this._dbuser.trophy ? Embed.getFields(this._dbuser.trophy, {
      "constant": ":trophy: ",
      "bold": true
    }) : "");
  }

  get modnotes() {
    return (this._dbuser.modnotes ? Embed.getFields(this._dbuser.modnotes, "") : "");
  }

}

module.exports = Profile;

Date.gettime = function (ms) {
  let time = new Date(ms);
  time.hours = time.getUTCHours();
  time.minutes = time.getUTCMinutes();
  time.seconds = time.getUTCSeconds();
  time.milliseconds = time.getUTCMilliseconds();
  time.days = Math.floor(time.hours / 24);
  time.hours = time.hours - (24 * time.days);
  return time;
};

Date.getISOtime = function (ms) {
  return Date.gettime(ms).toString().slice(0, 31);
};

Array.prototype.inArray = function (string) {
  for (let i = 0; i < this.length; i++) {
    if (string.toLowerCase().replace(/[.,#!$%\^&;:{}<>=-_`\"~()]/g, "").trim() === this[i].toLowerCase().replace(/[.,#!$%\^&;:{}<>=-_`\"~()]/g, "").trim()) return true;
  }
  return false;
}