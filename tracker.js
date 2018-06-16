const config = require("./config.json");
const request = require("request");
const DataManagerConstructor = require("./datamanager.js");
const DataManager = new DataManagerConstructor(config.dataFile);
const LICHESS_USERS_URL = "https://lichess.org/api/users";
const LICHESS_USER_URL = "https://lichess.org/api/user/|";
const BUGHOUSETEST_USERS_URL = "http://bughousetest.com/api/users";
const BUGHOUSETEST_USER_URL = "http://bughousetest.com/api/user/|";
const CHESS_COM_USER_URL = "https://www.chess.com/callback/member/stats/|";
const closedUsername = {};
const cheatedUserID = {};
let updatequeue = {};

function Tracker(events) {
  this.stopUpdating = false;
  this.updating = false;
  this.updateDelay = config.updateDelay;
  this.onTrackSuccess = events.onTrackSuccess;
  this.onRemoveSuccess = events.onRemoveSuccess;
  this.onRatingUpdate = events.onRatingUpdate;
  this.onError = events.onError;
  this.onModError = events.onModError;
  this.getdbuserfromuser = events.getdbuserfromuser;
  this.getdbindexfromdbuser = events.getdbindexfromdbuser;
  this.getdbindexfromid = events.getdbindexfromid;
  this.getdbuserfromusername = events.getdbuserfromusername;
  this.getsourcetitle = events.getsourcetitle;
  this.getsourcefromtitle = events.getsourcefromtitle;
  this.getonlinemembers = events.getonlinemembers;
};

Tracker.prototype.updatepresence = function(member, nowonline) {
  if(nowonline === true) {
    updatequeue[member.id] = true;
  } else
  if(nowonline === false) {
    delete updatequeue[member.id];
  }
};

Tracker.prototype.messagelogger = function(message, server) { //section for message logging
  if(message.author.bot) return;
  let user = message.author;
  let dbuser = this.getdbuserfromuser(user);
  let dbindex = this.getdbindexfromdbuser(dbuser)
  if (dbindex === -1) return;
  let tally = DataManager.getData();
  tally[dbindex].messages++;
  if(!message.content.startsWith(server.prefixes.prefix) && !message.content.startsWith(server.prefixes.nadeko)) {
    tally[dbindex].lastmessage = message.content > 500 ? message.content.slice(0, 500).replace("`", "") + "..." : message.content.replace("\`");
    tally[dbindex].lastmessagedate = message.createdTimestamp;
    if(tally[dbindex].username !== user.tag) tally[dbindex].username = user.tag; 
  };
  DataManager.setData(tally);
};

