const Discord = require("discord.js");
const client = new Discord.Client();

const settings = require("./settings.js");
const LeaderboardConstructor = require("./leaderboard.js");
const TrackerConstructor = require("./tracker.js");
const tracker = new TrackerConstructor({
	"onTrackSuccess": onTrackSuccess, 
	"onRemoveSuccess": onRemoveSuccess, 
	"onRatingUpdate": onRatingUpdate, 
	"onError": onTrackError, 
	"onModError": onModError
});
const msgSplitRegExp = /[^\s]+/gi;
const RATINGS = settings.ratings;

client.on("ready", () => {
	console.log("The bot started!");
	tracker.initUpdateCycle();
});

client.on("guildMemberAdd", (guildMember) => {
	let foundRole = guildMember.guild.roles.find("name", settings.unrankedRoleName);
	if(foundRole) {
		guildMember.addRole(foundRole).catch((e) => console.log(JSON.stringify(e)));
	}
});

client.on("guildMemberRemove", (guildMember) => {
	let channel = getBotChannel(guildMember.guild);
	tracker.remove(guildMember.guild.id, guildMember.id, true);
});

client.on("message", (message) => {
	//COMMAND CHECK
	if(!message.content.startsWith("!")) {
		return;
	}

	//CHANNEL CHECK
	if(message.channel.name !== settings.botChannelName) {
		return;
	}

	let splitMsg = message.content.match(msgSplitRegExp);

	console.log(`Command: ${message}`);

	//HELP
	if(splitMsg[0].toLowerCase() === "!dbhelp") {
		if(splitMsg.length === 1) {
			message.channel.send({"embed": getHelpEmbed()})
			.catch((e) => console.log(JSON.stringify(e)));
		}
		return;
	}

	//REMOVE
	if(splitMsg[0].toLowerCase() === "!remove") {
		if(splitMsg.length === 1) {
			tracker.remove(message.guild.id, message.member.id);
		} else if(splitMsg.length === 3) {
			let source = splitMsg[1].toLowerCase();
			if(source === "chesscom" || source === "lichess") {
				tracker.removeByUsername(message.guild.id, source, splitMsg[2]);
			} else {
				message.channel.send("Bad second parameter (source).")
				.catch((e) => console.log(JSON.stringify(e)));
			}
		} else {
			message.channel.send("Wrong amount of parameters.")
			.catch((e) => console.log(JSON.stringify(e)));
		}
		return;
	}

	//UPDATE
	if(splitMsg[0].toLowerCase() === "!update") {
		if(splitMsg.length === 1) {
			tracker.queueForceUpdate(message.member.id);
			message.channel.send("Queued for update.")
			.catch((e) => console.log(JSON.stringify(e)));
		}
		return;
	}

	//ADD LICHESS
	if(splitMsg[0].toLowerCase() === "!lichess") {
		if(splitMsg.length === 2) {
			//Adding sender to tracking
			tracker.track(message.guild.id, message.member.id, "Lichess", splitMsg[1]);
		} else if(splitMsg.length === 3) {
			if(canManageRoles(message.member)) {
				let member = getMemberFromMention(message.guild, splitMsg[2]);
				if(member) {
					tracker.track(message.guild.id, member.id, "Lichess", splitMsg[1]);
				} else {
					message.channel.send("Invalid user mention given.")
					.catch((e) => console.log(JSON.stringify(e)));
				}
			} else {
				message.channel.send("You do not have permission to do this.")
				.catch((e) => console.log(JSON.stringify(e)));
			}
		} else {
			message.channel.send("Wrong amount of parameters.")
			.catch((e) => console.log(JSON.stringify(e)));
		}
		return;
	}

	//ADD CHESS.COM
	if(splitMsg[0].toLowerCase() === "!chesscom") {
		if(splitMsg.length === 2) {
			//Adding sender to tracking
			tracker.track(message.guild.id, message.member.id, "Chesscom", splitMsg[1]);
		} else if(splitMsg.length === 3) {
			if(canManageRoles(message.member)) {
				let member = getMemberFromMention(message.guild, splitMsg[2]);
				if(member) {
					tracker.track(message.guild.id, member.id, "Chesscom", splitMsg[1]);
				} else {
					message.channel.send("Invalid user mention given.")
					.catch((e) => console.log(JSON.stringify(e)));
				}
			} else {
				message.channel.send("You do not have permission to do this.")
				.catch((e) => console.log(JSON.stringify(e)));
			}
		} else {
			message.channel.send("Wrong amount of parameters.")
			.catch((e) => console.log(JSON.stringify(e)));
		}
		return;
	}

	//LIST
	if(splitMsg[0].toLowerCase() === "!list") {
		if(splitMsg.length === 1) {
			let leaderboard = new LeaderboardConstructor({});
			let list = leaderboard.getList(getNick);
			list.embed.color = settings.embedColor;
			message.channel.send(list).catch((e) => console.log(JSON.stringify(e)));
		} else if(splitMsg.length === 2) {
			//Page or type
			let val = splitMsg[1].toLowerCase();
			if(val !== "bullet" && val !== "blitz" && val !== "rapid" && val !== "classical") {
				val = parseInt(val);
				if(isNaN(val)) {
					message.channel.send("Bad second parameter (type or page).")
					.catch((e) => console.log(JSON.stringify(e)));
					return;
				} else {
					let leaderboard = new LeaderboardConstructor({
						"page": val
					});
					let list = leaderboard.getList(getNick);
					list.embed.color = settings.embedColor;
					message.channel.send(list).catch((e) => console.log(JSON.stringify(e)));
				}
			} else {
				let leaderboard = new LeaderboardConstructor({
					"type": capitalise(val)
				});
				let list = leaderboard.getList(getNick);
				list.embed.color = settings.embedColor;
				message.channel.send(list).catch((e) => console.log(JSON.stringify(e)));
			}
		} else if(splitMsg.length === 3) {
			//Page and type
			let type = splitMsg[1].toLowerCase();
			let page = parseInt(splitMsg[2]);
			if(type !== "bullet" && type !== "blitz" && type !== "rapid" && type !== "classical") {
				message.channel.send("Bad second parameter (type).")
				.catch((e) => console.log(JSON.stringify(e)));
				return;
			}
			if(isNaN(page)) {
				message.channel.send("Bad third parameter (page).")
				.catch((e) => console.log(JSON.stringify(e)));
				return;
			}
			let leaderboard = new LeaderboardConstructor({
				"type": capitalise(type),
				"page": page
			});
			let list = leaderboard.getList(getNick);
			list.embed.color = settings.embedColor;
			message.channel.send(list).catch((e) => console.log(JSON.stringify(e)));
		}
		return;
	}

	//RANK
	if(splitMsg[0].toLowerCase() === "!myrank") {
		if(splitMsg.length === 1) {
			let leaderboard = new LeaderboardConstructor({});
			let rank = leaderboard.getRank(getNick, message.member.id);
			if(rank.embed) {
				rank.embed.color = settings.embedColor;
			}
			message.channel.send(rank).catch((e) => console.log(JSON.stringify(e)));
		}
		return;
	}

	//LEAGUE ROLE TOGGLE
	if(splitMsg[0].toLowerCase() === "!league") {
		let leagueRole = message.member.roles.find("name", settings.leagueRoleName);
		if(leagueRole) {
			//Remove the role
			message.member.removeRole(leagueRole).catch((e) => console.log(JSON.stringify(e)));
			message.channel.send("League role removed.");
		} else {
			//Add the role
			let role = message.guild.roles.find("name", settings.leagueRoleName);
			message.member.addRole(role).catch((e) => console.log(JSON.stringify(e)));
			message.channel.send("League role added.");
		}
	}

	//ARENA ROLE TOGGLE
	if(splitMsg[0].toLowerCase() === "!arena") {
		let arenaRole = message.member.roles.find("name", settings.arenaRoleName);
		if(arenaRole) {
			//Remove the role
			message.member.removeRole(arenaRole).catch((e) => console.log(JSON.stringify(e)));
			message.channel.send("Arena role removed.");
		} else {
			//Add the role
			let role = message.guild.roles.find("name", settings.arenaRoleName);
			message.member.addRole(role).catch((e) => console.log(JSON.stringify(e)));
			message.channel.send("Arena role added.");
		}
	}

});

