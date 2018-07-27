const config = require("../config.json");
const Parse = require("../util/parse.js");
const request = require("request");
const DataManager = require("../util/datamanager.js");
const DBuser = require("../util/dbuser.js");

class Tracker extends Parse {

  constructor(message) {
    super(message);
    this.updateDelay = config.updateDelay;
    this.updateQueue = this._updateQueue;
  }

  get _updateQueue () {
    this.Search.members.getOnline().forEach((member) => {
      Tracker.updateQueue[member.id] = true;
    });
    return Tracker.updateQueue;
  }

  static getLeastUpToDateUser() {
    const tally = DataManager.getData(), foundUser = null, currentValue = Infinity
    for(let i = 0; i < tally.length; i++) {
      if(Tracker.updateQueue[tally[i].id]) {
        let verified = false;
        for(let source in config.sources) {
          if(tally[i][source]) verified = true; 
        };
        if(!verified) {
          currentValue = 0;
          foundUser = tally[i];
          break;
        };
      } else 
      if((Tracker.updateQueue[tally[i].id] && tally[i].lastUpdate && tally[i].lastUpdate < currentValue && tally[i].lastUpdate < Date.now() - 1800000)) {
        let killboolean = true;
        for(let source in config.sources) {
          if(tally[i][source]) killboolean = false;
        };
        if(!killboolean) {
          currentvalue = tally[i].lastUpdate || 0;
          foundUser = tally[i];
        }
      }
    };
    return foundUser;
  }
  
  initUpdateCycle () {
    let dbuser = Tracker.getLeastUpToDateUser();
    if(dbuser) this.update(dbuser, false);
    setTimeout(() => this.initUpdateCycle(), 15000);
  }

  updatepresence (member, nowonline) {
    if(nowonline) Tracker.updateQueue[member.id] = true;
    else delete Tracker.updateQueue[member.id];
  }

