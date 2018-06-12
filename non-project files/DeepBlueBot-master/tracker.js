const settings = require("./settings.js");
const request = require("request");
const DataManagerConstructor = require("./datamanager.js");
const DataManager = new DataManagerConstructor(settings.dataFile);
const LICHESS_USERS_URL = "https://lichess.org/api/users";
const LICHESS_USER_URL = "https://lichess.org/api/user/|";
const CHESS_COM_USER_URL = "https://www.chess.com/callback/member/stats/|";
const userUpdates = {};
const closedUsername = {};
const cheatedUserID = {};

function Tracker(events) {
	this.stopUpdating = false;
	this.updating = false;
	this.updateDelay = settings.updateDelay;
	this.onTrackSuccess = events.onTrackSuccess || (() => {});
	this.onRemoveSuccess = events.onRemoveSuccess || (() => {});
	this.onRatingUpdate = events.onRatingUpdate || (() => {});
	this.onError = events.onError || (() => {});
	this.onModError = events.onModError || (() => {});
	this.afterUpdate = [];
}

Tracker.prototype.queueForceUpdate = function(userID) {
	delete userUpdates[userID];
};

Tracker.prototype.initUpdateCycle = function() {
	let userData = findLeastUpToDateUser();
	if(userData && !this.stopUpdating) {
		this.updating = true;
		this.updateUser(userData).catch((e) => {
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
			console.log("Error updating", userData, e, JSON.stringify(e));
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

Tracker.prototype.track = function(serverID, userID, source, username) {
	if(this.updating) {
		this.afterUpdate.push({
			"type": "track",
			"arguments": arguments
		});
		return;
	}
	this.stopUpdating = true;
	username = username.replace(/[^\w\d]/g, "");
	if(username.length === 0) {
		return this.onError(serverID, "Invalid username.");
	}
	
	let data = DataManager.getData();
	
	if(data[serverID] && data[serverID][userID]) {
		let source = data[serverID][userID].source;
		if(source === "Chesscom") {
			source = "Chess.com";
		}
		return this.onError(serverID, "Duplicate entry. Already tracked on " + source + ".");
	}

	if(source === "Lichess") {
		getLichessDataForUser(username)
		.then((lichessData) => {
			return parseLichessUserData(lichessData, (msg) => {
				this.onError(serverID, msg);
			}, (msg) => {
				this.onModError(serverID, msg);
			});
		})
		.then((ratingData) => {
			if(ratingData) {
				addUser(serverID, data, ratingData, source, username, userID);
				this.onTrackSuccess(serverID, userID, ratingData, source, username);
				userUpdates[userID] = Date.now();
			}
			this.stopUpdating = false;
		})
		.catch((error) => {
			this.stopUpdating = false;
			this.onError(serverID, "Error adding user. " + error.toString());
		});
	} else if(source === "Chesscom") {
		getChesscomDataForUser(username)
		.then((chesscomData) => {
			return parseChesscomUserData(chesscomData, username, (msg) => {
				this.onError(serverID, msg);
			});
		})
		.then((ratingData) => {
			if(ratingData) {
				addUser(serverID, data, ratingData, source, username, userID);
				this.onTrackSuccess(serverID, userID, ratingData, source, username);
				userUpdates[userID] = Date.now();
			}
			this.stopUpdating = false;
		})
		.catch((error) => {
			this.stopUpdating = false;
			this.onError(serverID, "Error adding user. " + error.toString());
		});
	}
};

Tracker.prototype.remove = function(serverID, userID, nomsg) {
	if(this.updating) {
		this.afterUpdate.push({
			"type": "remove",
			"arguments": arguments
		});
		return;
	}
	this.stopUpdating = true;
	let data = DataManager.getData();
	if(data[serverID] && data[serverID][userID]) {
		let username = data[serverID][userID].username;
		delete data[serverID][userID];
		delete userUpdates[userID];
		DataManager.setData(data);
		this.onRemoveSuccess(serverID, userID, username);
	} else {
		if(!nomsg) {
			this.onError(serverID, "No tracking entry found to remove.");
		}
	}
	this.stopUpdating = false;
};

Tracker.prototype.removeByUsername = function(serverID, source, username) {
	this.stopUpdating = true;
	let data = DataManager.getData();
	if(data[serverID]) {
		let users = data[serverID];
		for(userID in users) {
			let user = users[userID];
			if(user.username.toLowerCase() === username.toLowerCase() && 
				source.toLowerCase() === user.source.toLowerCase()) {
				this.remove(serverID, userID);
				return;
			}
		}
	}
	this.onError(serverID, "No tracking entry found to remove.");
	this.stopUpdating = false;
}

function findLeastUpToDateUser() {
	let data = DataManager.getData();
	let foundUserData = null;
	let currentLeastUpdatedValue = Infinity;
	for(let serverID in data) {
		for(let userID in data[serverID]) {
			let userData = data[serverID][userID];
			if(closedUsername[userData.username.toLowerCase()]) {
				continue;
			}
			if(!userUpdates[userID] || userUpdates[userID] < currentLeastUpdatedValue) {
				currentLeastUpdatedValue = userUpdates[userID] || 0;
				foundUserData = {
					"userID": userID,
					"serverID": serverID
				};
			}
		}
	}
	return foundUserData;
}

Tracker.prototype.updateUser = function(userData) {
	let serverID = userData.serverID;
	let userID = userData.userID;
	let data = DataManager.getData();
	let source = data[serverID][userID].source;
	let username = data[serverID][userID].username;
	console.log("Updating", username, "on", source);
	if(source.toLowerCase() === "lichess") {
		return getLichessDataForUser(username)
		.then((lichessData) => {
			return parseLichessUserData(lichessData, (msg) => {
				this.onError(serverID, msg);
			}, (msg) => {
				this.onModError(serverID, msg);
			});
		})
		.then((ratingData) => {
			if(ratingData) {
				userUpdates[userID] = Date.now();
				this.onRatingUpdate(serverID, userID, data.ratings, ratingData, source, username);
				data[serverID][userID].ratings = ratingData;
				DataManager.setData(data);
			}
		})
	} else if(source.toLowerCase() === "chesscom") {
		return getChesscomDataForUser(username)
		.then((chesscomData) => {
			return parseChesscomUserData(chesscomData, username, (msg) => {
				this.onError(serverID, msg);
			});
		})
		.then((ratingData) => {
			if(ratingData) {
				userUpdates[userID] = Date.now();
				this.onRatingUpdate(serverID, userID, data.ratings, ratingData, source, username);
				data[serverID][userID].ratings = ratingData;
				DataManager.setData(data);
			}
		})
	}
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

function parseLichessUserData(data, errorCB, modCB) {
	if(data.closed) {
		if(!closedUsername[data.username.toLowerCase()]) {
			modCB("Account " + data.username + " is closed on Lichess.");
			errorCB("Account " + data.username + " is closed on Lichess.");
		}
		closedUsername[data.username.toLowerCase()] = true;
		return;
	}

	let classical = data.perfs.classical.rating;
	let classicalProvisional = data.perfs.classical.prov === true;
	let rapid = data.perfs.rapid.rating;
	let rapidProvisional = data.perfs.rapid.prov === true;
	let blitz = data.perfs.blitz.rating;
	let blitzProvisional = data.perfs.blitz.prov === true;
	let bullet = data.perfs.bullet.rating;
	let bulletProvisional = data.perfs.bullet.prov === true;

	let ratings = {};

	if(classicalProvisional && blitzProvisional && bulletProvisional && rapidProvisional) {
		errorCB("All, classical, rapid, blitz and bullet ratings for " + data.username + " are provisional.");
		return;
	}

	let cheating = null;
	if(data.engine && data.booster) {
		cheating = "Player " + data.username + " (" + settings.lichessProfileURL.replace("|", data.username) + ")";
		cheating += " uses chess computer assistance, and artificially increases/decreases their rating.";
	} else if(data.engine) {
		cheating = "Player " + data.username + " (" + settings.lichessProfileURL.replace("|", data.username) + ")";
		cheating += " uses chess computer assistance.";
	} else if(data.booster) {
		cheating = "Player " + data.username + " (" + settings.lichessProfileURL.replace("|", data.username) + ")";
		cheating += " artificially increases/decreases their rating.";
	}
	if(cheating) {
		//Only say once
		if(!cheatedUserID[data.username.toLowerCase()]) {
			modCB(cheating);
			cheatedUserID[data.username.toLowerCase()] = true;
		}
	}

	if(!classicalProvisional) {
		ratings.classical = classical;
		ratings.maxRating = ratings.maxRating || classical;
		if(ratings.maxRating < classical) {
			ratings.maxRating = classical;
		}
	}
	if(!rapidProvisional) {
		ratings.rapid = rapid;
		ratings.maxRating = ratings.maxRating || rapid;
		if(ratings.maxRating < rapid) {
			ratings.maxRating = rapid;
		}
	}
	if(!blitzProvisional) {
		ratings.blitz = blitz;
		ratings.maxRating = ratings.maxRating || blitz;
		if(ratings.maxRating < blitz) {
			ratings.maxRating = blitz;
		}
	}
	if(!bulletProvisional) {
		ratings.bullet = bullet;
		ratings.maxRating = ratings.maxRating || bullet;
		if(ratings.maxRating < bullet) {
			ratings.maxRating = bullet;
		}
	}

	return ratings;
}

function parseChesscomUserData(data, username, errorCB) {
	let rapid = null;
	let rapidProvisional = true;
	let blitz = null;
	let blitzProvisional = true;
	let bullet = null;
	let bulletProvisional = true;
	let stats = data.stats;

	if(!stats) {
		errorCB("Couldn't find '" + username + "' on Chess.com.");
		return;
	}

	for(let i = 0; i < stats.length; i++) {
		let obj = stats[i];
		if(obj.key === "lightning") {
			blitz = obj.stats.rating;
			blitzProvisional = obj.gameCount < 10;
		} else if(obj.key === "rapid") {
			rapid = obj.stats.rating;
			rapidProvisional = obj.gameCount < 10;
		} else if(obj.key === "bullet") {
			bullet = obj.stats.rating;
			bulletProvisional = obj.gameCount < 10;
		}
	}

	let ratings = {};

	if(rapidProvisional && blitzProvisional && bulletProvisional) {
		errorCB("All, rapid, blitz and bullet ratings for " + username + " are provisional.");
		return;
	}

	if(!rapidProvisional) {
		ratings.rapid = rapid;
		ratings.maxRating = ratings.maxRating || rapid;
		if(ratings.maxRating < rapid) {
			ratings.maxRating = rapid;
		}
	}
	if(!blitzProvisional) {
		ratings.blitz = blitz;
		ratings.maxRating = ratings.maxRating || blitz;
		if(ratings.maxRating < blitz) {
			ratings.maxRating = blitz;
		}
	}
	if(!bulletProvisional) {
		ratings.bullet = bullet;
		ratings.maxRating = ratings.maxRating || bullet;
		if(ratings.maxRating < bullet) {
			ratings.maxRating = bullet;
		}
	}

	return ratings;
}

function addUser(serverID, data, ratingData, source, username, userID) {
	data[serverID] = data[serverID] || {};
	data[serverID][userID] = data[serverID][userID] || {};
	data[serverID][userID].username = username;
	data[serverID][userID].source = source;
	data[serverID][userID].ratings = ratingData;
	DataManager.setData(data);
}

module.exports = Tracker;