client.login(settings.token);

function onModError(serverID, msg) {
	let channel = getModChannel(client.guilds.get(serverID));
	channel.send(msg).catch((e) => console.log(JSON.stringify(e)));
}

function onTrackError(serverID, msg) {
	let channel = getBotChannel(client.guilds.get(serverID));
	channel.send(msg).catch((e) => console.log(JSON.stringify(e)));
}

function getMemberFromMention(guild, text) {
	if(!text.startsWith("<@") || !text.endsWith(">")) {
		return null;
	}
	text = text.replace(/[^\d]/g, "");
	return guild.members.get(text);
}

function canManageRoles(member) {
	return member.permissions.has(Discord.Permissions.FLAGS.MANAGE_ROLES);
}

function capitalise(str) {
	return str[0].toUpperCase() + str.slice(1).toLowerCase();
}

function getNick(serverID, userID) {
	let guild = client.guilds.get(serverID);
	let member = guild.members.get(userID);
	return member.nickname ? member.nickname : member.user.username;
}

function onRemoveSuccess(serverID, userID, username) {
	let guild = client.guilds.get(serverID);
	let botChannel = getBotChannel(guild);
	let member = guild.members.get(userID);
	botChannel.send("No longer tracking " + member ? getNick(guild.id, member.id) : username)
	.catch((e) => console.log(JSON.stringify(e)));
	removeRatingRole(serverID, userID);
}

