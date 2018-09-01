const config = require("../config.json");
const Parse = require("../util/parse.js");
const request = require("request");
const rp = require("request-promise");
const DataManager = require("../util/datamanager.js");
const DBuser = require("../util/dbuser.js");
const Router = require("../util/router.js");
const Embed = require("../util/embed.js");

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
    //if (!this.server.states.automaticupdates) return;
    let dbuser = this.LUTDU;
    if (dbuser) {
      let sources = Object.values(config.sources).filter(source => dbuser[source.key]);
      this.track({dbuser, sources});
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

  async update(argument) {
    try {
      let user = this.user;
      if (argument) {
        let _user = this.Search.users.get(argument);
        if (!_user) throw "Couldn't find user **" + argument + "**!";
        else user = _user;
      };
      let dbuser = DBuser.getUser(user);
      if (dbuser.username !== this.user.tag) dbuser.username = user.tag;
      let sources = Object.values(config.sources).filter(source => dbuser[source.key]);
      if (sources.length === 0) throw "No linked accounts found.\nPlease link an account to your profile through `!lichess\`, `!chess.com`, or `!bughousetest`.";
      if (this.command) this.msg = await this.Output.generic("Updating user " + dbuser.username + "...");
      this.track({dbuser, sources})
      .catch((e) => {throw e})
    } catch(e) {
      if (e && this.command) this.Output.onError(e);
    }
  }

  async track(data) {
    try {
      data.successfulupdates = [];
      for (let source of data.sources) {
        data.source = source;
        if (this.command && data.username && this.command !== "update") {
          if (data.dbuser[data.source.key] && data.dbuser[data.source.key][data.username]) throw `Already linked ${data.source.name} account **${data.username}** to ${data.dbuser.username}!`;
          data = await Tracker.handle(data, this.msg);
        } else {
          for (let account in data.dbuser[data.source.key]) {
            if (account.startsWith("_")) continue;
            data.username = account;
            if (this.command) this.Output.editor({
              "description": "Updating user " + data.dbuser.username + "... on **" + data.source.name + "**"
            }, this.msg);
            data = await Tracker.handle(data, this.msg);
            data.username = "";
          }
        }
      };
      data.dbuser.lastupdate = Date.now(); //Mark the update time
      await DBuser.setData(data.dbuser); //set it
      if (data.successfulupdates.length > 0) {
        Router.logCommand({
          "author": {
            "tag": this.command ? this.author.tag : "auto"
          },
          "args": [data.dbuser.username, ...data.successfulupdates],
          "command": "update"
        }, {
          "file": "Tracker",
          "prefix": ""
        }); //log updates received as a command
      };
      if (this.command) this.trackOutput(data);
    } catch(e) {
      if (this.command && e) this.Output.onError(e);
    }
  }

  async remove(data) {
    try {
      data.source = data.sources[0];
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
  
  async trackOutput(data) {
    try {
      let embed = {
        "color": this.server.colors.ratings,
        "fields": []
      };
      let errors = "", whitespace = "      \u200B";
      for (let source of data.sources) {
        for (let account of (this.command === "update" ? Object.keys(data.dbuser[source.key]) : [data.username])) {
          if (account.startsWith("_")) continue;
          if (!data.successfulupdates.includes(source.key)) errors += this.Search.emojis.get(source.key) + " Couldn't " + (this.command === "update" ? "update '" : `link ${this.user.username} to '`) + account + "' on " + source.name;
          else {
            Embed.fielder(
              embed.fields,
              this.Search.emojis.get(source.key) + " " + (this.command === "update" ? "Updated '" : `Linked ${this.user.username} to '`) + account + "'",
              Parse.profile(data.dbuser, source, account) + "\nCurrent highest rating is **" + data.dbuser[source.key][account].maxRating + "**" + whitespace + "\n" + Parse.ratingData(data.dbuser, source, account),
              true
            )
          }
        }
      };
      if (embed.fields.length > 0) this.Output[this.command === "update" ? "editor" : "sender"](embed, this.msg);
      if (errors) throw errors;
    } catch (e) {
      if (e) this.Output.onError(e);
    }
  }

  removeOutput(data) {
    this.Output.sender({
      "title": `Stopped tracking via !remove command`,
      "description": `Unlinked **${data.username}** from ${data.source.key} account **${data.dbuser.username}**.`,
      "color": config.colors.ratings
    })
  }

  static async handle(data) {
    try {
      let sourceData = await Tracker.request(data);
      if (!sourceData) return data;
      let method = "parse" + (data.source.key === "bughousetest" ? "lichess" : data.source.key);
      let parsedData = await Tracker[method](sourceData, {
        "source": data.source,
        "username": data.username
      });
      data = await Tracker.assign(data, parsedData);
      return data;
    } catch (e) {
      if (e) console.log(e);
      return data;
    }
  }

  static async request(data) {
    try {
      if (!data.username) throw "Request: Invalid username.";
      return await rp({
        "uri": config.sources[data.source.key].url.user.replace("|", data.username),
        "json": true,
        "timeout": 2000
      });
    } catch (e) {
      throw "Couldn't find **'" + data.username + "'** on " + data.source.name + ": " + e;
    }
  }

  static async parselichess(lichessData, data) { //Parsing API Data is different for each site
    try {
      let source = data.source;
      if (!lichessData) throw "No data found for '" + data.username + "' on " + source.name + "."; //if invalid username (i.e. from this.track()), return;
      if (lichessData.closed) throw "Account " + lichessData.username + " is closed on " + source.name + "."; //if closed return
      let ratings = { //the sub-object
        "maxRating": 0
      };
      if (!lichessData.perfs) throw "No game data found for '" + data.username + "' on " + source.name + ".";
      let allProvisional = true; //if no non-provisional ratings, return an error
      for (let [key, variant] of Object.entries(config.variants[source.key])) { //ex: "crazyhouse"
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
      if (allProvisional) throw "All ratings for " + lichessData.username + " are provisional.";
      if (lichessData.engine) ratings.cheating = "engine";
      if (lichessData.boosting) ratings.cheating = "boosting";
      if (ratings.cheating) console.log( //if found to be cheating, log it in database and tell mods
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
      return account;
    } catch (e) {
      if (e) throw e;
    }
  }

  static parsechesscom(chesscomData, data) {
    try {
      let username = data.username;
      let stats = chesscomData.stats;
      if (!stats) throw "No data found for **'" + username + "'** on Chess.com.";
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
      if (allProvisional) throw "All chess.com ratings for " + username + " are provisional.";
      return {
        "ratings": ratings,
        "username": username
      };
    } catch (e) {
      if (e) throw e;
    }
  }

  static async assign(data, parsedData) {
    let account = data.dbuser[data.source.key]; //get the "account" set of rating data for that source
    if (!account) account = {
      "_main": parsedData.username
    };
    account[parsedData.username] = parsedData.ratings;
    if (account._main === parsedData.username) { //if it's the main one
      let properties = ["_name", "_country", "_language", "_title"];
      for (let property of properties) {
        if (parsedData[property]) account[property] = parsedData[property]; //grab info
        else if (account[property]) delete account[property]; //keeps it in sync - if excess data, delete it
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