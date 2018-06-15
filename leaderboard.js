const config = require("./config.json");
const DataManagerConstructor = require("./datamanager.js");
const DataManager = new DataManagerConstructor(config.dataFile);
const fs = require("fs");

function Leaderboard(events) {
  this.data = DataManager.getData();
  this.getdbuserfromuser = events.getdbuserfromuser;
  this.onRatingUpdate = events.onRatingUpdate;
  this.onError = events.onError;
};

Leaderboard.prototype.getList = function(guild, variant, source, active) {
  let tally = DataManager.getData();
  let sourceratings = source + "ratings";
  let leaderboard = {};
  leaderboard.source = source;
  leaderboard.variant = variant;
  leaderboard.active = active;
  leaderboard.list = [];
	for(let i = 0; i < tally.length; i++) {
    let dbuser = tally[i];
    let entry = {};
    if(!active || (dbuser.lastmessagedate && Date.now() - dbuser.lastmessagedate < 604800000)) {
      if(dbuser[source] && dbuser[sourceratings] && !dbuser[sourceratings].cheating) {
        if((dbuser[sourceratings][variant] && !dbuser[sourceratings][variant].endsWith("?")) || variant === "everyone") {
          entry.username = dbuser.username.slice(0, -5);
          entry.source = dbuser[source];
          entry.userid = dbuser.id;
          entry.rating = variant === "everyone" ? dbuser[sourceratings] : dbuser[sourceratings][variant];
          leaderboard.list.push(entry);
        }
      }
    };
    if(leaderboard.length === 0) return;
    if(variant !== "everyone") {
      leaderboard.list.sort(function(a, b) {
        return (parseInt(b.rating) - parseInt(a.rating));
      });
    }
  };
  return leaderboard;
};

Leaderboard.prototype.getRank = function(message, member) {
  let user = member.user;
  let dbuser = this.getdbuserfromuser(user);
  let serverID = member.guild.id;
	if(!dbuser) {
    return this.onError(serverID, `No linked accounts found.\nPlease link an account to your profile through \`!lichess\` or \`!chess.com\``, message);
  };
  let rankingobject = {};
  let sourceboolean = false;
  for(let i = 0; i < config.sources.length; i++) {
    let source = config.sources[i];
    if(dbuser[source[1]]) {
      sourceboolean = true;
      let sourcevariants = source[1] + "variants";
      let sourcerankings =  source[1] + "rankings";
      let leaderboardy = this.getList(member.guild, "everyone", source[1], false); //grab a leaderboard of all
      for(let j = 0; j < config[sourcevariants].length; j++) {
        let variant = config[sourcevariants][j];
        for(let k = 0; k < leaderboardy.list.length; k++) {
          if(!leaderboardy.list[k].rating[variant[1]] || leaderboardy.list[k].rating[variant[1]].endsWith("?")) { //set provisional, nonexistant to 0
            leaderboardy.list[k].rating[variant[1]] = 0;
          };
        };
        leaderboardy.list.sort(function(a, b) { //for each variant instance, sort by variant rating
          return parseInt(b.rating[variant[1]]) - parseInt(a.rating[variant[1]]);       
        });
        let matchboolean = false;
        for(let k = 0; k < leaderboardy.list.length; k++) {
          if(leaderboardy.list[k].rating[variant[1]] === 0) break; //get rid of 0 ratings
          if(leaderboardy.list[k].userid === member.id) { //return array index for matching ids
            if(!rankingobject[sourcerankings]) rankingobject[sourcerankings] = {};
            rankingobject[sourcerankings][variant[1]] = k + 1;
            matchboolean = true;
            break;
          }
        }
      }
    };
  };
  if(sourceboolean) {
    this.onRatingUpdate(message, member.user, rankingobject);
  } else {
    this.onError(serverID, `No linked accounts found.\nPlease link an account to your profile through \`!lichess\` or \`!chess.com\``, message)
  }
}

module.exports = Leaderboard;