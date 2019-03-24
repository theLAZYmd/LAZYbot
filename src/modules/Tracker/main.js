const settings = require("../../settings");
const request = require("request");
const DataManagerConstructor = require("../../util/datamanager");
const DataManager = new DataManagerConstructor(settings.dataFile);
const LICHESS_USERS_URL = "https://lichess.org/api/users";
const LICHESS_USER_URL = "https://lichess.org/api/user/|";
const CHESS_COM_USER_URL = "https://www.chess.com/callback/member/stats/|";
const closedUsername = {};
const cheatedUserID = {};

class Tracker {

	constructor(client, events) {
		this.stopUpdating = false;
		this.updating = false;
		this.client = client;
		this.updateDelay = settings.updateDelay;
		this.onTrackSuccess = events.onTrackSuccess || (() => {});
		this.onRemoveSuccess = events.onRemoveSuccess || (() => {});
		this.onRatingUpdate = events.onRatingUpdate || (() => {});
		this.onError = events.onError || (() => {});
		this.onModError = events.onModError || (() => {});
		this.afterUpdate = [];
	}

	static async log(author, source) {
		try {
			let time = Date.getISOtime(Date.now()).slice(0, 24);
			console.log(time + " | " + author + " | " + "Tracker" + " | " + "update" + " | [" + source + "]");
			return "";
		} catch (e) {
			if (e) console.log(e);
		}
	}

	queueForceUpdate(serverID, userID) {
		let data = DataManager.getData();
		if (data[serverID][userID].lastupdate) delete data[serverID][userID].lastupdate;
		DataManager.setData(data);
	};

	initUpdateCycle() {
		let userData = Tracker.findLeastUpToDateUser();
		if (userData && !this.stopUpdating) {
			this.updating = true;
			this.updateUser(userData).catch((e) => {
				console.log(e, JSON.stringify(e));
			}).then(() => {
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
				console.log("Error updating", userData, e, JSON.stringify(e));
				setTimeout(() => this.initUpdateCycle(), this.updateDelay);
			});
		} else {
			setTimeout(() => this.initUpdateCycle(), 100);
		}
	};

