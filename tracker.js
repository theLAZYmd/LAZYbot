const config = require("./config.json");
const request = require("request");
const DataManagerConstructor = require("./datamanager.js");
const DataManager = new DataManagerConstructor(config.dataFile);
const LICHESS_USERS_URL = "https://lichess.org/api/users";
const LICHESS_USER_URL = "https://lichess.org/api/user/|";
const BUGHOUSETEST_USERS_URL = "http://bughousetest.com/api/users";
const BUGHOUSETEST_USER_URL = "http://bughousetest.com/api/user/|";
const CHESS_COM_USER_URL = "https://www.chess.com/callback/member/stats/|";
const userUpdates = {};
const closedUsername = {};
const cheatedUserID = {};

function Tracker(events) {
  this.stopUpdating = false;
  this.updating = false;
  this.updateDelay = config.updateDelay;
  this.afterUpdate = [];
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
};

Tracker.prototype.messagelogger = function (message, server) { //section for message logging
  if (message.author.bot) return;
  let user = message.author;
  let dbuser = this.getdbuserfromuser(user);
  let dbindex = this.getdbindexfromdbuser(dbuser)
  if (dbindex === -1) return;
  let tally = DataManager.getData();
  tally[dbindex].messages++;
  if (!message.content.startsWith(server.prefixes.prefix) && !message.content.startsWith(server.prefixes.nadeko)) {
    tally[dbindex].lastmessage = message.content > 500 ? message.content.slice(0, 500).replace("`", "") + "..." : message.content.replace("\`");
    tally[dbindex].lastmessagedate = message.createdTimestamp;
  };
  if (tally == undefined) return;
  DataManager.setData(tally);
};

Tracker.prototype.track = function(serverID, user, source, username, message) {
  if(this.updating) {
    this.afterUpdate.push({
      "type": "track",
      "arguments": arguments
    });
    return;
  }
  this.stopUpdating = true;
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
      let tally = DataManager.getData();
      let dbindex = this.getdbindexfromdbuser(dbuser);
      tally[dbindex] = dbuser;
      DataManager.setData(tally);
      this.onTrackSuccess(serverID, dbuser.id, source, dbuser[source], message);
      userUpdates[user.id] = Date.now();
      this.stopUpdating = false;
    })
    .catch((error) => {
      this.onError(serverID, "Error adding user. " + error, message);
    })
  } else
  if(source === "chesscom") {
    handleChesscomData(dbuser, username)
    .then((dbuser) => {
      let tally = DataManager.getData();
      let dbindex = this.getdbindexfromdbuser(dbuser);
      tally[dbindex] = dbuser;
      DataManager.setData(tally);
      this.onTrackSuccess(serverID, dbuser.id, source, dbuser[source], message);
      userUpdates[user.id] = Date.now();
      this.stopUpdating = false;
    })
    .catch((error) => {
      this.onError(serverID, "Error adding user. " + error, message);
    })
  } else
  if(source === "bughousetest") {
    handleBughousetestData(dbuser, username)
    .then((dbuser) => {
      let tally = DataManager.getData();
      let dbindex = this.getdbindexfromdbuser(dbuser);
      tally[dbindex] = dbuser;
      DataManager.setData(tally);
      this.onTrackSuccess(serverID, dbuser.id, source, dbuser[source], message);
      userUpdates[user.id] = Date.now();
      this.stopUpdating = false;
    })
    .catch((e) => {
      console.log(e, JSON.stringify(e));
    })
  }
};

Tracker.prototype.updateUser = function(message, user) {
  if (!message || !user) return;
  let dbuser = this.getdbuserfromuser(user);
  if (!dbuser.lichess && !dbuser.chesscom && !dbuser.bughousetest) {
    return this.onError(serverID, `No linked accounts found.\nPlease link an account to your profile through \`!lichess\` or \`!chess.com\``, message);
  } else {
    handleLichessData(dbuser, dbuser.lichess)
    .then((dbuser) => {
      handleChesscomData(dbuser, dbuser.chesscom)
      .then((dbuser) => {
        handleBughousetestData(dbuser, dbuser.bughousetest)
        .then((dbuser) => {
          userUpdates[dbuser.id] = Date.now();
          let tally = DataManager.getData();
          let dbindex = this.getdbindexfromdbuser(dbuser);
          tally[dbindex] = dbuser;
          DataManager.setData(tally);
          this.onRatingUpdate(message, user);
        })
        .catch((error) => {
          this.onError(serverID, "Error adding user. " + error.toString());
          console.log(e, JSON.stringify(e));
        })
      })
      .catch((error) => {
        this.onError(serverID, "Error adding user. " + error.toString());
        console.log(e, JSON.stringify(e));
      })
    })
    .catch((error) => {
      this.onError(serverID, "Error adding user. " + error, message);
    })
  };
  return;
};


