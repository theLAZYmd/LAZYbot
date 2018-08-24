const config = require("../config.json");
const Parse = require("../util/parse.js");
const request = require("request");
const DataManager = require("../util/datamanager.js");
const DBuser = require("../util/dbuser.js");
const Render = require("../util/render.js");

class Tracker extends Parse {

  constructor(message) {
    super(message);
  }

  get LUTDU() { //Least Up-to-Date User
    let tally = DataManager.getData();
    let foundUser = null, currentValue = Infinity
    for (let dbuser of tally) {
      if (dbuser.left) continue; //if they're not in the server, stop updating them
      let sources = Object.values(config.sources).filter(source => dbuser[source.key]);
      if (sources.length === 0) continue; //if no linked accounts, ignore them
      if (!dbuser.lastupdate) { //if they haven't been updated (historic people)...
        let member = this.Search.members.byUser(dbuser);
        if (!member) {
          dbuser.left = true;
          DBuser.setData(dbuser);
          continue;
        };
        if (dbuser.left) {
          delete dbuser.left;
          DBuser.setData(dbuser);
        };
        if (!/online|idle|dnd/.test(member.presence.status)) continue;
        foundUser = dbuser; //don't both searching anymore
        break;
      };
      if (dbuser.lastupdate < currentValue && dbuser.lastupdate < Date.now() - config.delays.repeat) {
        let member = this.Search.members.byUser(dbuser);
        if (!member) {
          dbuser.left = true;
          DBuser.setData(dbuser);
          continue;
        };
        if (dbuser.left) {
          delete dbuser.left;
          DBuser.setData(dbuser);
        };
        if (!/online|idle|dnd/.test(member.presence.status)) continue;
        currentValue = dbuser.lastupdate;
        foundUser = dbuser;
      }
    };
    return foundUser;
  }

  initUpdateCycle() {
    let dbuser = this.LUTDU;
    if (dbuser) {
      let sources = Object.values(config.sources).filter(source => dbuser[source.key]);
      if (dbuser) this.track({dbuser, sources});
    };
    setTimeout(() => this.initUpdateCycle(), config.delays.update);
  }

  updatepresence(member, nowonline) {
    if (nowonline) Tracker.updateQueue[member.id] = true;
    else delete Tracker.updateQueue[member.id];
  }

