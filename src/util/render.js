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
  
  static profile(dbuser, source, username) {
    return `[${username}](${(config.sources[source].url.profile.replace("|", username))})`;
  }

}

module.exports = Render;