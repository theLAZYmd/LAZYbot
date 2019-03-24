const Embed = require("../../util/embed");
const settings = require("../../settings");

class Output {

    constructor(client) {
        this.client = client;
    }

    onModError(serverID, msg) {
        let guild = this.client.guilds.get(serverID);
        let channel = getModChannel(this.client.guilds.get(serverID));
        let modRole = guild.roles.find(item => item.name === settings.modRoleName);
        if (modRole) {
            msg = `<@&${modRole.id}>\n` + msg;
        }
        channel.send(msg).catch((e) => console.log(JSON.stringify(e)));
    }

    onTrackError(serverID, msg) {
        let channel = getBotChannel(this.client.guilds.get(serverID));
        channel.send(msg)
            .then(message => message.delete(settings.deleteDelay))
            .catch((e) => console.log(JSON.stringify(e)));
    }

    getMemberFromMention(guild, text) {
        if (!text.startsWith("<@") || !text.endsWith(">")) {
            return null;
        }
        text = text.replace(/[^\d]/g, "");
        return guild.members.get(text);
    }

    canManageRoles(member) {
        return member.permissions.has(Discord.Permissions.FLAGS.MANAGE_ROLES);
    }

    capitalise(str) {
        return str[0].toUpperCase() + str.slice(1).toLowerCase();
    }

    getNick(serverID, userID) {
        let guild = this.client.guilds.get(serverID);
        let member = guild.members.get(userID);
        return member ? (member.nickname ? member.nickname : member.user.username) : "nick";
    }

    onRemoveSuccess(serverID, userID, username) {
        let guild = this.client.guilds.get(serverID);
        let botChannel = getBotChannel(guild);
        let member = guild.members.get(userID);
        botChannel.send("No longer tracking " + (member ? getNick(guild.id, member.id) : username))
            .then(message => message.delete(settings.deleteDelay))
            .catch((e) => console.log(JSON.stringify(e)));
        removeRatingRole(serverID, userID);
    }

    removeRatingRole(serverID, userID) {
        let guild = this.client.guilds.get(serverID);
        let member = guild.members.get(userID);
        if (!member) {
            return;
        }
        let roles = getMemberRatingRoles(member);
        for (let i = 0; i < roles.length; i++) {
            member.removeRole(roles[i]).catch((e) => console.log(JSON.stringify(e)));
        }
        let unrankedRole = guild.roles.find(item => item.name === settings.unrankedRoleName);
        if (unrankedRole) {
            member.addRole(unrankedRole).catch((e) => console.log(JSON.stringify(e)));
        }
    }

    getMemberRatingRoles(member) {
        let foundRoles = [];
        member.roles.some((role) => {
            let num = parseInt(role.name);
            if (RATINGS.indexOf(num) >= 0) {
                foundRoles.push(role);
            }
        });
        return foundRoles;
    }

