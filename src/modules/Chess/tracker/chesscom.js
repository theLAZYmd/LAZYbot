const config = require("../../../config.json");

class Parse {  
  
  constructor (chesscomData, data) {
    this.stats = chesscomData.stats;
    this.data = data;    
    if (this.allProvisional) throw "All ratings are provisional.";
  }

  get allProvisional () {
    return this.ratings.maxRating === 0;
  }
  
  get ratings () {
    let ratings = {   "maxRating": 0    };
    for (let key in config.variants.chesscom) { //ex: "crazyhouse"
      let variant = config.variants.chesscom[key]; //ex: {"name": "Crazyhouse", "api": "crazyhouse", "key": "crazyhouse"}
      for (let s of this.stats) {
        if (s.key === variant.api) {
          ratings[key] = s.stats.rating.toString();
          if (s.gameCount < 10) ratings[key] += "?";
          else if (Number(ratings[key]) > ratings.maxRating) ratings.maxRating = ratings[key]; //and if it's the biggest so far, set it.
        }
      }
    }
    return ratings;
  }

  get username () {
    return this.data.username;
  }

}

module.exports = Parse;