Tracker.prototype.remove = function (serverID, source, userID, message, nomsg) {
  if (this.updating) {
    this.afterUpdate.push({
      "type": "remove",
      "arguments": arguments
    });
    return;
  }
  this.stopUpdating = true;
  let tally = DataManager.getData();
  let dbindex = this.getdbindexfromid(userID)
  let username = tally[dbindex][source.toLowerCase()];
  let sourceratings = source + "ratings";
  if (username) {
    delete tally[dbindex][source];
    delete tally[dbindex][sourceratings];
    delete userUpdates[userID];
    DataManager.setData(tally);
    this.onRemoveSuccess(serverID, userID, source, username, message);
  } else {
    if (!nomsg) {
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
    .then(([ratingData, username]) => {
      if(ratingData) {
        userUpdates[dbuser.id] = Date.now();
        dbuser[source] = username;
        dbuser[sourceratings] = ratingData;
      }
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
          userUpdates[dbuser.id] = Date.now();
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
      .then(([ratingData, username]) => {
        if(ratingData) {
          userUpdates[dbuser.id] = Date.now();
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
      console.log(BUGHOUSETEST_USER_URL.replace("|", username))
      if (error) {
        return reject(error);
      }
      if (body.length === 0) {
        return reject("Couldn't find **'" + username + "'** on bughousetest.");
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
}

function parseLichessUserData(lichessData, errorCB, modCB) {
  
  if (!lichessData) {
    errorCB("Couldn't find '" + username + "' on Lichess");
    return;
  } else
    if (lichessData.closed) {
      if (!closedUsername[lichessData.username.toLowerCase()]) {
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

  for (let i = 0; i < config.lichessvariants.length; i++) {
    let array = config.lichessvariants[i];
    let variant = array[1];
    let APIpath = lichessData.perfs[array[2]];
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
    errorCB("All lichess ratings for " + lichessData.username + " are provisional.");
    return;
  };

  if (lichessData.engine && lichessData.booster) {
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
  if (cheating) {
    if (!cheatedUserID[lichessData.username.toLowerCase()]) {
      modCB(cheating);
      cheatedUserID[lichessData.username.toLowerCase()] = true;
    }
    ratings.cheating = true;
  } else {
    delete ratings.cheating;
  }
  return [ratings, lichessusername];
}

function parseBughousetestUserData(bughousetestData, errorCB, modCB) {
  if (!bughousetestData) {
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

  return [ratings, bughousetestusername];
}

function parseChesscomUserData(chesscomData, username, errorCB) {
  let stats = chesscomData.stats;
  if (!stats) {
    errorCB("Couldn't find **'" + username + "'** on Chess.com.");
    return;
  }
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

Tracker.prototype.queueForceUpdate = function (userID) {
  delete userUpdates[userID];
};

Tracker.prototype.initUpdateCycle = function () {
  let user = findLeastUpToDateUser();
  if (user && !this.stopUpdating) {
    this.updating = true;
    this.updateUser(user).catch((e) => {
      console.log(e, JSON.stringify(e));
    }).then(() => {
      console.log("Done updating");
      this.updating = false;
      if (this.afterUpdate.length > 0) {
        console.log("After update items found", this.afterUpdate);
        this.stopUpdating = true;
        this.processAfterUpdate()
          .then(() => {
            this.stopUpdating = false;
            setTimeout(() => this.initUpdateCycle(), this.updateDelay);
          }).catch((e) => {
            console.log(e, JSON.stringify(e));
            this.stopUpdating = false;
            setTimeout(() => this.initUpdateCycle(), this.updateDelay);
          });
      } else {
        setTimeout(() => this.initUpdateCycle(), this.updateDelay);
      }
    }).catch((e) => {
      this.updating = false;
      console.log("Error updating", user.id, e, JSON.stringify(e));
      setTimeout(() => this.initUpdateCycle(), this.updateDelay);
    });
  } else {
    setTimeout(() => this.initUpdateCycle(), 100);
  }
};

Tracker.prototype.processAfterUpdate = function () {
  return new Promise((resolve, reject) => {
    let promises = [];
    for (let i = 0; i < this.afterUpdate.length; i++) {
      let item = this.afterUpdate[i];
      if (item.type === "track") {
        promises.push(new Promise((innerResolve, innerReject) => {
          setTimeout(() => {
            let p = this.track.apply(this, item.arguments);
            if (p) {
              p.then(innerResolve).catch(innerReject);
            }
          }, this.updateDelay * (i + 1));
        }));
      } else if (item.type === "remove") {
        promises.push(new Promise((innerResolve, innerReject) => {
          setTimeout(() => {
            this.remove.apply(this, item.arguments);
            innerResolve();
          }, this.updateDelay * (i + 1));
        }));
      }
    }
    this.afterUpdate = [];
    Promise.all(promises).then(resolve).catch(reject);
  });
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
}

function findLeastUpToDateUser() {
  let tally = DataManager.getData();
  let founduserID = null;
  let currentLeastUpdatedValue = Infinity;
  for (let id in tally) {
    let dbindex = this.getdbindexfromid(id)
    let dbuser = tally[dbindex];
    if (closedUsername[dbuser.username.toLowerCase()]) {
      continue;
    }
    if (!userUpdates[id] || userUpdates[id] < currentLeastUpdatedValue) {
      currentLeastUpdatedValue = userUpdates[id] || 0;
      founduserID = id;
    }
  }
  return founduserID;
}



module.exports = Tracker;