    onTrackSuccess(serverID, userID, ratingData, source, username) {
        let guild = this.client.guilds.get(serverID);
        let newRole = findRoleForRating(guild, ratingData.maxRating);
        let botChannel = getBotChannel(guild);
        if (!newRole) {
            botChannel.send("Could not find a valid role for rating " + ratingData.maxRating)
                .then(message => message.delete(settings.deleteDelay))
                .catch((e) => console.log(JSON.stringify(e)));
            return;
        }

        let member = guild.members.get(userID);

        //If user has an unranked role, remove it
        let unranked = member.roles.find(item => item.name === settings.unrankedRoleName);
        if (unranked) {
            member.removeRole(unranked).catch((e) => console.log(JSON.stringify(e)));
        }
        if (source === "Chesscom") {
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
                (ratingData.bullet ? "Bullet: **" + ratingData.bullet + "**" : "");

            botChannel.send({
                    "embed": {
                        "title": title,
                        "description": description,
                        "color": settings.embedColor
                    }
                })
                .then(message => message.delete(settings.deleteDelay))
                .catch((e) => console.log(JSON.stringify(e)));
        }).catch((error) => {
            console.log("Error adding new role", error);
        });
    }

    onRatingUpdate(serverID, userID, oldData, ratingData, source, username) {
        let guild = this.client.guilds.get(serverID);
        let botChannel = getBotChannel(guild);
        let member = guild.members.get(userID);
        if (source === "Chesscom") {
            source = "Chess.com";
        }
        if (!member) {
            console.log(username + " (" + source + ") not found on the server. Removing from tracking");
            tracker.remove(guild.id, userID);
            return;
        }
        let newRole = findRoleForRating(guild, ratingData.maxRating);

        if (!newRole) {
            botChannel.send("Could not find a valid role for rating " + ratingData.maxRating)
                .then(message => message.delete(settings.deleteDelay))
                .catch((e) => console.log(JSON.stringify(e)));
            return;
        }

        if (newRole.name == "Unranked") {
            removeRatingRole(serverID, userID)
            return;
        }

        let currentRoles = getMemberRatingRoles(member);
        for (let i = 0; i < currentRoles.length; i++) {
            let role = currentRoles[i];
            if (role.name !== newRole.name) {
                //Remove other rating roles if exist
                member.removeRole(role).catch((e) => console.log(JSON.stringify(e)));
            }
        }
        //Add new role
        if (!currentRoles.find((r) => newRole.name === r.name)) {
            member.addRole(newRole).then(() => {
                let title = "Updated " + getNick(serverID, userID) + " as '" + username + "' on " + source;
                let description = "New rating group **" + newRole.name + "** with a rating of **" + ratingData.maxRating + "**\n" +
                    (ratingData.classical ? "Classical: **" + ratingData.classical + "**\n" : "") +
                    (ratingData.rapid ? "Rapid: **" + ratingData.rapid + "**\n" : "") +
                    (ratingData.blitz ? "Blitz: **" + ratingData.blitz + "**\n" : "") +
                    (ratingData.bullet ? "Bullet: **" + ratingData.bullet + "**" : "");
                botChannel.send({
                        "embed": {
                            "title": title,
                            "description": description,
                            "color": settings.embedColor
                        }
                    })
                    .then(message => message.delete(settings.deleteDelay))
                    .catch((e) => console.log(JSON.stringify(e)));
            }).catch((error) => {
                console.log("Error adding new role", error);
            });
        }
    }

    findRoleForRating(guild, rating) {
        rating = parseInt(rating);
        let matchedRole = rating < RATINGS[0] ? RATINGS[0] + "-" : null;
        if (rating == 0) matchedRole = "Unranked";
        if (!matchedRole) matchedRole = rating >= RATINGS[RATINGS.length - 1] ? RATINGS[RATINGS.length - 1] + "++" : null;
        if (!matchedRole) {
            for (let i = RATINGS.length - 1; i >= 0; i--) {
                if (rating >= RATINGS[i]) {
                    matchedRole = RATINGS[i] + "+";
                    break;
                }
            }
        }
        if (!matchedRole) return null;
        let role = guild.roles.find(item => item.name === matchedRole);
        return role;
    }

    getModChannel(guild) {
        let channel = guild.channels.find(item => item.name === settings.modChannelName);
        if (!channel) Logger.error("No mod channel found on server: " + guild.name);
        return channel;
    }

    getBotChannel(guild) {
        let channel = guild.channels.find(item => item.name === settings.botChannelName);
        if (!channel) Logger.error("No bot channel found on server: " + guild.name);
        return channel;
    }

    getHelpEmbed() {
        return new Embed().setColor(settings.embedColor)
            .addField("!Lichess [Lichess Username]", "Links you to a specific username on Lichess.", false)
            .addField("!Chesscom [Chess.com Username]", "Links you to a specific username on Chess.com.", false)
            .addField("!Remove", "Removes you from the rating tracker.", false)
            .addField("!Update", "Queue prioritised update of your ratings.", false)
            .addField("[!List | !Active] [page]", "Show current leaderboard. Page is optional.", false)
            .addField("[!List | !Active] [bullet | blitz | rapid | classical]", "Show current leaderboard. Time control is optional.", false)
            .addField("[!List | !Active] [bullet | blitz | rapid | classical] [page]", "Show current leaderboard. Time control is optional. Page is optional.", false)
            .addField("!MyRank", "Displays your current rank.", false)
            .addField("!Arena", "Toggles arena role.", false)
            .addField("!League", "Toggles league role.", false)
            .addField("!Study", "Toggles study role.", false)
            .addField("!Fen [FEN]", "Will show the board.", false)
            .addField("!Lichess [Lichess username] [@Discord User Mention]", "Links discord user to a specific username on Lichess.", false)
            .addField("!Chesscom [Chess.com username] [@Discord User Mention]", "Links discord user to a specific username on Chess.com.", false)
            .addField("!Remove [Chesscom | Lichess] [Chess.com or Lichess Username]", "Removes a username on respective platform from the rating tracker.", false)
    }

    getFenEmbed(imageUrl, text, lichessAnalysisUrl) {
        return new Embed()
            .setColor(settings.embedColor)
            .setTitle(text)
            .setURL(lichessAnalysisUrl)
            .setImage(imageUrl);
    }

}

module.exports = Output;