  async run(command, args) { //both !remove and the linking commands start here
    try {
      let username, _command;
      if (command === "remove") { //it's all the same functions for `!remove just with one extra argument
        _command = args.shift();
      } else {
        _command = command;
        command = "track";
      };
      let sources = Object.values(config.sources).filter(source => source.key === _command.replace(".", ""));
      if (args.length === 0) username = this.author.username;
      if (args.length === 1) username = args[0];
      if (args.length === 2) {
        if (!this.Check.role(this.member, this.server.roles.admin)) throw "Insufficient permissions to perform this command.";
        let user = this.Search.users.get(args[0]);
        if (!user) throw "Invalid user given.";
        this.user = user;
        this.member = this.Search.members.byUser(user);
        username = args[1];
      };
      let dbuser = this.dbuser; //otherwise this.dbuser gets called by a getter every time. This way it gets cached
      username = username.replace(/["`']+/g, "");
      for (let _username in dbuser[sources[0].key]) 
        if (_username.toLowerCase() === username.toLowerCase()) username = _username;
      if (!username.match(/[a-z0-9][\w-]*[a-z0-9]/i)) throw "Invalid username.";
      this[command]({dbuser, sources, username})
      .catch((e) => {throw e})
      let newRole = this.Search.roles.get(this.server.roles.beta);
      if (!this.member.roles.has(newRole.id)) this.member.addRole(newRole).catch((e) => this.Output.onError(e));
    } catch(e) {
      if (e) this.Output.onError(e);
    }
  }

  async update(args) {
    try {
      if (args[0]) this.user = this.Search.users.get(args[0]);
      let dbuser = this.dbuser;
      let sources = Object.values(config.sources).filter(source => dbuser[source.key]);
      if (sources.length === 0) throw "No linked accounts found.\nPlease link an account to your profile through `!lichess\`, `!chess.com`, or `!bughousetest`.";
      this.track({dbuser, sources})
      .catch((e) => {throw e})
    } catch(e) {
      if (e && this.command === "update") this.Output.onError(e);
    }
  }

  async track(data) {
    try {
      data.successfulupdates = [];
      for (let source of data.sources) {
        data.source = source;
        if (this.command && data.username && this.command !== "update") {
          if (!data.dbuser[data.source.key]) data.dbuser[data.source.key] = {};
          if (data.dbuser[data.source.key][data.username]) throw `Already linked ${data.source.name} account **${data.username}** to ${data.dbuser.username}!`;
          data = await Tracker.handle(data);
        } else {
          for (let account in data.dbuser[data.source.key]) {
            if (account.startsWith("_")) continue;
            data.username = account;
            data = await Tracker.handle(data)
          }
        }
      };
      data.dbuser.lastupdate = Date.now(); //Mark the update time
      await DBuser.setData(data.dbuser); //set it
      console.log(`Updated ${data.dbuser.username} on ${data.successfulupdates.join(", ") } with no errors.`);
      if (this.command) this.trackOutput(data);
    } catch(e) {
      e = "**" + data.dbuser.username + ":** " + e;
      if (this.command) this.Output.onError(e);
      else console.log(e);
    }
  }

  async remove(data) {
    try {
      data.source = data.sources[0];
      if (!data.dbuser[data.source.key]) throw "There are no linked " + data.source.name + " accounts to **" + data.dbuser.username + "**.";
      let found = false, isMain = false, NoAccountsLeft = false;
      for (let account in data.dbuser[data.source.key]) {
        if (data.username && data.username.toLowerCase() === account.toLowerCase()) {
          found = true;
          delete data.dbuser[data.source.key][account];
          if (data.dbuser[data.source.key]._main === account) {
            isMain = true;
            data.dbuser[data.source.key]._main = "";
          };
          break;
        }
      };
      if (!found) throw "Could not find username **" + data.username + "** linked to account **" + data.dbuser.username + "**.";
      for (let account in data.dbuser[data.source.key]) {
        if (account.startsWith("_")) {
          if (isMain) delete data.dbuser[data.source.key][account];
        } else {
          if (!data.dbuser[data.source.key]._main) data.dbuser[data.source.key] = account;
          NoAccountsLeft = true;
        };
      };
      if (!NoAccountsLeft) delete data.dbuser[data.source.key];
      DBuser.setData(data.dbuser);
      this.removeOutput(data);
    } catch(e) {
      if (e) this.Output.onError(e);
    }
  }
  
  trackOutput(data) {
    let embed = {
      "color": this.server.colors.ratings,
      "fields": []
    };
    let whitespace = "      \u200B"
    for (let sourceObject of data.sources) {
      let source = sourceObject.key;
      for (let account in data.dbuser[source]) {
        if (this.command !== "update") account = data.username;
        if (account.startsWith("_")) continue;
        embed.fields.push({
          "name": this.Search.emojis.get(source) + " " + (this.command === "update" ? "Updated '" : `Linked ${this.user.username} to '`) + account + "'",
          "value": Render.profile(data.dbuser, source, account) + "\nCurrent highest rating is **" + data.dbuser[source][account].maxRating + "**" + whitespace + "\n" + Render.ratingData(data.dbuser, source, account),
          "inline": true
        });
        if (this.command !== "update") break;
      }
    };
    this.Output.sender(embed);
  }

  removeOutput(data) {
    this.Output.sender({
      "title": `Stopped tracking via !remove command`,
      "description": `Unlinked **${data.username}** from ${data.source.key} account **${data.dbuser.username}**.`,
      "color": config.colors.ratings
    })
  }

  static async handle(data) {
    let sourceData = await Tracker.request(data)
    let method = "parse" + (data.source.key === "bughousetest" ? "lichess" : data.source.key);
    let parsedData = await Tracker[method](sourceData, {
      "source": data.source,
      "username": data.username
    });
    data = await Tracker.assign(data, parsedData);
    return data;
  }

  static request(data) {
    return new Promise((resolve, reject) => {
      if (!data.username) return reject("Request: Invalid username.");
      request.get(config.sources[data.source.key].url.user.replace("|", data.username), (error, response, body) => {
        if (error) return reject(error);
        if (body.length === 0) return reject("Couldn't find **'" + data.username + "'** on " + data.source.name + ".");
        try {
          let json = JSON.parse(body);
          resolve(json);
        } catch (e) {
          if (e) reject(response, e);
        }
      })
    })
  }

  static parselichess(lichessData, data) { //Parsing API Data is different for each site
    return new Promise((resolve, reject) => {
      let source = data.source;
      if (!lichessData) return reject("No data found for '" + data.username + "' on " + source.name + "."); //if invalid username (i.e. from this.track()), return;
      if (lichessData.closed) return reject("Account " + lichessData.username + " is closed on " + source.name + "."); //if closed return
      let ratings = { //the sub-object
        "maxRating": 0
      };
      let allProvisional = true; //if no non-provisional ratings, return an error
      for (let key in config.variants[source.key]) { //ex: "crazyhouse"
        let variant = config.variants[source.key][key]; //ex: {"name": "Crazyhouse", "api": "crazyhouse", "key": "crazyhouse"}
        let variantData = lichessData.perfs[variant.api]; //lichess data, ex: {"games":1,"rating":1813,"rd":269,"prog":0,"prov":true}
        if (variantData) {
          ratings[key] = variantData.rating.toString(); //if it exists, take the API's number and store it as a string
          if (!variantData || variantData.prov) ratings[key] += "?"; //if provisional, stick a question mark on it
          else {
            allProvisional = false; //if not provisional, allow user to link this account
            if (Number(ratings[key]) > ratings.maxRating) ratings.maxRating = ratings[key]; //and if it's the biggest so far, set it.
          }
        }
      };
      if (allProvisional) return reject("All ratings for " + lichessData.username + " are provisional.");
      if (lichessData.engine) ratings.cheating = "engine";
      if (lichessData.boosting) ratings.boosting = "boosting";
      if (ratings.cheating) reject( //if found to be cheating, log it in database and tell mods
        `Player ${lichessData.username} (${config.sources[source.key].url.profile.replace("|", lichessData.username)}) ` +
        (ratings.cheating === "engine" ? "uses chess computer assistance." : "") +
        (ratings.cheating === "engine" ? "artificially increases/decreases their rating." : "") + "."
      );
      else delete ratings.cheating; //in case of temporary marks
      let account = {
        "ratings": ratings,
        "username": lichessData.username,
        "_language": lichessData.language ? lichessData.language : "",
        "_title": lichessData.title ? lichessData.title : "",
        "_country": lichessData.profile ? lichessData.profile.country : "",
        "_name": lichessData.profile ? (lichessData.profile.firstName ? lichessData.profile.firstName : "") + " " + (lichessData.profile.lastName ? lichessData.profile.lastName : "") : "",
      }; //return a data object
      if (account._name) account._name = account._name.trim();
      for (let property in account)
        if (!account[property]) delete account[property];
      resolve(account);
    })
  }

  static parsechesscom(chesscomData, data) {
    return new Promise((resolve, reject) => {
      let username = data.username;
      let stats = chesscomData.stats;
      if (!stats) return reject("No data found for **'" + username + "'** on Chess.com.");
      let ratings = {
        "maxRating": 0
      };
      let allProvisional = true; //if no non-provisional ratings, return an error
      for (let key in config.variants.chesscom) { //ex: "crazyhouse"
        let variant = config.variants.chesscom[key]; //ex: {"name": "Crazyhouse", "api": "crazyhouse", "key": "crazyhouse"}
        for (let i = 0; i < stats.length; i++) {
          let chessData = stats[i];
          if (chessData.key === variant.api) {
            ratings[key] = chessData.stats.rating.toString();
            if (chessData.gameCount < 10) ratings[key] += "?";
            else {
              allProvisional = false;
              if (Number(ratings[key]) > ratings.maxRating) ratings.maxRating = ratings[key]; //and if it's the biggest so far, set it.
            }
          }
        }
      };
      if (allProvisional) return reject("All chess.com ratings for " + username + " are provisional.");
      resolve({
        "ratings": ratings,
        "username": username
      })
    })
  }

  static assign(data, parsedData) {
    let account = data.dbuser[data.source.key]; //get the "account" set of rating data for that source
    if (!account) account = { //if that source has never been assigned to before (first account)
      "_main": parsedData.username //it's the main one
    };
    Object.assign(account[parsedData.username] = {}, parsedData.ratings);
    if (account._main === parsedData.username) { //if it's the main one
      let properties = ["_name", "_country", "_language", "_title"];
      for (let i = 0; i < properties.length; i++) {
        if (parsedData[properties[i]]) account[properties[i]] = parsedData[properties[i]]; //grab info
        else if (account[properties[i]]) delete account[properties[i]]; //keeps it in sync - if excess data, delete it
      }
    };
    data.username = parsedData.username;
    data.dbuser[data.source.key] = account; //set it
    data.successfulupdates.push(data.source.key); //and push it to the updates information
    return data;
  }

};

Tracker.updateQueue = {};

module.exports = Tracker;