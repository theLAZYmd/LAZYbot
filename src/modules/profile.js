const config = require("../config.json");
const Parse = require("../util/parse.js");
const Embed = require("../util/embed.js");

class Profile extends Parse {

  constructor(message) {
    super(message);
  }
  
  get () {
    if(this.args.length === 1) { //!profile titsinablender
      let user = this.Search.get(this.args[0]);
      if(user) this.member = this.Search.getMember(user);
      else return this.Output.onError(`Couldn't find user!`);
    };
    //Constructor, method, embed, maxpages, timeout on pages
    this.Output.paginator(this, "build", this.sourcecount > 0 ? 2 : 1, 30000);
  }

  build (page) {
    if(!isNaN(page)) this.page = page;
    return Embed.receiver(this);
  }

  get title () {
    let title = 
      (this.user.bot ? this.Search.getEmoji("bot") + " " : "") +
      (this.dbuser.patron ? this.Search.getEmoji("patron") : "") +
      "Profile for " +
      (this.dbuser.title ? this.Search.getEmoji(this.dbuser.title.toLowerCase()) + " " : "") + 
      this.user.tag;
    return title;
  }

  get color () {
    return this.member.displayColor;
  }

  get thumbnail () {
    return Embed.thumbnail(this.user.avatarURL ? this.user.avatarURL : "https://i.imgur.com/EncsMs8.png");
  }

  get description () {
    let string =
      (this.dbuser.finger ? "```" + this.dbuser.finger + "```" : "") +
      (this.dbuser.modnotes ? "```diff\n-mod notes\n" + this.dbuser.modnotes + "```" : "");
    return string;
  }

  get fields () {
    let fields = [];
    let potential = this.PotentialFields;
    for(let i = 0; i < potential.length; i++) {
      if(!!potential[i][1]) fields = Embed.fielder(fields, ...potential[i]);
    }
    return fields;
  }

  get PotentialFields () {
    if(this.page === 0) {
      return [
        ["a.k.a.", this.aliases, false],
        [(this.dbuser.modverified ? " " + this.Search.getEmoji(this.dbuser.modverified[0]) : "") + "Info", this.info, true],
        ["Joined Date", this.joined, this.info ? true: false],
        ["Index", this.ids, this.dbuser.messages ? true : false],
        ["Messages Sent", this.dbuser.messages.toLocaleString(), true],
        ["Last Message", this.lastMessage, false],
      //["Roles", this.roles],
        ["House Trophies", this.award, true]
      ]
    } else
    if(this.page === 1) {
      let PotentialFields = [];
      for(let i = 0; i < config.sources.length; i++) {
        let source = config.sources[i][1];
        if(this.dbuser[source]) {
          let entry = [
            `${this.Search.getEmoji(source)} ${config.sources[i][0]}`,
            `${Parse.Profiles(this.dbuser, source)}\n${Parse.RatingData(this.dbuser, source)}`,
            true
          ];
          if(!PotentialFields[0]) PotentialFields[0] = entry;
          else PotentialFields.push(entry);
        };
      };
      return PotentialFields;
    }
    else return [];
  }

  get sourcecount () {
    let sourcecount = 0;
    for(let i = 0; i < config.sources.length; i++) {
      let source = config.sources[i][1];
      if(this.dbuser[source]) sourcecount++;
    };
    return sourcecount;
  }

  get footer () {
    if(this.page === 0) {
      return Embed.footer("Use !finger to change your finger message.");
    }
  }

  get aliases () {
    let specifiers = [this.member.nickname, this.dbuser.name, this.dbuser.lichess, this.dbuser.chesscom, this.dbuser.bughousetest];
    let found = [this.user.username];
    for(let i = 0; i < specifiers.length; i++) {
      if(specifiers[i] && !found.inArray(specifiers[i])) found.push(specifiers[i]);
    };
    return Embed.getFields(found.slice(1), "", true);
    //no constant, bolded
  }

  get info () {
    let region = "None set.";//default region sign if none found, measure of number of sources
    for(let i = 0; i < this.server.regions.length; i++) {
      let role = this.Search.getRole(this.server.regions[i]);
      if(this.Check.role(this.member, role.name)) region = this.server.regions[i];
    };
    return Embed.getFields([
      ["Age: ", this.dbuser.age],
      ["Sex: ", this.dbuser.sex ? (this.Search.getEmoji(this.dbuser.sex) ? this.Search.getEmoji(this.dbuser.sex) : this.dbuser.sex) : ""],
      //check if emoji exists, otherwise just display text
      ["Location: ", this.dbuser.location],
      ["Region: ", region]
    ])
    //4 fields stringified, "Key: value" format, no 'constant'
  }

  get joined () {
    return Embed.getFields([
      ["Discord: ", Date.getISOtime(this.user.createdTimestamp).slice(4, 15)],
      [`${this.guild.name}: `, Date.getISOtime(this.member.joinedTimestamp).slice(4, 15)]
    ])
    //2 fields stringified, "Key; value" format, no 'constant'
  }

  get ids () {
    return Embed.getFields([
      ["UID: ", "`" + this.user.id + "`", false],
      ["Position in Database: ", this.dbindex]
    ])
    //2 fields stringified, "Key; value" format, no 'constant'
  }

  get lastMessage () {
    if(!this.dbuser.lastmessage) return "";
    let string =
      (this.dbuser.lastmessagedate ? `\nSent at ${Date.getISOtime(this.dbuser.lastmessagedate)}.` : "") +
      (this.dbuser.lastmessage.startsWith("<:") && this.dbuser.lastmessage.endsWith (">") ?
        "\n" + this.dbuser.lastmessage :
        "\`\`\`" + this.dbuser.lastmessage + "\`\`\`"
      );
    return string;
  }

  get roles () {
    let rolelist = this.Search.getmemberRoles(this.member).splice(0, 1);
    return rolelist ? Embed.getFields(rolelist) : ""; //in case we want to display roles in the future.
  }

  get award () {
    let string =
      (this.medal ? this.medal : "") +
      (this.trophies && this.medal ? `\n` : "") +
      (this.trophies ? this.trophies : "");
    return string;
  }

  get medal () {
    let metal = "";
    if(this.dbindex === 1) medal = ":first_place: **First in Database.**";
    if(this.dbindex === 2) medal = ":second_place: **Second in Database.**";
    if(this.dbindex === 3) medal = ":third_place: **Third in Database.**";
    return metal;
  }

  get trophies () {
    return (this.dbuser.trophy ? Embed.getFields(this.dbuser.trophy, ":trophy: ", true) : "");
  }

  get modnotes () {
    return (this.dbuser.modnotes ? Embed.getFields(this.dbuser.modnotes, "") : "");
  }

}

module.exports = Profile;

Date.gettime = function(ms) {
  let time = new Date(ms);
  time.hours = time.getUTCHours();
  time.minutes = time.getUTCMinutes();
  time.seconds = time.getUTCSeconds();
  time.milliseconds = time.getUTCMilliseconds();
  time.days = Math.floor(time.hours/24);
  time.hours = time.hours - (24 * time.days);
  return time;
};

Date.getISOtime = function(ms) {
  return Date.gettime(ms).toString().slice(0, 31); 
};

Array.prototype.inArray = function(string) { 
  for(let i = 0; i < this.length; i++) { 
      if(string.toLowerCase().replace(/[.,#!$%\^&;:{}<>=-_`\"~()]/g,"").trim() === this[i].toLowerCase().replace(/[.,#!$%\^&;:{}<>=-_`\"~()]/g,"").trim()) return true; 
  }
  return false;
}