	processAfterUpdate() {
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

	track(serverID, userID, source, username) {
		if (this.updating) {
			this.afterUpdate.push({
				"type": "track",
				"arguments": arguments
			});
			return;
		}
		username = username.replace(/[^\w\d-]/g, "");
		if (username.length === 0) {
			return this.onError(serverID, "Invalid username.");
		}

		let data = DataManager.getData();

		if (data[serverID] && data[serverID][userID]) {
			let source = data[serverID][userID].source;
			if (source === "Chesscom") {
				source = "Chess.com";
			}
			return this.onError(serverID, "Duplicate entry. Already tracked on " + source + ".");
		}
		this.stopUpdating = true;
		if (source === "Lichess") {
			Tracker.getLichessDataForUser(username)
				.then((lichessData) => {
					return Tracker.parseLichessUserData(lichessData, (msg) => {
						this.onError(serverID, msg);
					}, (msg) => {
						this.onModError(serverID, msg);
					});
				})
				.then((ratingData) => {
					if (ratingData) {
						this.addUser(serverID, data, ratingData, source, username, userID);
						this.onTrackSuccess(serverID, userID, ratingData, source, username);
					}
					this.stopUpdating = false;
				})
				.catch((error) => {
					this.stopUpdating = false;
					this.onError(serverID, "Error adding user. " + error.toString());
				});
		} else if (source === "Chesscom") {
			Tracker.getChesscomDataForUser(username)
				.then((chesscomData) => {
					return Tracker.parseChesscomUserData(chesscomData, username, (msg) => {
						this.onError(serverID, msg);
					});
				})
				.then((ratingData) => {
					if (ratingData) {
						this.addUser(serverID, data, ratingData, source, username, userID);
						this.onTrackSuccess(serverID, userID, ratingData, source, username);
					}
					this.stopUpdating = false;
				})
				.catch((error) => {
					this.stopUpdating = false;
					this.onError(serverID, "Error adding user. " + error.toString());
				});
		}
	};

	remove(serverID, userID, nomsg) {
		if (this.updating) {
			this.afterUpdate.push({
				"type": "remove",
				"arguments": arguments
			});
			return;
		}
		this.stopUpdating = true;
		let data = DataManager.getData();
		if (data[serverID] && data[serverID][userID]) {
			let username = data[serverID][userID].username;
			delete data[serverID][userID];
			DataManager.setData(data);
			this.onRemoveSuccess(serverID, userID, username);
		} else {
			if (!nomsg) {
				this.onError(serverID, "No tracking entry found to remove.");
			}
		}
		this.stopUpdating = false;
	};

	removeByUsername(serverID, source, username) {
		this.stopUpdating = true;
		let data = DataManager.getData();
		if (data[serverID]) {
			let users = data[serverID];
			for (let [userID, user] of Object.entries(users)) {
				if (user.username.toLowerCase() === username.toLowerCase() &&
					source.toLowerCase() === user.source.toLowerCase()) {
					this.remove(serverID, userID);
					return;
				}
			}
		}
		this.onError(serverID, "No tracking entry found to remove.");
		this.stopUpdating = false;
	}

	static findLeastUpToDateUser() {
        let currentValue = Infinity;
        for (let [serverID, guildUsers] in Object.entries(DataManager.getData())) {
            let f = Object.entries(guildUsers).find(([userID, dbuser]) => {
                if (closedUsername[dbuser.username.toLowerCase()]) continue;
                let user = this.client.users.find.byUser(userID);			
                if (!/online|idle|dnd/.test(user.presence.status)) return false;
                if (!dbuser.lastupdate) return true;
                if (dbuser.lastupdate < currentValue && dbuser.lastupdate < Date.now() - (config.minimumUpdate || 60 * 30 * 1000)) {
                    currentValue = dbuser.lastupdate;
                    return {    userID, serverID    };
                }
            });
            if (f) return f;
        }
	};

	updateUser(userData) {
		let serverID = userData.serverID;
		let userID = userData.userID;
		let data = DataManager.getData();
		let source = data[serverID][userID].source;
		let username = data[serverID][userID].username;

		//Update last message time
		let server = this.client.guilds.get(serverID);
		let member = server.members.get(userID);
		if (member && member.lastMessage) {
			data[serverID][userID].lastMessageTime = member.lastMessage.createdTimestamp;
		}
		Tracker.log(username, source);
		if (source.toLowerCase() === "lichess") {
			return Tracker.getLichessDataForUser(username)
				.then((lichessData) => {
					return Tracker.parseLichessUserData(lichessData, (msg) => {
						this.onError(serverID, msg);
					}, (msg) => {
						this.onModError(serverID, msg);
					});
				})
				.then((ratingData) => {
					if (ratingData) {
						data[serverID][userID].lastupdate = Date.now();
						this.onRatingUpdate(serverID, userID, data.ratings, ratingData, source, username);
						data[serverID][userID].ratings = ratingData;
						DataManager.setData(data);
					}
				});
		} else if (source.toLowerCase() === "chesscom") {
			return Tracker.getChesscomDataForUser(username)
				.then((chesscomData) => {
					return Tracker.parseChesscomUserData(chesscomData, username, (msg) => {
						this.onError(serverID, msg);
					});
				})
				.then((ratingData) => {
					if (ratingData) {
						data[serverID][userID].lastupdate = Date.now();
						this.onRatingUpdate(serverID, userID, data.ratings, ratingData, source, username);
						data[serverID][userID].ratings = ratingData;
						DataManager.setData(data);
					}
				});
		}
	}

	static getChesscomDataForUser(username) {
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

	static getLichessDataForUser(username) {
		return new Promise((resolve, reject) => {
			request.get(LICHESS_USER_URL.replace("|", username), (error, response, body) => {
				if (error) {
					return reject(error);
				}
				if (body.length === 0) {
					return reject("Couldn't find '" + username + "' on Lichess.");
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

	static parseLichessUserData(data, errorCB, modCB) {
		if (data.closed) {
			if (!closedUsername[data.username.toLowerCase()]) {
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

		if (blitzProvisional && rapidProvisional) {
			ratings.maxRating = 0;
		}

		let cheating = null;
		if (data.engine && data.booster) {
			cheating = "Player " + data.username + " (" + settings.lichessProfileURL.replace("|", data.username) + ")";
			cheating += " uses chess computer assistance, and artificially increases/decreases their rating.";
		} else if (data.engine) {
			cheating = "Player " + data.username + " (" + settings.lichessProfileURL.replace("|", data.username) + ")";
			cheating += " uses chess computer assistance.";
		} else if (data.booster) {
			cheating = "Player " + data.username + " (" + settings.lichessProfileURL.replace("|", data.username) + ")";
			cheating += " artificially increases/decreases their rating.";
		}
		if (cheating) {
			//Only say once
			if (!cheatedUserID[data.username.toLowerCase()]) {
				modCB(cheating);
				cheatedUserID[data.username.toLowerCase()] = true;
			}
		}

		if (!classicalProvisional) {
			ratings.classical = classical;
		}
		if (!rapidProvisional) {
			ratings.rapid = rapid;
			ratings.maxRating = ratings.maxRating || rapid;
			if (ratings.maxRating < rapid) {
				ratings.maxRating = rapid;
			}
		}
		if (!blitzProvisional) {
			ratings.blitz = blitz;
			ratings.maxRating = ratings.maxRating || blitz;
			if (ratings.maxRating < blitz) {
				ratings.maxRating = blitz;
			}
		}
		if (!bulletProvisional) {
			ratings.bullet = bullet;
		}

		return ratings;
	}

	static parseChesscomUserData(data, username, errorCB) {
		let rapid = null;
		let rapidProvisional = true;
		let blitz = null;
		let blitzProvisional = true;
		let bullet = null;
		let bulletProvisional = true;
		let stats = data.stats;

		if (!stats) {
			errorCB("Couldn't find '" + username + "' on Chess.com.");
			return;
		}

		for (let i = 0; i < stats.length; i++) {
			let obj = stats[i];
			if (obj.key === "lightning") {
				blitz = obj.stats.rating;
				blitzProvisional = obj.gameCount < 10;
			} else if (obj.key === "rapid") {
				rapid = obj.stats.rating;
				rapidProvisional = obj.gameCount < 10;
			} else if (obj.key === "bullet") {
				bullet = obj.stats.rating;
				bulletProvisional = obj.gameCount < 10;
			}
		}

		let ratings = {};

		if (rapidProvisional && blitzProvisional) {
			ratings.maxRating = 0;

		}

		if (!rapidProvisional) {
			ratings.rapid = rapid;
			ratings.maxRating = ratings.maxRating || rapid;
			if (ratings.maxRating < rapid) {
				ratings.maxRating = rapid;
			}
		}
		if (!blitzProvisional) {
			ratings.blitz = blitz;
			ratings.maxRating = ratings.maxRating || blitz;
			if (ratings.maxRating < blitz) {
				ratings.maxRating = blitz;
			}
		}
		if (!bulletProvisional) {
			ratings.bullet = bullet;
		}

		return ratings;
	}

	addUser(serverID, data, ratingData, source, username, userID) {
		data[serverID] = data[serverID] || {};
		data[serverID][userID] = data[serverID][userID] || {};
		data[serverID][userID].username = username;
		data[serverID][userID].source = source;
		data[serverID][userID].ratings = ratingData;
		data[serverID][userID].lastupdate = Date.now();
		DataManager.setData(data);
	}

}

module.exports = Tracker;