function removeRatingRole(serverID, userID) {
	let guild = client.guilds.get(serverID);
	let member = guild.members.get(userID);
	let roles = getMemberRatingRoles(member);
	for(let i = 0; i < roles.length; i++) {
		member.removeRole(roles[i]).catch((e) => console.log(JSON.stringify(e)));
	}
	let unrankedRole = guild.roles.find("name", settings.unrankedRoleName);
	if(unrankedRole) {
		member.addRole(unrankedRole).catch((e) => console.log(JSON.stringify(e)));
	}
}

function getMemberRatingRoles(member) {
	let foundRoles = [];
	member.roles.some(function(role) {
		let num = parseInt(role.name);
		if(RATINGS.indexOf(num) >= 0) {
			foundRoles.push(role);
		}
	});
	return foundRoles;
}

function onTrackSuccess(serverID, userID, ratingData, source, username) {
	let guild = client.guilds.get(serverID);
	let newRole = findRoleForRating(guild, ratingData.maxRating);
	let botChannel = getBotChannel(guild);
	if(!newRole) {
		botChannel.send("Could not find a valid role for rating " + ratingData.maxRating)
		.catch((e) => console.log(JSON.stringify(e)));
		return;
	}

	let member = guild.members.get(userID);

	//If user has an unranked role, remove it
	let unranked = member.roles.find("name", settings.unrankedRoleName);
	if(unranked) {
		member.removeRole(unranked).catch((e) => console.log(JSON.stringify(e)));
	}
	if(source === "Chesscom") {
		source = "Chess.com";
	}
	//Add a rating role
	member.addRole(newRole).then(() => {
		let title = "Linked " + (member.nickname ? member.nickname : member.user.username) + 
			" to '" + username + "' on " + source + 
			" (" + (source === "Lichess" ? settings.lichessProfileURL : settings.chesscomProfileURL).replace("|", username) + ")";
		let description = "Added to the rating group **" + newRole.name + "** with a rating of **" + ratingData.maxRating + "**\n" +
			(ratingData.classical ? "Classical: **" + ratingData.classical + "**\n" : "") +
			(ratingData.rapid ? "Rapid: **" + ratingData.rapid + "**\n" : "") +
			(ratingData.blitz ? "Blitz: **" + ratingData.blitz + "**\n" : "") +
			(ratingData.bullet ? "Bullet: **" + ratingData.bullet + "**": "");

		botChannel.send({
			"embed": {
				"title": title,
				"description": description,
				"color": settings.embedColor
			}
		}).catch((e) => console.log(JSON.stringify(e)));
	}).catch(function(error) {
		console.log("Error adding new role", error);
	});
}

