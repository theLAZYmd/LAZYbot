const config = require("./config.json");
const guildconfig = require("./guildconfig.json");
const request = require("request");
const DataManagerConstructor = require("./datamanager.js");
const DataManager = new DataManagerConstructor(config.dataFile);
const LICHESS_USERS_URL = "https://lichess.org/api/users";
const LICHESS_USER_URL = "https://lichess.org/api/user/|";
const BUGHOUSETEST_USERS_URL = "https://bughousetest.com/api/users";
const BUGHOUSETEST_USER_URL = "https://bughousetest.com/api/user/|";
const CHESS_COM_USER_URL = "https://www.chess.com/callback/member/stats/|";
const userUpdates = {};
const closedUsername = {};
const cheatedUserID = {};
const dbtemplate = config.template;

function Tracker(events) {
	this.stopUpdating = false;
	this.updating = false;
	this.updateDelay = guildconfig.updateDelay;
	this.onTrackSuccess = events.onTrackSuccess || (() => {});
	this.onRemoveSuccess = events.onRemoveSuccess || (() => {});
	this.onRatingUpdate = events.onRatingUpdate || (() => {});
	this.onError = events.onError || (() => {});
	this.onModError = events.onModError || (() => {});
	this.afterUpdate = [];
};

//section for message logging

Tracker.prototype.messagelogger = function (message) {

	if (message.author.bot) return;
	let user = message.author;
	let dbuser = getdbuserfromuser(user);
	let dbindex = getdbindexfromdbuser(dbuser)
	if (dbindex === -1) return;
	let tally = DataManager.getData();
	tally[dbindex].messages++;
	if (!((message.content.startsWith(guildconfig.prefix)) || (message.content.startsWith(guildconfig.nadekoprefix)))) {
		tally[dbindex].lastmessage = message.content > 500 ? message.content.slice(0, 500).replace("\`") + "..." : message.content.replace("\`");
		tally[dbindex].lastmessagedate = message.createdTimestamp;
	};
	if (tally == undefined) return;
	DataManager.setData(tally);
}

Tracker.prototype.queueForceUpdate = function(userID) {
	delete userUpdates[userID];
};

