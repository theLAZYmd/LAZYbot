const config = require("../config.json");
const DataManager = require("../util/datamanager.js");
const Parse = require("../util/parse.js");
const Embed = require("../util/embed.js");

/*  
leaderboard get commands take 'page' and 'fromPaginator' as their sole argument.
leaderboard get commands set lots of information to Paginator upon first run through, so when Paginator sends it back, 'fromPaginator' is set to true.
If this is true therefore, the get command needs to return just the embed, rather than the large number of arguments.
*/

class Leaderboard extends Parse {

  constructor(message) {
    super(message);
  }

  getVariant () {
    let maxpages = this.buildVariant()
    //Constructor, method, maxpages, timeout on pages
    if(!isNaN(maxpages)) this.Output.paginator(this, "outputVariant", maxpages, 30000);
  }

  buildVariant () { //this function finds input parameters and returns an embed. Needs source, variant, and active.
    let source = config.sources[(this.channel.name === "bug" || this.channel.topic.includes("bug") || this.content.includes("bug")) ? "chesscom" : "lichess"]; //bug channel exception, default source is chess.com
    for(let _source in config.sources) {
      if(this.content.toLowerCase().replace(".", "").includes(_source.toLowerCase())) {
        source = config.sources[_source];
        break;
      }
    }; //find source requested in the message, if none found, assume lichess
    let active = this.content.includes("active") ? true : false; //active is just if the message contains the word
    let foundv = {}; //to find variant: new object with properties as the possibilites found from matching args, topic, and channel
    let usev; //to be the variant 'used'
    for(let variant in config.variants[source.key]) {
      let value = config.variants[source.key][variant];
      if(this.content.includes(variant)) foundv.args = value, usev = value; //if in args, match it.
      if(this.channel.topic && this.channel.topic.includes(variant)) foundv.channel = value, usev = value; //if in topic match it.
      if(this.channel.name.includes(variant)) foundv.channel = value, usev = value; //if in channel name, match it.
      if(foundv.channel) break;
    };
    if(foundv.args && foundv.channel && foundv.channel !== foundv.args) return this.Output.onError("Wrong channel!"); //if no possibilities or match conflict, return.
    if(!usev) return this.Output.onError("Couldn't find matching variant"); //if none found, return.
    console.log("New Variant Leaderboard: " + usev.key, source.key, active); //[zh, lichess, false]
    this.vlb = this.parseVariant(usev, source, active); //object, see below for format
    return Math.ceil(this.vlb.rankings.length / 10);
  }

  parseVariant(variant, source, active) {
    let tally = DataManager.getData();
    let leaderboard = {
      "variant": variant,
      "source": source,
      "active": active,
      "rankings": [] //sorted leaderboard listing
    };
    for(let i = 0; i < tally.length; i++) {
      let dbuser = tally[i];
      if(!active || (dbuser.lastmessagedate && Date.now() - dbuser.lastmessagedate < 604800000)) { //if lastmessage within a week
        if(dbuser[source.key] && !dbuser[source.key].cheating) { //find dbuser tracked from that source, not marked
          let username = dbuser[source.key]._main;
          if(!dbuser[source.key][username]) this.Output.onError("We have an error for user " + dbuser.username + ".");
          else if((dbuser[source.key][username][variant.key] && !dbuser[source.key][username][variant.key].endsWith("?")) || variant.key === "everyone") {
            let entry = {
              "tag": dbuser.username.slice(0, -5),
              "username": username,
              "id": dbuser.id,
              "rating": variant.key === "everyone" ? dbuser[source.key][username] : dbuser[source.key][username][variant.key]
            };
            leaderboard.rankings.push(entry);
          }
        }
      }
    };
    if(leaderboard.rankings.length === 0 || variant.key === "everyone") return leaderboard;
    leaderboard.rankings.sort(function(a, b) {
      return (parseInt(b.rating) - parseInt(a.rating));
    })
    return leaderboard;
  }

  outputVariant(page) {
    this.page = page && !isNaN(page) ? page : 0;
    let array = [];
    for(let i = 0; i < 10; i++) {
      if(this.vlb.rankings[i + 10 * page]) {
        let urltext = this.vlb.rankings[i + 10 * page].tag; //discord username
        let urllink = config.sources[this.vlb.source.key].url.profile.replace("|", this.vlb.rankings[i + 10 * page].username); //lichess.org/@/V2chess
        let rating = this.vlb.rankings[i + 10 * page].rating;
        array[i] = [];
        array[i][0] = "[" + urltext + "](" + urllink + ") " + rating;
      }
    };
    console.log(array);
    let lbembed = Embed.leaderboard(array, page); //Case 2 Leaderboard: 
    lbembed.title = `${this.Search.emojis.get(this.vlb.variant.key)} House Rankings on ${this.vlb.source.name} for${this.vlb.active ? "active ": " "}${this.vlb.variant.name} players`;
    return lbembed;
  }

  getVariantRank (member, args) {
    if(args.length === 1) member = this.Search.members.get(args[0]);
    let active = this.content.toLowerCase().includes("active");
    let rankingobject = {};
    let sources = Object.keys(config.sources).map(source => this.dbuser[source.key]); //applicable sources are those on the dbuser
    if(sources.length === 0) return this.Output.onError(`No linked accounts found.\nPlease link an account to your profile through \`!lichess\` or \`!chess.com\``);
    let leaderboard = Leaderboard.getforVariant({"key": "everyone"}, {"key": source}, active); //grab a leaderboard of all
    for(let i = 0; i < sources.length; i++) { //for each source which is applicable
      let variants = Object.keys(config.variants).map(variant => this.dbuser[sources[i]][username][variant] && !this.dbuser[sources[i]][username][variant].endsWith("?")); //applicable sources are those on the main account
      rankingObject[sources[i]] = {};
      for(let j = 0; j < variants.length; j++) {
        leaderboard.rankings.sort((a, b) => { //for each variant instance, sort the same leaderboard by variant rating
          return parseInt(b.rating[variants[j]]) - parseInt(a.rating[variants[jk]]);       
        });
        rankingObject[sources[i]][variants[j]] = 0;
        for(let k = 0; k < leaderboard.rankings.length; k++) {
          if(leaderboard.rankings[k].rating[variant[j]].endsWith("?")) continue; //skip over provisional ratings
          if(leaderboard.rankings[k].rating[variant[1]] === 0) break; //get rid of 0 ratings
          rankingObject[sources[i]][variants[j]]++;
          if(leaderboard.rankings[k].id === member.id) break; //end the count once you reach the desired user
        }
      }
    };
    console.log(rankingObject);
    //this.Output.onRank(this.member.user, rankingObject);
  }
    
}

module.exports = Leaderboard;

Array.prototype.remove = function(index) {
  if(!index && index !== 0) return;
  if(Array.isArray(index)) { //if the function is called by range.remove([0, 2, 1])
    index.sort(function(a, b) {
      return b - a;
    }); //sort the removal index into descending order, i.e. range.remove([2, 1, 0])
    for(let i = 0; i < index.length; i++) { //and for each index in that array
      this.splice(index[i], 1); //get rid of that element (get rid of 2, then 1, then 0)
    }
  } else
  if(typeof index === "number") {
    this.splice(index, 1); //otherwise if it's just a number, get rid of that number
  }
  return this;
}

Array.prototype.clean = function() {
  for(let i = 0; i < this.length; i++) {
    if(!this[i]) {
      this.splice(i, 1);
      i--;
    }
  }
  return this;
}