  run (command, args) {
    let _command;
    if(command === "remove") { //it's all the same functions for `!remove just with one extra argument
      _command = command;
      command = args.shift();
    };
    let dbuser, source, username;
    for(let _source in config.sources) {
      if(command.replace(".", "") === _source) source = config.sources[_source];
    };
    if(args.length === 0) {
      dbuser = DBuser.get(this.author);
      username = this.author.username;
    };
    if(args.length === 1) {
      dbuser = DBuser.get(this.author);
      username = args[0];
    };
    if(args.length === 2) {
      if(!this.Check.roles(this.member, this.server.roles.admin)) return this.Output.onError("Invalid user given.")
      let user = this.Search.users.get(args[0]);
      if(!user) return this.Output.onError("Invalid user given.")
      dbuser = DBuser.get(user);
      username = args[1];
    };
    if(!dbuser || !source || !username) return this.Output.onError("Incorrect number of parameters given.");
    username = username.replace(/["`']+/g, "");
    for(let _username in dbuser[source.key]) {
      if(_username.toLowerCase() === username.toLowerCase()) username = _username;
    };
    if(!username.match(/[a-z0-9][\w-]*[a-z0-9]/i)) return this.Output.onError("Invalid username.");
    this[_command === "remove" ? "remove" : "track"]({
      "dbuser": dbuser,
      "source": source,
      "username": username,
      "successfulupdates": []
    })
  }

  track (data) {
    new Promise((resolve, reject) => {
      resolve(data);
    })
    .then((data) => {
      for(let property in data.dbuser[data.source.key]) {
        if(property.toLowerCase() === data.username.toLowerCase()) {
          this.Output.onError(`Already linked ${data.source.name} account **${property}** to ${data.dbuser.username}!`);
          throw "";
        }
      };
      return data;
    })
    .then((data) => {
      return Tracker.handle(data, (error) => {throw error});
    })
    .then((outputData) => {
      for(let _username in outputData.dbuser[outputData.source.key]) {
        if(_username.toLowerCase() === outputData.username.toLowerCase()) outputData.username = _username;
      };
      this.Output.onTrackSuccess(outputData.dbuser, outputData.source, outputData.username);
    })
    .catch((e) => {
      this.Output.onError(e);
      console.log(e);
    })
  }

  remove (data) {
    if(!data.dbuser[data.source.key]) return this.Output.onError("There are no linked " + data.source.name + " accounts to **" + data.dbuser.username + "**.")
    if(data.username && data.dbuser[data.source.key][data.username]) {
      delete data.dbuser[data.source.key][data.username];
      let main = data.dbuser[data.source.key]._main === data.username;
      let NoAccountsLeft = false;
      for(let property in data.dbuser[data.source.key]) {
        if(property.startsWith("_")) {
          if(main) delete data.dbuser[data.source.key][property];
        } else NoAccountsLeft = true;
      };
      if(!NoAccountsLeft) delete data.dbuser[data.source.key];
      DBuser.setData(data.dbuser);
      this.Output.onRemoveSuccess(data.dbuser, data.source, data.username);
    } else this.Output.onError("Could not find username **" + data.username + "** linked to account **" + data.dbuser.username + "**.");
  }

  updateinput(dbuser, args) {
    if(args[0]) dbuser = DBuser.get(this.Search.users.get(args[0]));
    let linkedAccount = false;
    for(let source in config.sources) {
      if(dbuser[source]) linkedAccount = true;
    };
    if(!linkedAccount) return this.Output.onError("No linked accounts found.\nPlease link an account to your profile through `!lichess\`, `!chess.com`, or `!bughousetest`.");
    this.update(dbuser, true);
  }

  update (dbuser, post) {
    let data = {
      "dbuser": dbuser
    };
    new Promise((resolve, reject) => {
      resolve(data);
    })
    .then((data) => {
      for(let sourcekey in config.sources) {
        if(!data.dbuser[sourcekey]) continue;
        data.source = config.sources[sourcekey];
        for(let account in data.dbuser[sourcekey]) {
          if(account.startsWith("_")) continue;
          data.username = account;
          Tracker.handle(data, (error) => {throw error})
          .then(_data => {
            console.log(account);
            data = _data;
          })
          .catch(e => console.log(e));
        };
        console.log(data);
      };
      return data;
    })
    .then((outputData) => {
      console.log(`Updated ${data.dbuser.username} on ${data.successfulupdates.join(", ") }with no errors.`);
      if(post) this.Output.onRatingUpdate(outputData.dbuser);
    })
    .catch((e) => {
      this.Output.onError(e);
      console.log(e);
    })
  }

  /*   {
    "aliases": [
      "update"
    ],
    "description": "Updates a user on all their accounts.",
    "usage": [
      "update",
      "update theLAZYmd"
    ],
    "module": "Chess",
    "file": "tracker",
    "method": "updateinput",
    "arguments": ["dbuser", "args"],
    "prefix": "generic"
  }, */

  static handle (data, onError) {
    return Tracker.request(data.source, data.username)
    .then((sourceData) => {
      console.log("sourceData", !!sourceData);
      let method = "parse" + (data.source.key === "bughousetest" ? "lichess" : data.source.key);
      return Tracker[method](sourceData, (msg) => {throw (msg)}, {
        "source": data.source,
        "username": data.username
      });
    })
    .then((parsedData) => {
      console.log("parsedData", !!parsedData);
      return Tracker.assign(data, parsedData);
    })
    .then((data) => {
      console.log("data", !!data);
      if(!data.dbuser) throw "No dbuser found.";    
      data.dbuser.lastUpdate = Date.now(); //Mark the update time
      DBuser.setData(data.dbuser); //set it
      return data;
    })
    .catch((error) => {
      onError(error);
      return data;
    })
  }

  static request(source, username) {
    return new Promise((resolve, reject) => {
      if(!username) return reject("Invalid username.");
      request.get(config.sources[source.key].url.user.replace("|", username), (error, response, body) => {
        if(error) {
          return reject(error);
        }
        if(body.length === 0) {
          return reject("Couldn't find **'" + username + "'** on " + source.name + ".");
        }
        let json = null;
        try {
          json = JSON.parse(body);
        } catch (e) {
          reject(response, e);
        }
        resolve(json);
      })
    })
  }

  static parselichess (lichessData, onError, data) { //Parsing API Data is different for each site
    let source = data.source;
    if(!lichessData) return onError("Couldn't find '" + username + "' on " + source.name + "."); //if invalid username (i.e. from this.track()), return;
    if(lichessData.closed) return onError("Account " + lichessData.username + " is closed on " + source.name + "."); //if closed return
    let ratings = { //the sub-object
      "maxRating": 0
    };
    let allProvisional = true; //if no non-provisional ratings, return an error
    for(let key in config.variants[source.key]) { //ex: "crazyhouse"
      let variant = config.variants[source.key][key]; //ex: {"name": "Crazyhouse", "api": "crazyhouse", "key": "crazyhouse"}
      let variantData = lichessData.perfs[variant.api]; //lichess data, ex: {"games":1,"rating":1813,"rd":269,"prog":0,"prov":true}
      if(variantData) {
        ratings[key] = variantData.rating.toString(); //if it exists, take the API's number and store it as a string
        if(!variantData || variantData.prov) ratings[key] += "?"; //if provisional, stick a question mark on it
        else {
          allProvisional = false; //if not provisional, allow user to link this account
          if(Number(ratings[key]) > ratings.maxRating) ratings.maxRating = ratings[key]; //and if it's the biggest so far, set it.
        }
      }
    };
    if(allProvisional) return onError("All ratings for " + lichessData.username + " are provisional.");
    if(lichessData.engine) ratings.cheating = "engine";
    if(lichessData.boosting) ratings.boosting = "boosting";
    if(ratings.cheating) onError( //if found to be cheating, log it in database and tell mods
      `Player ${lichessData.username} (${config.sources[source.key].url.profile.replace("|", lichessData.username)}) ` + 
      (ratings.cheating === "engine" ? "uses chess computer assistance." : "") +
      (ratings.cheating === "engine" ? "artificially increases/decreases their rating." : "") + "."
    );
    else delete ratings.cheating; //in case of temporary marks
    let profile = {
      "ratings": ratings,
      "username": lichessData.username,
      "_language": lichessData.language ? lichessData.language : "",
      "_title": lichessData.title ? lichessData.title : "",
      "_country": lichessData.profile ? lichessData.profile.country : "",
      "_name": lichessData.profile ? [lichessData.profile.firstName, lichessData.profile.lastName] : [],
    }; //return a data object
    if(profile._name) {
      let string = "";
      for(let i = 0; i < profile._name.length; i++) {
        if(profile._name[i]) string += profile._name[i];
      };
      profile._name = string.trim();
    };
    for(let property in profile) {
      if(!profile[property]) delete profile[property];
    };
    return profile;
  }

  static parsechesscom(chesscomData, onError) {
    let username = data.username;
    let stats = chesscomData.stats;
    if(!stats) return onError("Couldn't find **'" + username + "'** on Chess.com.");
    let ratings = {
      "maxRating": 0
    };
    let allProvisional = true; //if no non-provisional ratings, return an error
    for(let key in config.variants.chesscom) { //ex: "crazyhouse"
      let variant = config.variants.chesscom[key]; //ex: {"name": "Crazyhouse", "api": "crazyhouse", "key": "crazyhouse"}
      for(let i = 0; i < stats.length; i++) {
        let chessData = stats[i];
        if(chessData.key === variant.api) {
          ratings[key] = chessData.stats.rating.toString();
          if(chessData.gameCount < 10) ratings[key] += "?";
          else {
            allProvisional = false;
            if(Number(ratings[key]) > ratings.maxRating) ratings.maxRating = ratings[key]; //and if it's the biggest so far, set it.
          }
        }
      }
    };
    if(allProvisional) return onError("All chess.com ratings for " + username + " are provisional.");
    return {
      "ratings": ratings,
      "username": username
    }
  }

  static assign(data, parsedData) {
    let profile = data.dbuser[data.source.key]; //get the "profile" set of rating data for that source
    if(!profile) profile = { //if that source has never been assigned to before (first account)
      "_main": parsedData.username //it's the main one
    };
    Object.assign(profile[parsedData.username] = {}, parsedData.ratings);
    if(profile._main === parsedData.username) { //if it's the main one
      let properties = ["_name", "_country", "_language", "_title"];
      for(let i = 0; i < properties.length; i++) {
        if(parsedData[properties[i]]) profile[properties[i]] = parsedData[properties[i]]; //grab info
        else if(profile[properties[i]]) delete profile[properties[i]]; //keeps it in sync - if excess data, delete it
      }
    };
    data.dbuser[data.source.key] = profile; //set it
    data.successfulupdates.push(data.source.key); //and push it to the updates information
    return data;
  }

};

Tracker.updateQueue = {};

module.exports = Tracker;