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

  get _args () {
    return this.args;
  }

  getDatabase (page, fromPaginator) {
    let tally = DataManager.getData();
    let array = [];
    for(let i = 1; i < 10; i++) {
      let medal = "";
      if(i === 1) medal = " :first_place:";
      if(i === 2) medal = " :second_place:";
      if(i === 3) medal = " :third_place:";
      array[i - 1] = [];
      array[i - 1][0] = `${tally[i].username}`;
      array[i - 1][1] = (tally[i].bidamount ? tally[i].bidamount : 0) + " :cherry_blossom:" + medal;
    }; //generate standard double array used for Embed.leaderboard()
    let embed = Embed.leaderboard(array, page);
    embed.title = `${this.Search.emojis.get("thehouse")} House Database Positions`;
    embed.footer = Embed.footer(`... dbpositions to see how this all works. ${tally.length - 1} positions available.`);
    if(fromPaginator) return embed; //Constructor, method, embed, maxpages, timeout on pages
    else this.Output.paginator(this, "getDatabase", embed, Math.ceil((tally.length - 1) / 9), 30000);
  }

  getTrivia (page) {
    let arrdatasort = [];
    let _tally = DataManager.getData();
    _tally.sort(function compare(a, b) {
      return (b.triviarating || 1500) - (a.triviarating || 1500);
    });
    for(let i = 0; i < tally.length; i++) {
      if(!tally[i].triviagames || tally[i].triviagames === 0) {
        _tally.remove(i)
      }
    }
    let embed = {
      title: "Trivia Leaderboard",
      color: 53380
    };
    if(args.length === 0) {
      for(let i = 0; i < arrdatasort.length; i++) {
        if(!arrdatasort[i].triviaprovisional) {
          continue;
        } else {
          x++;
          embed.description += `#${i} **${arrdatasort[i].username}** ${arrdatasort[i].triviarating || 1500} ${x < 10 ? "\n" : ""}`
        }
        if(i === 10) break;
      };
    } else
    if(args[0] === 'provisional' || args[0] === 'prov') {
      for(let i = 0; i < arrdatasort.length; i++){
        embed.description += `#${i} **${arrdatasort[i].username}** ${arrdatasort[i].triviarating || 1500}${!arrdatasort[i].triviaprovisional ? "?" : ""} ${x < 10 ? "\n" : ""}`;
        if(i === 10) break;
      }
    };
    Embed.sender(embed);
  }

  getTriviaRank () {
    this.member = this.args.length === 1 ? this.Search.members.get(this.Search.users.get(this.args[0])) : this.member; 
    Embed.sender({
      title: "Trivia Rating",
      description: `**${this.dbuser.username}** ${this.dbuser.triviarating}${this.dbuser.triviaprovisional ? "" : "?"}`
    });
  }

  getVariantRank () {
    let member = this.args.length === 1 ? this.Search.members.get(this.Search.users.get(this.args[0])) : this.member;
    let rankingobject = {};
    let sourceboolean = false;
    for(let i = 0; i < config.sources.length; i++) { //for every source
      let source = config.sources[i]; //source object
      if(this.dbuser[source[1]]) { //if the user is being tracked on the source
        sourceboolean = true; //confirm this is a valid request
        let sourcevariants = source[1] + "variants";
        let sourcerankings =  source[1] + "rankings";
        let leaderboard = Leaderboard.getforVariant("everyone", source[1], false); //grab a leaderboard of all
        for(let j = 0; j < config[sourcevariants].length; j++) {
          let variant = config[sourcevariants][j];
          for(let k = 0; k < leaderboard.rankings.length; k++) {
            if(!leaderboard.rankings[k].rating[variant[1]] || leaderboard.rankings[k].rating[variant[1]].endsWith("?")) { //set provisional, nonexistant to 0
              leaderboard.rankings[k].rating[variant[1]] = 0;
            };
          };
          leaderboard.rankings.sort(function(a, b) { //for each variant instance, sort by variant rating
            return parseInt(b.rating[variant[1]]) - parseInt(a.rating[variant[1]]);       
          });
          let matchboolean = false;
          for(let k = 0; k < leaderboard.rankings.length; k++) {
            if(leaderboard.rankings[k].rating[variant[1]] === 0) break; //get rid of 0 ratings
            if(leaderboard.rankings[k].userid === member.id) { //return array index for matching ids
              if(!rankingobject[sourcerankings]) rankingobject[sourcerankings] = {}; //create a new object for that source/variant
              rankingobject[sourcerankings][variant[1]] = k + 1; //set the ranking to ordinal numbers (iteration + 1)
              matchboolean = true;
              break;
            }
          }
        }
      };
    };
    if(sourceboolean) this.Output.onRatingUpdate(this.member.user, rankingobject);
    else this.Output.onError(`No linked accounts found.\nPlease link an account to your profile through \`!lichess\` or \`!chess.com\``);
  }

  getVariant () {
    let maxpages = this.buildVariant()
    //Constructor, method, maxpages, timeout on pages
    if(!isNaN(maxpages)) this.Output.paginator(this, "outputVariant", maxpages, 30000);
  }

  buildVariant () { //this function finds input parameters and returns an embed. Needs source, variant, and active.
    let source = config.sources[this.channel.name === "bug" || this.channel.topic.includes("bug") || this.content.includes("bug")? 1 : 0]; //bug channel exception, default source is chess.com
    for(let i = 0; i < config.sources.length; i++) {
      for(let j = 0; j < config.sources[i].length; j++) {
        if(this.content.toLowerCase().includes(config.sources[i][j].toLowerCase())) {
          source = config.sources[i];
          break;
        }
      }
    }; //find source requested in the message, if none found, assume lichess
    let active = this.content.includes("active") ? true : false; //active is just if the message contains the word
    let foundv = {}; //to find variant: new object with properties as the possibilites found from matching args, topic, and channel
    let usev; //to be the variant 'used'
    for(let i = 0; i < config.variants[source[1]].length; i++) {
      let variant = config.variants[source[1]][i];
      if(this.content.includes(variant[1])) foundv.args = variant, usev = variant; //if in args, match it.
      if(this.channel.topic && this.channel.topic.includes(variant[1])) foundv.channel = variant, usev = variant; //if in topic match it.
      if(this.channel.name === variant[3]) foundv.channel = variant, usev = variant; //if in channel name, match it.
      if(foundv.channel) break;
    };
    if(foundv.args && foundv.channel && foundv.channel !== foundv.args) return this.Output.onError("Wrong channel!"); //if no possibilities or match conflict, return.
    if(!usev) return this.Output.onError("Couldn't find matching variant"); //if none found, return.
    console.log("New Variant Leaderboard: " + usev[1], source[1], active); //[zh, lichess, false]
    this.vlb = this.parseVariant(usev, source, active); //object, see below for format
    return Math.ceil(this.vlb.rankings.length / 10);
  }

  parseVariant(_variant, _source, active) {
    let source = _source[1];
    let variant = _variant[1]
    let tally = DataManager.getData();
    let sourceratings = source + "ratings";
    let leaderboard = {
      "variant": _variant,
      "source": _source,
      "active": active,
      "rankings": [] //sorted leaderboard listing
    };
    for(let i = 0; i < tally.length; i++) {
      let dbuser = tally[i];
      if(!active || (dbuser.lastmessagedate && Date.now() - dbuser.lastmessagedate < 604800000)) { //if lastmessage within a week
        if(dbuser[source] && dbuser[sourceratings] && !dbuser[sourceratings].cheating) { //find dbuser tracked from that source, not marked
          if((dbuser[sourceratings][variant] && !dbuser[sourceratings][variant].endsWith("?")) || variant === "everyone") {
            let entry = {
              "username": dbuser.username.slice(0, -5),
              "source": dbuser[source],
              "userid": dbuser.id,
              "rating": variant === "everyone" ? dbuser[sourceratings] : dbuser[sourceratings][variant]
            };
            if(!leaderboard.rankings[0]) leaderboard.rankings[0] = entry;
            else leaderboard.rankings.push(entry);
          }
        }
      }
    };
    if(leaderboard.rankings.length === 0) return leaderboard;
    if(variant !== "everyone") {
      leaderboard.rankings.sort(function(a, b) {
        return (parseInt(b.rating) - parseInt(a.rating));
      });
    };
    return leaderboard;
  }

  outputVariant(page) {
    this.page = page && !isNaN(page) ? page : 0;
    let array = [];
    for(let i = 0; i < 10; i++) {
      if(this.vlb.rankings[i + 10 * page]) {
        let urltext = "[" + this.vlb.rankings[i + 10 * page].username + "]";
        let urllink = "(" + config.url[this.vlb.source[1]].profile.replace("|", this.vlb.rankings[i + 10 * page].source) + ")";
        let rating = this.vlb.rankings[i + 10 * page].rating;
        array[i] = [];
        array[i][0] = urltext + urllink + " " + rating;
      }
    };
    let lbembed = Embed.leaderboard(array, page); //Case 2 Leaderboard: 
    lbembed.title = `${this.Search.emojis.get(this.vlb.variant[4])} House Rankings on ${this.vlb.source[0]} for${this.vlb.active ? "active ": " "}${this.vlb.variant[0]} players`;
    return lbembed; //Constructor, method, embed, maxpages, timeout on pages
  }
    
}

module.exports = Leaderboard;

Array.prototype.remove = function(index) {
  if(!index && index !== 0) return;
  if(Array.isArray(index)) {
    index.sort(function(a, b) {
      return b - a;
    })
    for(let i = 0; i < index.length; i++) {;
      this.splice(index[i], 1);
    }
  } else {
    this.splice(index, 1);
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