function onRatingUpdate(serverID, userID, oldData, ratingData, source, username) {
	let guild = client.guilds.get(serverID);
	let botChannel = getBotChannel(guild);
	let member = guild.members.get(userID);
	if(source === "Chesscom") {
		source = "Chess.com";
	}
	if(!member) {
		console.log(username + " (" + source + ") not found on the server. Removing from tracking");
		tracker.remove(guild.id, userID);
		return;
	}
	let newRole = findRoleForRating(guild, ratingData.maxRating);
	if(!newRole) {
		botChannel.send("Could not find a valid role for rating " + ratingData.maxRating)
		.catch((e) => console.log(JSON.stringify(e)));
		return;
	}
	let currentRoles = getMemberRatingRoles(member);
	for(let i = 0; i < currentRoles.length; i++) {
		let role = currentRoles[i];
		if(role.name !== newRole.name) {
			//Remove other rating roles if exist
			member.removeRole(role).catch((e) => console.log(JSON.stringify(e)));
		}
	}
	//Add new role
	if(!currentRoles.find((r) => newRole.name === r.name)) {
		member.addRole(newRole).then(() => {
			let title = "Updated " + getNick(serverID, userID) + " as '" + username + "' on " + source;
			let description = "New rating group **" + newRole.name + "** with a rating of **" + ratingData.maxRating + "**\n" +
				(ratingData.classical ? "Classical: **" + ratingData.classical + "**\n" : "") +
				(ratingData.rapid ? "Rapid: **" + ratingData.rapid + "**\n" : "") +
				(ratingData.blitz ? "Blitz: **" + ratingData.blitz + "**\n" : "") +
				(ratingData.bullet ? "Bullet: **" + ratingData.bullet + "**": "");
			botChannel.send({
				"embed": {
					"title": title,
					"description": description,
					"color": settings.embedColor
				}
			}).catch((e) => console.log(JSON.stringify(e)));
		}).catch((error) => {
			console.log("Error adding new role", error);
		});
	}
}

function findRoleForRating(guild, rating) {
	rating = parseInt(rating);

	//Deal with lowest rating role
	let matchedRole = rating < RATINGS[0] ? RATINGS[0] + "-" : null;
	
	if(!matchedRole) {
		//Deal with highest rating role
		matchedRole = rating >= RATINGS[RATINGS.length - 1] ? RATINGS[RATINGS.length - 1] + "++" : null;
	}
	if(!matchedRole) {
		for(let i = RATINGS.length - 1; i > 0; i--) {
			if(rating >= RATINGS[i]) {
				matchedRole = RATINGS[i] + "+";
				break;
			}
		}
	}
	if(!matchedRole) {
		return null;
	}

	let role = guild.roles.find("name", matchedRole);

	return role;
}

function getModChannel(guild) {
	let channel = guild.channels.find("name", settings.modChannelName);
	if(!channel) {
		console.log("No mod channel found on server: " + guild.name);
	}
	return channel;
}

function getBotChannel(guild) {
	let channel = guild.channels.find("name", settings.botChannelName);
	if(!channel) {
		console.log("No bot channel found on server: " + guild.name);
	}
	return channel;
}

function getHelpEmbed() {
	return {
		"color": settings.embedColor,
		"fields": [{
			"name": "!Lichess [Lichess Username]",
			"value": "Links you to a specific username on Lichess."
		},{
			"name": "!Chesscom [Chess.com Username]",
			"value": "Links you to a specific username on Chess.com."
		},{
			"name": "!Remove",
			"value": "Removes you from the rating tracker."
		},{
			"name": "!Update",
			"value": "Queue prioritised update of your ratings."
		},{
			"name": "!List [page]",
			"value": "Show current leaderboard. Page is optional."
		},{
			"name": "!List [bullet | blitz | rapid | classical]",
			"value": "Show current leaderboard. Time control is optional."
		},{
			"name": "!List [bullet | blitz | rapid | classical] [page]",
			"value": "Show current leaderboard. Time control is optional. Page is optional."
		},{
			"name": "!MyRank",
			"value": "Displays your current rank."
		},{
			"name": "!Arena",
			"value": "Toggles arena role."
		},{
			"name": "!League",
			"value": "Toggles league role."
		},{
			"name": "!Lichess [Lichess username] [@Discord User Mention]",
			"value": "Links discord user to a specific username on Lichess."
		},{
			"name": "!Chesscom [Chess.com username] [@Discord User Mention]",
			"value": "Links discord user to a specific username on Chess.com."
		},{
			"name": "!Remove [Chesscom | Lichess] [Chess.com or Lichess Username]",
			"value": "Removes a username on respective platform from the rating tracker."
		}]
	};
}