Tracker.prototype.track = function(serverID, user, source, username, message) {
  username = username.replace(/["`']+/g, "");
  if (username.length < 2) {
    return this.onError(serverID, "Invalid username.", message);
  };
  let dbuser = this.getdbuserfromuser(user);
  if(dbuser[source]) {
    let sourcetitle = this.getsourcetitle(source);
    return this.onError(serverID, `Duplicate from **${sourcetitle}**. You have already linked **${dbuser[source]}** to your profile.\nUse \`!remove [${source}]\` to unlink your account.`, message);
  }
  if(source === "lichess") {
    handleLichessData(dbuser, username)
    .then((dbuser) => {
      this.stopUpdating = true;
      let tally = DataManager.getData();
      let dbindex = this.getdbindexfromdbuser(dbuser);
      tally[dbindex] = dbuser;
      DataManager.setData(tally);
      this.onTrackSuccess(serverID, dbuser.id, source, dbuser[source], message);
      dbuser.lastupdate = Date.now();
      this.stopUpdating = false;
    })
    .catch((error) => {
      this.onError(serverID, "Error adding user. " + error, message);
    })
  } else
  if(source === "chesscom") {
    handleChesscomData(dbuser, username)
    .then((dbuser) => {
      this.stopUpdating = true;
      let tally = DataManager.getData();
      let dbindex = this.getdbindexfromdbuser(dbuser);
      tally[dbindex] = dbuser;
      DataManager.setData(tally);
      this.onTrackSuccess(serverID, dbuser.id, source, dbuser[source], message);
      dbuser.lastupdate = Date.now();
      this.stopUpdating = false;
    })
    .catch((error) => {
      this.onError(serverID, "Error adding user. " + error, message);
    })
  } else
  if(source === "bughousetest") {
    handleBughousetestData(dbuser, username)
    .then((dbuser) => {
      this.stopUpdating = true;
      let tally = DataManager.getData();
      let dbindex = this.getdbindexfromdbuser(dbuser);
      tally[dbindex] = dbuser;
      DataManager.setData(tally);
      this.onTrackSuccess(serverID, dbuser.id, source, dbuser[source], message);
      dbuser.lastupdate = Date.now();
      this.stopUpdating = false;
    })
    .catch((e) => {
      this.onError(serverID, "Error adding user. " + error, message);
    })
  }
};

Tracker.prototype.updateUser = function(message, user) {
  let dbuser = message ? this.getdbuserfromuser(user) : user;
  let serverID = message ? message.guild.id : "";
  if(!dbuser.lichess && !dbuser.chesscom && !dbuser.bughousetest) {
    this.onError(serverID, `No linked accounts found.\nPlease link an account to your profile through \`!lichess\` or \`!chess.com\``, message);
    return;
  } else {
    handleLichessData(dbuser, dbuser.lichess)
    .then((dbuser) => {
      handleChesscomData(dbuser, dbuser.chesscom)
      .then((dbuser) => {
        handleBughousetestData(dbuser, dbuser.bughousetest)
        .then((dbuser) => {
          this.stopUpdating = true;
          dbuser.lastupdate = Date.now();
          let tally = DataManager.getData();
          let dbindex = this.getdbindexfromdbuser(dbuser);
          tally[dbindex] = dbuser;
          DataManager.setData(tally);
          console.log(`Updated ${dbuser.username} on ${dbuser.lichess ? `lichess, ` : ``}${dbuser.chesscom ? `chess.com, ` : ``}${dbuser.bughousetest ? `bughousetest, ` : ``}with no errors.`);
          if(message) this.onRatingUpdate(message, user);
          this.stopUpdating = false;
        })
        .catch((error) => {
          this.onError(serverID, "Error adding user. " + error, message);
        })
      })
      .catch((error) => {
        this.onError(serverID, "Error adding user. " + error, message);
      })
    })
    .catch((error) => {
      this.onError(serverID, "Error adding user. " + error, message);
    })
  };
  return;
};

Tracker.prototype.buildUpdateQueue = function() {
  let onlinemembers = this.getonlinemembers();
  onlinemembers.forEach(function(member) {
    updatequeue[member.id] = true;
  })
  return updatequeue;
};

Tracker.prototype.initUpdateCycle = function() {
  let dbuser = findLeastUpToDateUser();
  if(dbuser && !this.stopUpdating) {
    this.updating = true;
    this.updateUser(false, dbuser);
    setTimeout(() => this.initUpdateCycle(), 15000);
  } else {
    setTimeout(() => this.initUpdateCycle(), 15000);
  }
};

function findLeastUpToDateUser() {
  let tally = DataManager.getData();
  let founddbuser = null;
  let currentvalue = Infinity;
  for(let i = 0; i < tally.length; i++) {
    if(updatequeue[tally[i].id] && !tally[i].lastupdate) {
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
    if((updatequeue[tally[i].id] && tally[i].lastupdate && tally[i].lastupdate < currentvalue && tally[i].lastupdate < Date.now() - 1800000)) {
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
};

Tracker.prototype.remove = function (serverID, source, userID, message, nomsg) {
  this.stopUpdating = true;
  let tally = DataManager.getData();
  let dbindex = this.getdbindexfromid(userID)
  let username = tally[dbindex][source.toLowerCase()];
  let sourceratings = source + "ratings";
  if (username) {
    delete tally[dbindex][source];
    delete tally[dbindex][sourceratings];
    DataManager.setData(tally);
    this.onRemoveSuccess(serverID, userID, source, username, message);
  } else {
    if(!nomsg) {
      this.onError(serverID, "No tracking entry found to remove.", message);
    }
  }
  this.stopUpdating = false;
};

function handleLichessData(dbuser, username) {
  let [source, sourceratings] = ["lichess", "lichessratings"];
  return new Promise((resolve, reject) => {
    if(!username) {
      resolve(dbuser);
    };
    getLichessDataForUser(username)
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
        dbuser.title = profile.title;
        dbuser[sourceratings] = profile.ratings;
      };
      resolve(dbuser);
    })
    .catch((error) => {
      reject(error.toString());
    })
  })
};

function handleChesscomData(dbuser, username) {
  let [source, sourceratings] = ["chesscom", "chesscomratings"];
  return new Promise((resolve, reject) => {
    if(!username) {
      resolve(dbuser);
    } else {
      getChesscomDataForUser(username)
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
        }
        resolve(dbuser);
      })
      .catch((error) => {
        reject(error);
      })
    }
  })
};

