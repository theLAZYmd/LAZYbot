const config = require("../config.json");
const Parse = require("../util/parse.js");
const request = require("request");
const DataManager = require("../util/datamanager.js");
const DBuser = require("../util/dbuser.js");

class Tracker extends Parse {

  constructor(message) {
    super(message);
    this.stopUpdating = false;
    this.updating = false;
    this.updateDelay = config.updateDelay;
  }

  get UpdateQueue () {
    this.getonlinemembers().forEach(function(member) {
      Tracker.updatequeue[member.id] = true;
    })
    return Tracker.updatequeue;
  }

  messagelogger () { //section for message logging
    if(this.message.author.bot) return;
    this.dbuser.messages++;
    let noprefixboolean = true;
    for(let prefix in this.server.prefixes) {
      if(this.prefix === this.server.prefixes[prefix]) noprefixboolean = false;
    };
    if(noprefixboolean) {
      this.dbuser.lastmessage = this.message.content > 500 ? this.message.content.slice(0, 500).replace("`", "") + "..." : this.message.content.replace(/\`/g,"");
      this.dbuser.lastmessagedate = this.message.createdTimestamp;
      if(this.dbuser.username !== this.user.tag) this.dbuser.username = user.tag; 
    };
    DBuser.setData(this.dbuser);
  }
  
  initUpdateCycle () {
    let dbuser = this.LeastUpToDateUser;
    if(dbuser && !this.stopUpdating) {
      this.updating = true;
      this.updateUser(dbuser, false);
      setTimeout(() => this.initUpdateCycle(), 15000);
    } else {
      setTimeout(() => this.initUpdateCycle(), 15000);
    }
  }

  updatepresence (member, nowonline) {
    if(nowonline === true) {
      Tracker.updatequeue[member.id] = true;
    } else
    if(nowonline === false) {
      delete Tracker.updatequeue[member.id];
    }
  }

  track (serverID, user, source, username, message) {
    username = username.replace(/["`']+/g, "");
    if(username.length < 2) {
      return Output.onError("Invalid username.");
    };
    let dbuser = this.getdbuserfromuser(user);
    if(dbuser[source]) {
      let sourcetitle = this.getsourcetitle(source);
      return Output.onError(`Duplicate from **${sourcetitle}**. You have already linked **${dbuser[source]}** to your profile.\nUse \`!remove ${source}\` to unlink your account.`);
    };
    let data = {
      "dbuser": dbuser,
      "username": username,
      "successfulupdates": "",
      "lichess": this.httpboolean().lichess,
      "chesscom": this.httpboolean().chesscom,
      "bughousetest": this.httpboolean().bughousetest
    };
    if(source === "lichess") {
      this.handleLichessData(data)
      .then((data) => {
        let dbuser = data.dbuser;
        if(!dbuser) return;
        this.stopUpdating = true;
        let tally = DataManager.getData();
        let dbindex = this.getdbindexfromdbuser(dbuser);
        tally[dbindex] = dbuser;
        DataManager.setData(tally);
        Output.onTrackSuccess(dbuser.id, source, dbuser[source]);
        dbuser.lastupdate = Date.now();
        this.stopUpdating = false;
      })
      .catch((error) => {
        Output.onError("Error adding user. " + error);
      })
    } else
    if(source === "chesscom") {
      this.handleChesscomData(data)
      .then((data) => {
        let dbuser = data.dbuser;
        this.stopUpdating = true;
        let tally = DataManager.getData();
        let dbindex = this.getdbindexfromdbuser(dbuser);
        tally[dbindex] = dbuser;
        DataManager.setData(tally);
        Output.onTrackSuccess(dbuser.id, source, dbuser[source]);
        dbuser.lastupdate = Date.now();
        this.stopUpdating = false;
      })
      .catch((error) => {
        Output.onError("Error adding user. " + error);
      })
    } else
    if(source === "bughousetest") {
      this.handleBughousetestData(data)
      .then((data) => {
        let dbuser = data.dbuser;
        this.stopUpdating = true;
        let tally = DataManager.getData();
        let dbindex = this.getdbindexfromdbuser(dbuser);
        tally[dbindex] = dbuser;
        DataManager.setData(tally);
        Output.onTrackSuccess(dbuser.id, source, dbuser[source]);
        dbuser.lastupdate = Date.now();
        this.stopUpdating = false;
      })
      .catch((e) => {
        Output.onError("Error adding user. " + error);
      })
    }
  }
  
  sourceHandler(data) {
    return new Promise((resolve, reject) => {
      resolve(data);
      if(!data) reject(dbuser);
    });
  }

  updateUser (user, post) {
    let data = {
      "dbuser": DBuser.get(user),
      "successfulupdates": "",
      "lichess": this.httpboolean().lichess,
      "chesscom": this.httpboolean().chesscom,
      "bughousetest": this.httpboolean().bughousetest
    };
    if (!data.dbuser.lichess && !data.dbuser.chesscom && !data.dbuser.bughousetest) {
      Output.onError(`No linked accounts found.\nPlease link an account to your profile through \`!lichess\` or \`!chess.com\``);
      return;
    } else {
    this.sourceHandler(data)
      .then((data) => {
        data.username = data.dbuser.lichess;
        return this.handleLichessData(data)
      })
      .then((data) => {
        data.username = data.dbuser.chesscom;
        return this.handleChesscomData(data)
      })
      .then((data) => {
        data.username = data.dbuser.bughousetest;
        return this.handleBughousetestData(data)
      })
      .then((data) => {
        let dbuser_ = data.dbuser;
        this.stopUpdating = true;
        dbuser_.lastupdate = Date.now();
        let tally = DataManager.getData();
        let dbindex = this.getdbindexfromdbuser(dbuser_);
        tally[dbindex] = dbuser_;
        DataManager.setData(tally);
        console.log(`Updated ${dbuser_.username} on ${data.successfulupdates}with no errors.`);
      })
      .then(() => {
        if(post) Output.onRatingUpdate(user);
        this.stopUpdating = false;
      })
      .catch((error) => {
        Output.onError("Error adding user. " + error);
      })
    }
  }

  remove (serverID, source, userID, message, nomsg) {
    this.stopUpdating = true;
    let tally = DataManager.getData();
    let dbindex = this.getdbindexfromid(userID)
    let username = tally[dbindex][source.toLowerCase()];
    let sourceratings = source + "ratings";
    if (username) {
      delete tally[dbindex][source];
      delete tally[dbindex][sourceratings];
      DataManager.setData(tally);
      Output.onRemoveSuccess(userID, source, username);
    } else {
      if(!nomsg) {
        Output.onError("No tracking entry found to remove.");
      }
    }
    this.stopUpdating = false;
  }

  getLichessDataForUser(username) {
    return new Promise((resolve, reject) => {
      if (username === false) return reject("Invalid username.");
      request.get(config.url.lichess.user.replace("|", username), (error, response, body) => {
        if(error) {
          return reject(error);
        }
        if (body.length === 0) {
          return reject("Couldn't find **'" + username + "'** on Lichess.");
        }
        let json = null;
        try {
          json = JSON.parse(body);
        } catch (e) {
          reject(e);
        }
        resolve(json);
      });
    });
  }

  handleLichessData(data) {
    let dbuser = data.dbuser;
    let username = data.username;
    let [source, sourceratings] = ["lichess", "lichessratings"];
    return new Promise((resolve, reject) => {
      if(username) {
        if(data.lichess) {
          this.getLichessDataForUser(username)
          .then((sourceData) => {
            return parseLichessUserData(sourceData, (msg) => {
              reject(msg);
            }, (msg) => {
              reject(msg);
            });
          })
          .then((profile) => {
            if(profile) {
              dbuser.lastupdate = Date.now();
              dbuser[source] = profile.username;
              if(profile.title) dbuser.title = profile.title;
              else delete dbuser.title;
              dbuser[sourceratings] = profile.ratings;
              data.dbuser = dbuser;
              data.successfulupdates += "lichess, ";
            };
            resolve(data);
          })
          .catch((error) => {
            resolve(data);
            reject(error);
          })
        } else {
          resolve(data);
          reject(`Couldn't connect to ${source}!`)
        }
      } else {
        resolve(data);
      }
    })
  }
  
  handleChesscomData(data) {
    let dbuser = data.dbuser;
    let username = data.username;
    let [source, sourceratings] = ["chesscom", "chesscomratings"];
    return new Promise((resolve, reject) => {
      if(username) {
        if(data.chesscom) {
          this.getChesscomDataForUser(username)
          .then((sourceData) => {
            return parseChesscomUserData(sourceData, username, (msg) => {
              reject(msg);
            }, (msg) => {
              reject(msg);
            });
          })
          .then(([ratingData, username]) => {
            if(ratingData) {
              dbuser.lastupdate = Date.now();
              dbuser[source] = username;
              dbuser[sourceratings] = ratingData;
              data.dbuser = dbuser;
              data.successfulupdates += "chess.com, ";
            }
            resolve(data);
          })
          .catch((error) => {
            resolve(data);
            reject(error);
          })
        } else {
          resolve(data);
          reject(`Couldn't connect to ${source}!`)
        }
      } else {
        resolve(data);
      }
    })
  }
  
  handleBughousetestData(data) {
    let dbuser = data.dbuser;
    let username = data.username;
    let [source, sourceratings] = ["bughousetest", "bughousetestratings"];
    return new Promise((resolve, reject) => {
      if(username) {
        if(data.bughousetest) {
          this.getBughousetestDataForUser(username)
          .then((sourceData) => {
            return parseBughousetestUserData(sourceData, (msg) => {
              reject(msg);
            }, (msg) => {
              reject(msg);
            });
          })
          .then((profile) => {
            if(profile) {
              dbuser.lastupdate = Date.now();
              dbuser[source] = profile.username;
              dbuser[sourceratings] = profile.ratings;
              data.dbuser = dbuser;
              data.successfulupdates += "bughousetest, ";
            };
            resolve(data);
          })
          .catch((error) => {
            resolve(data);
            reject(error);
          })
        } else {
          resolve(data);
          reject(`Couldn't connect to ${source}!`);
        }
      } else {
        resolve(data);
      }
    })
  }

  getBughousetestDataForUser(username) {
    if (username === false) return false;
    return new Promise((resolve, reject) => {
      request.get(config.url.bughousetest.user.replace("|", username), (error, response, body) => {
        if(error) {
          return reject(error);
        }
        if (body.length === 0) {
          return reject("Couldn't find **'" + username + "'** on bughousetest.");
        }
        let json = null;
        try {
          json = JSON.parse(body);
        } catch(e) {
          reject(e);
        }
        resolve(json);
      });
    });
  }

  getChesscomDataForUser(username) {
    if (username === false) return false;
    return new Promise((resolve, reject) => {
      request.get(config.url.chesscom.user.replace("|", username), function (error, response, body) {
        if (error) {
          return reject(error);
        }
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(response);
        }
      });
    });
  }

  parseLichessUserData(lichessData, errorCB, modCB) {
    let profile = {};
    if(!lichessData) {
      errorCB("Couldn't find '" + username + "' on Lichess");
      return;
    } else
    if(lichessData.closed) {
      if(!Tracker.closedUsername[lichessData.username.toLowerCase()]) {
        modCB("Account " + lichessData.username + " is closed on Lichess.");
        errorCB("Account " + lichessData.username + " is closed on Lichess.");
      }
      Tracker.closedUsername[lichessData.username.toLowerCase()] = true;
      return;
    }
    let ratings = {};
    ratings.maxRating = 0;
    let lichessusername = lichessData.username;
    let killboolean = true;
    let cheating = null;
    for(let i = 0; i < config.lichessvariants.length; i++) {
      let array = config.lichessvariants[i];
      let variant = array[1];
      let APIpath = lichessData.perfs[array[2]];
      let provisional = `${array[1]}Provisional`;
      if(APIpath) ratings[variant] = APIpath.rating;
      ratings[provisional] = !(APIpath && !APIpath.prov);
      if(ratings[variant] && ratings[provisional] === true) {
        ratings[variant] = ratings[variant] + "?";
      } else
        if(ratings[variant] && ratings[provisional] === false) {
          ratings[variant] = ratings[variant].toString();
          killboolean = false;
          if (ratings.maxRating < ratings[variant]) {
            ratings.maxRating = ratings[variant];
          }
        }
      delete ratings[provisional];
    };
    if(killboolean === true) {
      errorCB("All lichess ratings for " + lichessData.username + " are provisional.");
      return;
    };
    if(lichessData.engine && lichessData.booster) {
      cheating = "Player " + lichessData.username + " (" + config.url.lichess.profile.replace("|", lichessData.username) + ")";
      cheating += " uses chess computer assistance, and artificially increases/decreases their rating.";
    } else
    if (lichessData.engine) {
      cheating = "Player " + lichessData.username + " (" + config.url.lichess.profile.replace("|", lichessData.username) + ")";
      cheating += " uses chess computer assistance.";
    } else
    if (lichessData.booster) {
      cheating = "Player " + lichessData.username + " (" + config.url.lichess.profile.replace("|", lichessData.username) + ")";
      cheating += " artificially increases/decreases their rating.";
    };
    if(cheating) {
      if(!Tracker.cheatedUserID[lichessData.username.toLowerCase()]) {
        modCB(cheating);
        Tracker.cheatedUserID[lichessData.username.toLowerCase()] = true;
      };
      ratings.cheating = true;
    } else {
      delete ratings.cheating;
    };
    profile.ratings = ratings;
    profile.username = lichessusername;
    if(lichessData.profile) {
      profile.country = lichessData.profile.country;
      profile.name = lichessData.profile.firstName + " " + lichessData.profile.lastName;
    };
    profile.language = lichessData.language;
    profile.title = lichessData.title;
    return profile;
  }

  parseBughousetestUserData(bughousetestData, errorCB, modCB) {
    let profile = {};
    if(!bughousetestData) {
      errorCB("Couldn't find '" + username + "' on bughousetest");
      return;
    } else
      if (bughousetestData.closed) {
        if (!Tracker.closedUsername[bughousetestData.username.toLowerCase()]) {
          modCB("Account " + bughousetestData.username + " is closed on bughousetest.");
          errorCB("Account " + bughousetestData.username + " is closed on bughousetest.");
        }
        Tracker.closedUsername[bughousetestData.username.toLowerCase()] = true;
        return;
      }
    let ratings = {};
    ratings.maxRating = 0;
    let bughousetestusername = bughousetestData.username;
    let killboolean = true;
    let cheating = null;
    for (let i = 0; i < config.bughousetestvariants.length; i++) {
      let array = config.bughousetestvariants[i];
      let variant = array[1];
      let APIpath = bughousetestData.perfs[array[2]];
      let provisional = `${array[1]}Provisional`;
      if (APIpath) { ratings[variant] = APIpath.rating };
      ratings[provisional] = !(APIpath && !APIpath.prov);
      if (ratings[variant] && ratings[provisional] === true) {
        ratings[variant] = ratings[variant] + "?";
      } else
        if (ratings[variant] && ratings[provisional] === false) {
          ratings[variant] = ratings[variant].toString();
          killboolean = false;
          if (ratings.maxRating < ratings[variant]) {
            ratings.maxRating = ratings[variant];
          }
        }
      delete ratings[provisional];
    };

    if (killboolean === true) {
      errorCB("All bughousetest ratings for " + bughousetestData.username + " are provisional.");
      return;
    };

    if (bughousetestData.engine && bughousetestData.booster) {
      cheating = "Player " + bughousetestData.username + " (" + config.url.bughousetest.profilereplace("|", bughousetestData.username) + ")";
      cheating += " uses chess computer assistance, and artificially increases/decreases their rating.";
    } else if (bughousetestData.engine) {
      cheating = "Player " + bughousetestData.username + " (" + config.url.bughousetest.profilereplace("|", bughousetestData.username) + ")";
      cheating += " uses chess computer assistance.";
    } else if (bughousetestData.booster) {
      cheating = "Player " + bughousetestData.username + " (" + config.url.bughousetest.profilereplace("|", bughousetestData.username) + ")";
      cheating += " artificially increases/decreases their rating.";
    }
    if (cheating) {
      //Only say once
      if (!Tracker.cheatedUserID[bughousetestData.username.toLowerCase()]) {
        modCB(cheating);
        Tracker.cheatedUserID[bughousetestData.username.toLowerCase()] = true;
      }
    }
    profile.ratings = ratings;
    profile.username = bughousetestusername;
    return profile;
  }

  parseChesscomUserData(chesscomData, username, errorCB) {
    let stats = chesscomData.stats;
    if(!stats) {
      errorCB("Couldn't find **'" + username + "'** on Chess.com.");
      return;
    };
    let ratings = {};
    ratings.maxRating = 0;
    let killboolean = true;
    for (let i = 0; i < config.chesscomvariants.length; i++) {
      let array = config.chesscomvariants[i];
      let variant = array[1];
      let APIpath = array[2];
      let provisional = `${array[1]}Provisional`;
      for (let i = 0; i < stats.length; i++) {
        let obj = stats[i];
        if (obj.key === APIpath) {
          ratings[variant] = obj.stats.rating
          ratings[provisional] = obj.gameCount < 10;
        }
      }
      if (!ratings[provisional]) {
        killboolean = false;
        if (ratings.maxRating < ratings[variant]) {
          ratings.maxRating = ratings[variant];
        }
      };
      if (ratings[variant] && ratings[provisional] === true) {
        ratings[variant] = ratings[variant] + "?";
      } else
        if (ratings[variant] && ratings[provisional] === false) {
          ratings[variant] = ratings[variant].toString();
        }
      delete ratings[provisional];
    };

    if (killboolean === true) {
      errorCB("All chess.com ratings for " + username + " are provisional.");
      return;
    };

    return [ratings, username];
  }

  removeByUser (serverID, source, user, message) {
    this.stopUpdating = true;
    let tally = DataManager.getData();
    if (tally) {
      let users = tally;
      for (id in users) {
        let dbindex = this.getdbindexfromid(user.id)
        let dbuser = users[dbindex];
        let username = users[dbindex][source.toLowerCase()];
        if (username) {
          this.remove(serverID, source, user.id, message);
          return;
        }
      }
    }
    Output.onError("No tracking entry found to remove.");
    this.stopUpdating = false;
  }

  get LeastUpToDateUser() {
    let tally = DataManager.getData();
    let founddbuser = null;
    let currentvalue = Infinity;
    for(let i = 0; i < tally.length; i++) {
      if(Tracker.updatequeue[tally[i].id] && !tally[i].lastupdate) {
        let killboolean = true;
        for(let j = 0; j < config.sources.length; j++) {
          if(tally[i][config.sources[j][1]]) killboolean = false;
        };
        if(!killboolean) {
          currentvalue = 0;
          founddbuser = tally[i];
          break;
        };
      } else 
      if((Tracker.updatequeue[tally[i].id] && tally[i].lastupdate && tally[i].lastupdate < currentvalue && tally[i].lastupdate < Date.now() - 1800000)) {
        let killboolean = true;
        for(let j = 0; j < config.sources.length; j++) {
          if(tally[i][config.sources[j][1]]) killboolean = false;
        };
        if(!killboolean) {
          currentvalue = tally[i].lastupdate || 0;
          founddbuser = tally[i];
        }
      }
    };
    return founddbuser;
  }

};

Tracker.updatequeue = {};
Tracker.closedUsername = {};
Tracker.cheatedUserID = {};

module.exports = Tracker;