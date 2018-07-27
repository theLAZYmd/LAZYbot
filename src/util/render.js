const config = require("../config.json");
const Embed = require("./embed.js");

class Render {
  
  static ratingData (dbuser, sourcekey, username) {
    let account = dbuser[sourcekey][username], string;
    if(account) {
      let rating = [];
      for(let key in config.variants[sourcekey]) {
        let variant = config.variants[sourcekey][key];
        if(account[variant.key]) rating.push([variant.name, (account[variant.key].endsWith("?") ? "" : "**") + account[variant.key] + (account[variant.key].endsWith("?") ? "" : "**")]);
      };
      string = Embed.getFields(rating);
    };
    return string;
  }

  static rankingData (dbuser, source, rankingobject) {
    let sourcerankings = source + "rankings";
    let sourceratingData = `**Overall**: ${dbuser[source].ratings.maxRating}**\n`;
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
  
  static profile(dbuser, source, username) {
    return `[${username}](${(config.sources[source].url.profile.replace("|", username))})`;
  }

}

module.exports = Render;