function handleBughousetestData(dbuser, username, retError) {
  let [source, sourceratings] = ["bughousetest", "bughousetestratings"];
  return new Promise((resolve, reject) => {
    if(!username) {
      resolve(dbuser);
    } else {
      getBughousetestDataForUser(username)
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
        };
        resolve(dbuser);
      })
      .catch((error) => {
        reject(error);
      })
    }
  })
};

function getLichessDataForUser(username) {
  return new Promise((resolve, reject) => {
    if (username === false) return reject("Invalid username.");
    request.get(LICHESS_USER_URL.replace("|", username), (error, response, body) => {
      if (error) {
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
};

function getBughousetestDataForUser(username) {
  if (username === false) return false;
  return new Promise((resolve, reject) => {
    request.get(BUGHOUSETEST_USER_URL.replace("|", username), (error, response, body) => {
      if (error) {
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
};

function getChesscomDataForUser(username) {
  if (username === false) return false;
  return new Promise(function (resolve, reject) {
    request.get(CHESS_COM_USER_URL.replace("|", username), function (error, response, body) {
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
};

function parseLichessUserData(lichessData, errorCB, modCB) {
  let profile = {};
  if(!lichessData) {
    errorCB("Couldn't find '" + username + "' on Lichess");
    return;
  } else
  if(lichessData.closed) {
    if(!closedUsername[lichessData.username.toLowerCase()]) {
      modCB("Account " + lichessData.username + " is closed on Lichess.");
      errorCB("Account " + lichessData.username + " is closed on Lichess.");
    }
    closedUsername[lichessData.username.toLowerCase()] = true;
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
    cheating = "Player " + lichessData.username + " (" + config.lichessProfileURL.replace("|", lichessData.username) + ")";
    cheating += " uses chess computer assistance, and artificially increases/decreases their rating.";
  } else
  if (lichessData.engine) {
    cheating = "Player " + lichessData.username + " (" + config.lichessProfileURL.replace("|", lichessData.username) + ")";
    cheating += " uses chess computer assistance.";
  } else
  if (lichessData.booster) {
    cheating = "Player " + lichessData.username + " (" + config.lichessProfileURL.replace("|", lichessData.username) + ")";
    cheating += " artificially increases/decreases their rating.";
  };
  if(cheating) {
    if(!cheatedUserID[lichessData.username.toLowerCase()]) {
      modCB(cheating);
      cheatedUserID[lichessData.username.toLowerCase()] = true;
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
};

function parseBughousetestUserData(bughousetestData, errorCB, modCB) {
  let profile = {};
  if(!bughousetestData) {
    errorCB("Couldn't find '" + username + "' on bughousetest");
    return;
  } else
    if (bughousetestData.closed) {
      if (!closedUsername[bughousetestData.username.toLowerCase()]) {
        modCB("Account " + bughousetestData.username + " is closed on bughousetest.");
        errorCB("Account " + bughousetestData.username + " is closed on bughousetest.");
      }
      closedUsername[bughousetestData.username.toLowerCase()] = true;
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
    cheating = "Player " + bughousetestData.username + " (" + config.bughousetestProfileURL.replace("|", bughousetestData.username) + ")";
    cheating += " uses chess computer assistance, and artificially increases/decreases their rating.";
  } else if (bughousetestData.engine) {
    cheating = "Player " + bughousetestData.username + " (" + config.bughousetestProfileURL.replace("|", bughousetestData.username) + ")";
    cheating += " uses chess computer assistance.";
  } else if (bughousetestData.booster) {
    cheating = "Player " + bughousetestData.username + " (" + config.bughousetestProfileURL.replace("|", bughousetestData.username) + ")";
    cheating += " artificially increases/decreases their rating.";
  }
  if (cheating) {
    //Only say once
    if (!cheatedUserID[bughousetestData.username.toLowerCase()]) {
      modCB(cheating);
      cheatedUserID[bughousetestData.username.toLowerCase()] = true;
    }
  }
  profile.ratings = ratings;
  profile.username = bughousetestusername;
  return profile;
};

function parseChesscomUserData(chesscomData, username, errorCB) {
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
};

Tracker.prototype.removeByUser = function (serverID, source, user, message) {
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
  this.onError(serverID, "No tracking entry found to remove.", message);
  this.stopUpdating = false;
};

module.exports = Tracker;