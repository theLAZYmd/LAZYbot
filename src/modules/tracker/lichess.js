const config = require("../../config.json");

class Parse {
  
  constructor (lichessData, data) {
    this.lichessData = lichessData;
    this.data = data;
    this.source = data.source;
		if (!this.lichessData) throw "No data found."; //if invalid username (i.e. from this.track()), return;
		if (!this.lichessData.perfs) throw "No game data found.";
    if (this.lichessData.closed) throw "Account is closed."; //if closed return
    if (this.allProvisional) throw "All ratings are provisional.";
    try {
			if (this.lichessData.engine && this.lichessData.booster) throw "uses chess computer assistance and artificially increases/decreases their rating";
			if (this.lichessData.engine) throw "uses chess computer assistance";
			if (this.lichessData.booster) throw "artificially increases/decreases their rating";
		} catch (e) {
			if (e) throw `Player ` + e + ".";
    }
  }

  get allProvisional () {
    return this.ratings.maxRating === 0;
  }
  
  get ratings () {
    let ratings = {   "maxRating": 0    };
		for (let [key, variant] of Object.entries(config.variants[this.source.key])) { //ex: "crazyhouse"
			let variantData = this.lichessData.perfs[variant.api]; //lichess data, ex: {"games":1,"rating":1813,"rd":269,"prog":0,"prov":true}
			if (variantData) {
				ratings[key] = variantData.rating.toString(); //if it exists, take the API's number and store it as a string
				if (!variantData || variantData.prov) ratings[key] += "?"; //if provisional, stick a question mark on it
				else if (Number(ratings[key]) > ratings.maxRating) ratings.maxRating = ratings[key]; //and if it's the biggest so far, set it.
			}
    }
    return ratings;
  }

  get username () {
    return this.lichessData.username;
  }

  get _language () {
    return this.lichessData.language ? this.lichessData.language : "";
  }

  get _title () {
    return this.lichessData.title ? this.lichessData.title : "";
  }

  get _country () {
    return this.lichessData.profile ? this.lichessData.profile.country : "";
  }

  get _name () {
    return this.lichessData.profile ? ((this.lichessData.profile.firstName ? this.lichessData.profile.firstName : "") + " " + (this.lichessData.profile.lastName ? this.lichessData.profile.lastName : "")).trim() : "";
  }

}

module.exports = Parse;