Tracker.prototype.initUpdateCycle = function() {
	let user = findLeastUpToDateUser();
	if(user && !this.stopUpdating) {
		this.updating = true;
		this.updateUser(user).catch((e) => {
			console.log(e, JSON.stringify(e));
		}).then(() => {
			console.log("Done updating");
			this.updating = false;
			if(this.afterUpdate.length > 0) {
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

Tracker.prototype.processAfterUpdate = function() {
	return new Promise((resolve, reject) => {
		let promises = [];
		for(let i = 0; i < this.afterUpdate.length; i++) {
			let item = this.afterUpdate[i];
			if(item.type === "track") {
				promises.push(new Promise((innerResolve, innerReject) => {
					setTimeout(() => {
						let p = this.track.apply(this, item.arguments);
						if(p) {
							p.then(innerResolve).catch(innerReject);
						}
					}, this.updateDelay * (i+1));
				}));
			} else if(item.type === "remove") {
				promises.push(new Promise((innerResolve, innerReject) => {
					setTimeout(() => {
						this.remove.apply(this, item.arguments);
						innerResolve();
					}, this.updateDelay * (i+1));
				}));
			}
		}
		this.afterUpdate = [];
		Promise.all(promises).then(resolve).catch(reject);
	});
};

Tracker.prototype.track = function(serverID, userID, source, testusername, message) {
	console.log(message.content);
	if(this.updating) {
		this.afterUpdate.push({
			"type": "track",
			"arguments": arguments
		});
		return;
	}
	this.stopUpdating = true;
	testusername = testusername.replace(/[^\w\d]/g, "");
	if(testusername.length === 0) {
		return this.onError(serverID, "Invalid username.", message);
	}
	
	let tally = DataManager.getData();
	let dbindex = getdbindexfromid (userID);
	console.log(message.content);
	
	if(tally[dbindex][source.toLowerCase()]) {
		if(source === "chesscom") {
			source = "chess.com";
		}
		return this.onError(serverID, "Duplicate entry. Already tracked on **" + source + "**.", message);
	}

	if(source === "lichess") {
		getLichessDataForUser(testusername)
		.then((lichessData) => {
			return parseLichessUserData(lichessData, (msg) => {
				this.onError(serverID, msg, message);
			}, (msg) => {
				this.onModError(serverID, msg);
			});
		})
		.then(([ratingData, lichessusername]) => {
			if(ratingData) {
				addUser(serverID, tally, ratingData, source, lichessusername, userID);
				this.onTrackSuccess(serverID, userID, ratingData, source, lichessusername, message);
				userUpdates[userID] = Date.now();
			}
			this.stopUpdating = false;
		})
		.catch((error) => {
			this.stopUpdating = false;
			// this.onError(serverID, "Error adding user. " + error.toString(), message);
		});
	} else if(source === "chesscom") {
		getChesscomDataForUser(testusername)
		.then((chesscomData) => {
			console.log(message.content);
			return parseChesscomUserData(chesscomData, testusername, (msg) => {
				this.onError(serverID, msg, message);
			});
		})
		.then(([ratingData, chesscomusername]) => {
			if(ratingData) {
				addUser(serverID, tally, ratingData, source, chesscomusername, userID);
				this.onTrackSuccess(serverID, userID, ratingData, source, chesscomusername, message);
				userUpdates[userID] = Date.now();
			}
			this.stopUpdating = false;
		})
		.catch((error) => {
			this.stopUpdating = false;
			this.onError(serverID, "Error adding user. " + error.toString(), message);
		});
	}
};

Tracker.prototype.remove = function(serverID, source, userID, message, nomsg) {
	if(this.updating) {
		this.afterUpdate.push({
			"type": "remove",
			"arguments": arguments
		});
		return;
	}
	this.stopUpdating = true;
	let tally = DataManager.getData();
	let dbindex = getdbindexfromid (userID)
	let username = tally[dbindex][source.toLowerCase()];
	if(username) {
		tally[dbindex][source.toLowerCase()] = "";
		delete userUpdates[userID];
		DataManager.setData(tally);
		this.onRemoveSuccess(serverID, userID, source, username, message);
	} else {
		if(!nomsg) {
			this.onError(serverID, "No tracking entry found to remove.", message);
		}
	}
	this.stopUpdating = false;
};

Tracker.prototype.removeByUser = function(serverID, source, user, message) {
	this.stopUpdating = true;
	let tally = DataManager.getData();
	if (tally) {
		let users = tally;
		for(id in users) {
			let dbindex = getdbindexfromid(user.id)
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
	for(let id in tally) {
		let dbindex = getdbindexfromid(id)
		let dbuser = tally[dbindex];
		if(closedUsername[dbuser.username.toLowerCase()]) {
			continue;
		}
		if(!userUpdates[id] || userUpdates[id] < currentLeastUpdatedValue) {
			currentLeastUpdatedValue = userUpdates[id] || 0;
			founduserID = id;
		}
	}
	return founduserID;
}

Tracker.prototype.updateUser = function(user) {
	let tally = DataManager.getData();
	let dbindex = getdbindexfromid(user.id)
	let username = tally[dbindex].username;
	for (i = 0; i < config.sources.length; i++) {
		let source = config.sources[i].toLowerCase().replace(".","");
		if(dbindex[source]) {
			if (source === "lichess") {
				console.log("Updating", username, "on", source);
				return getLichessDataForUser(username)
				.then((lichessData) => {
					return parseLichessUserData(lichessData, (msg) => {
						this.onError(serverID, msg, message);
					}, (msg) => {
						this.onModError(serverID, msg);
					});
				})
				.then(([ratingData, lichessusername]) => {
					if(ratingData) {
						userUpdates[userID] = Date.now();
						this.onRatingUpdate(serverID, userID, tally[`${source}ratings`], ratingData, source, lichessusername);
						tally[dbindex][`${source}ratings`] = ratingData;
						DataManager.setData(tally);
					}
				})
			} else if(source.toLowerCase() === "chesscom") {
				return getChesscomDataForUser(username)
				.then((chesscomData) => {
					return parseChesscomUserData(chesscomData, username, (msg) => {
						this.onError(serverID, msg, message);
					});
				})
				.then((ratingData) => {
					if(ratingData) {
						userUpdates[userID] = Date.now();
						this.onRatingUpdate(serverID, userID, tally[`${source}ratings`], ratingData, source, username);
						tally[dbindex].ratings = ratingData;
						DataManager.setData(tally);
					}
				})
		}}}
}

function getChesscomDataForUser(username) {
	return new Promise(function(resolve, reject) {
		request.get(CHESS_COM_USER_URL.replace("|", username), function(error, response, body) {
			if(error) {
				return reject(error);
			}
			try {
				resolve(JSON.parse(body));
			} catch(e) {
				reject(response);
			}
		});
	});
}

function getLichessDataForUser(username) {
	return new Promise((resolve, reject) => {
		request.get(LICHESS_USER_URL.replace("|", username), (error, response, body) => {
			if(error) {
				return reject(error);
			}
			if(body.length === 0) {
				return reject("Couldn't find '" + username + "' on Lichess.");	
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

function parseLichessUserData(lichessData, errorCB, modCB) {
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

	for (let i = 0; i < config.lichessvariants.length; i++) {
		let array = config.lichessvariants[i];
		let variant = array[1];
		let APIpath = lichessData.perfs[array[2]];
		let provisional = `${array[1]}Provisional`;
		ratings[variant] = APIpath ? APIpath.rating : "" ;
		ratings[provisional] = !(APIpath && !APIpath.prov);
		if (!ratings[provisional]) {
			killboolean = false;
			if(ratings.maxRating < ratings[variant]) {
				ratings.maxRating = ratings[variant];
			}
		};	
	};

	console.log(killboolean);
	if (killboolean === true) {
		errorCB("All lichess ratings for " + lichessData.username + " are provisional.");
		return;
	};

	if(lichessData.engine && lichessData.booster) {
		cheating = "Player " + lichessData.username + " (" + config.lichessProfileURL.replace("|", lichessData.username) + ")";
		cheating += " uses chess computer assistance, and artificially increases/decreases their rating.";
	} else if(lichessData.engine) {
		cheating = "Player " + lichessData.username + " (" + config.lichessProfileURL.replace("|", lichessData.username) + ")";
		cheating += " uses chess computer assistance.";
	} else if(lichessData.booster) {
		cheating = "Player " + lichessData.username + " (" + config.lichessProfileURL.replace("|", lichessData.username) + ")";
		cheating += " artificially increases/decreases their rating.";
	}
	if(cheating) {
		//Only say once
		if(!cheatedUserID[lichessData.username.toLowerCase()]) {
			modCB(cheating);
			cheatedUserID[lichessData.username.toLowerCase()] = true;
		}
	}

	return [ratings, lichessusername];
}

function parseChesscomUserData(chesscomData, username, errorCB) {
	let stats = chesscomData.stats;
	console.log(stats);
	if(!stats) {
		errorCB("Couldn't find '" + username + "' on Chess.com.");
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
		for(let i = 0; i < stats.length; i++) {
			let obj = stats[i];
			if(obj.key === APIpath) {
				ratings[variant] = obj.stats.rating
				ratings[provisional] = obj.gameCount < 10;
			}
		}
		if (!ratings[provisional]) {
			console.log(ratings.maxRating)
			console.log(ratings[variant])
			killboolean = false;
			if(ratings.maxRating < ratings[variant]) {
				ratings.maxRating = ratings[variant];
			}
		};	
	};

	console.log(killboolean);
	if (killboolean === true) {
		errorCB("All chess.com ratings for " + username + " are provisional.");
		return;
	};

	return [ratings, username];
}

function addUser(serverID, tally, ratingData, source, sourceusername, userID) {
	let dbindex = getdbindexfromid (userID)
	tally[dbindex] = tally[dbindex] || {};
	let sourceratingData = source + "ratings"
	tally[dbindex][sourceratingData] = ratingData;
	tally[dbindex][source.toLowerCase()] = sourceusername;
	DataManager.setData(tally);
}

function getdbuserfromusername (username) {
	let tally = DataManager.getData();
	let dbuser = tally.find(dbuser => username == dbuser.username);
	return dbuser;
  };
  
function getdbindexfromdbuser (dbuser) {
	let tally = DataManager.getData();
	let index = tally.findIndex(index => dbuser.id === index.id)
	return index;
	};

function getdbindexfromid (id) {
	let tally = DataManager.getData();
	let index = tally.findIndex(index => id === index.id)
	return index;
	};

function getdbuserfromuser(user) {
	let tally = DataManager.getData();
	let dbuser = tally.find(dbuser => user.id == dbuser.id);
	if (dbuser == null) {
		console.log("No dbuser found, creating one...");
		let newuser = dbtemplate;
		newuser.id = user.id;
		newuser.username = user.username;
		tally.push (newuser);
		DataManager.setData(tally);
		console.log("User " + newuser.username + " has been logged in the database!");
	};
	newdbuser = tally.find(dbuser => user.id == dbuser.id);
	return dbuser ? dbuser : newdbuser;
	
	};


module.exports = Tracker;