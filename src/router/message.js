const Logger = require("../util/logger");
const settings = require("../settings");
const commands = require("../commands.json");

class Message {

    constructor(client, message, splitMsg) {
        this.client = client;
        this.message = message;
        this.command = splitMsg[0];
        this.splitMsg = splitMsg;
        Logger.log(`Command: ${this.message}`);
    }

<<<<<<< HEAD
    /*
     * Eval Command
     * Allows the evaluation of JavaScript code client side
     * To be used Bot-Owner only
     */
    eval() {
        try {
            if (!settings.owners.includes(this.message.user.id)) throw "That command is bot owner only.\nIf you are not an active developer on the bot, you cannot use this command."; //extra protection, in case permission.js fails
            let argument = this.splitMsg.slice(1).join(" ");
            if (/^```[a-z]+[\s\n]+([\w\W]+)```$/.test(argument)) argument = argument.match(/^```[a-z]+\s+([\w\W\"]+)```$/)[1];
            else throw "Incorrect formatting! Use a code block!";
            eval(argument);
        } catch (e) {
            if (e) this.Output.onError(e);
        }
=======
	async dm(key) {
        const { aliases, regexes, def  } = Commands.dm;
        let cmdInfo = aliases.get(key.toLowerCase());
        if (!cmdInfo) cmdInfo = aliases.get(this.argsInfo.message.content.toLowerCase());
        if (!cmdInfo) cmdInfo = regexes.get(Array.from(regexes.keys()).find((string) => {
            let regex = new RegExp(string.toString(), "mg");
            if (regex.test(this.argsInfo.message.content)) return true;
            return false;
        }));
        if (!cmdInfo) return def;
        if (cmdInfo.active === false) return def;
        if (cmdInfo.prefix !== this.argsInfo.prefix) return def;
        return cmdInfo;
	}
    
	async command(key) {
        const { commands, aliases  } = Commands.message;
        let cmdInfo = commands.get(key.toLowerCase());
        if (!cmdInfo) cmdInfo = aliases.get(this.argsInfo.message.content.toLowerCase());
        if (!cmdInfo) return null;
        if (!cmdInfo.active) throw 'This command is no longer active. Commands get removed for maintenance/safety reasons periodically.\nPlease DM <@!338772451565502474> for more information.';
        if (this.argsInfo.prefixes.get(cmdInfo.prefix) !== this.argsInfo.prefix) return null;
        return cmdInfo;
	}

	async bot(embed) {
        if (!embed) return null;
        if (!embed.title) return null;
        let cmdInfo = Commands.bot.get(embed.title.toLowerCase());
        if (!cmdInfo) return null;
        if (cmdInfo.active === false) return null;
        return cmdInfo;
>>>>>>> 1.8.0
    }

    /*
     * Fen Command
     */
    fen() {
        if (this.splitMsg.length > 1) {
            let fen = this.splitMsg.slice(1).join(" ");
            let toMove = "";
            let flip = 0;
            if (fen.indexOf(" b ") !== -1) {
                toMove = "Black to move.";
                flip = 1;
            } else {
                toMove = "White to move.";
            }
            let imageUrl = FEN_API_URL +
                "?fen=" + encodeURIComponent(fen) +
                "&board=" + settings.fenBoard +
                "&piece=" + settings.fenBoardPieces +
                "&coordinates=" + settings.fenBoardCoords +
                "&size=" + settings.fenBoardSize +
                "&flip=" + flip +
                "&ext=.png"; //make discord recognise an image
            let lichessUrl = LICHESS_ANALYSIS_FEN_URL + encodeURIComponent(fen);

            this.message.channel.send({
                    "embed": getFenEmbed(imageUrl, toMove, lichessUrl)
                })
                .then(function (msg) {
                    if (msg.channel.id === getBotChannel(msg.guild).id) msg.delete(settings.deleteDelay);
                })
                .catch((e) => console.log(JSON.stringify(e)));
        } else {
            this.message.channel.send("Wrong amount of parameters.")
                .then(function (msg) {
                    if (msg.channel.id === getBotChannel(msg.guild).id) msg.delete(settings.deleteDelay);
                })
                .catch((e) => console.log(JSON.stringify(e)));
        }
<<<<<<< HEAD
    }

    /*
     * Help command
     */
    dbhelp() {
        if (this.splitMsg.length === 1) {
            this.message.channel.send({
                    "embed": getHelpEmbed()
                })
                .then(function (msg) {
                    if (msg.channel.id === getBotChannel(msg.guild).id) msg.delete(settings.deleteDelay);
                })
                .catch((e) => console.log(JSON.stringify(e)));
        }
        this.message.delete();
    }

    //REMOVE
    remove() {
        if (this.splitMsg.length === 1) {
            tracker.remove(this.message.guild.id, this.message.member.id);
        } else if (this.splitMsg.length === 3) {
            let source = this.splitMsg[1].toLowerCase();
            if (source === "chesscom" || source === "lichess") {
                tracker.removeByUsername(this.message.guild.id, source, this.splitMsg[2]);
            }
            else {
                this.message.channel.send("Bad second parameter (source).")
                    .then(function (msg) {
                        if (msg.channel.id === getBotChannel(msg.guild).id) msg.delete(settings.deleteDelay);
                    })
                    .catch((e) => console.log(JSON.stringify(e)));
=======
	}

    static async run(argsInfo, cmdInfo) {
		try {
            if (cmdInfo.command) await Logger.command(argsInfo, cmdInfo);
            if (cmdInfo.requires) {
                let P = await Message.requires(argsInfo, cmdInfo);
                if (P !== true) throw P; //halts it if fails permissions test
            }
            cmdInfo.args = (cmdInfo.arguments || []).map(a => argsInfo[a]);
            await Commands.run(cmdInfo, argsInfo.message);
		} catch (e) {
			if (e) cmdInfo.command ? argsInfo.Output.onError(e) : Logger.error(e);
			return null;
		}
	}

	static async requires(argsInfo, cmdInfo) {
        for (let [type, value] of Object.entries(cmdInfo.requires)) try {
            if (!Array.isArray(value)) value = [value]; //if it's not array (i.e. multiple possible satisfactory conditions)
            for (let v of value) {
                if (!(await Permissions[type](v, argsInfo))) throw cmdInfo.method;
>>>>>>> 1.8.0
            }
        } else {
            this.message.channel.send("Wrong amount of parameters.")
                .then(function (msg) {
                    if (msg.channel.id === getBotChannel(msg.guild).id) msg.delete(settings.deleteDelay);
                })
                .catch((e) => console.log(JSON.stringify(e)));
        }
        this.message.delete();
    }

    //UPDATE
    update() {
        if (this.splitMsg.length === 1) {
            tracker.queueForceUpdate(this.message.guild.id, this.message.member.id);
            this.message.channel.send("Queued for update.")
                .then(function (msg) {
                    if (msg.channel.id === getBotChannel(msg.guild).id) msg.delete(settings.deleteDelay);
                })
                .catch((e) => console.log(JSON.stringify(e)));
        }
        this.message.delete();
    }

<<<<<<< HEAD
    //ADD LICHESS
    lichess() {
        if (this.splitMsg.length === 2) {
            //Adding sender to tracking
            tracker.track(this.message.guild.id, this.message.member.id, "Lichess", this.splitMsg[1]);
        } else if (this.splitMsg.length === 3) {
            if (canManageRoles(this.message.member)) {
                let member = getMemberFromMention(this.message.guild, this.splitMsg[2]);
                if (member) {
                    tracker.track(this.message.guild.id, member.id, "Lichess", this.splitMsg[1]);
                } else {
                    this.message.channel.send("Invalid user mention given.")
                        .then(function (msg) {
                            if (msg.channel.id === getBotChannel(msg.guild).id) msg.delete(settings.deleteDelay);
                        })
                        .catch((e) => console.log(JSON.stringify(e)));
                }
            } else {
                this.message.channel.send("You do not have permission to do this.")
                    .then(function (msg) {
                        if (msg.channel.id === getBotChannel(msg.guild).id) msg.delete(settings.deleteDelay);
                    })
                    .catch((e) => console.log(JSON.stringify(e)));
            }
        } else {
            this.message.channel.send("Wrong amount of parameters.")
                .then(function (msg) {
                    if (msg.channel.id === getBotChannel(msg.guild).id) msg.delete(settings.deleteDelay);
                })
                .catch((e) => console.log(JSON.stringify(e)));
        }
        this.message.delete();
    }

    //ADD CHESS.COM
    chesscom() {
        if (this.splitMsg.length === 2) {
            //Adding sender to tracking
            tracker.track(this.message.guild.id, this.message.member.id, "Chesscom", this.splitMsg[1]);
        } else if (this.splitMsg.length === 3) {
            if (canManageRoles(this.message.member)) {
                let member = getMemberFromMention(this.message.guild, this.splitMsg[2]);
                if (member) {
                    tracker.track(this.message.guild.id, member.id, "Chesscom", this.splitMsg[1]);
                } else {
                    this.message.channel.send("Invalid user mention given.")
                        .then(function (msg) {
                            if (msg.channel.id === getBotChannel(msg.guild).id) msg.delete(settings.deleteDelay);
                        })
                        .catch((e) => console.log(JSON.stringify(e)));
                }
            } else {
                this.message.channel.send("You do not have permission to do this.")
                    .then(function (msg) {
                        if (msg.channel.id === getBotChannel(msg.guild).id) msg.delete(settings.deleteDelay);
                    })
                    .catch((e) => console.log(JSON.stringify(e)));
            }
        } else {
            this.message.channel.send("Wrong amount of parameters.")
                .then(function (msg) {
                    if (msg.channel.id === getBotChannel(msg.guild).id) msg.delete(settings.deleteDelay);
                })
                .catch((e) => console.log(JSON.stringify(e)));
        }
        this.message.delete();
=======
module.exports = async (client, message) => {
    try {
        if (message.author.id === client.user.id) throw "";
        let argsInfo = new Parse(message);
        try {
            let Command = new Message(argsInfo);
            if (argsInfo.author.bot) {
                let cmdInfo = await Command.bot(message.embeds[0]);
                if (cmdInfo) return await Message.run(argsInfo, cmdInfo);
            }
            if (!/[a-z]/i.test(message.content)) throw "";
            if (!argsInfo.message.guild) {
                let cmdInfo = await Command.dm(argsInfo.command);
                if (cmdInfo.guild) {
                    argsInfo.message._guild = await Message.setGuild(argsInfo, cmdInfo.guild); //now passed, just check if it needs a guild
                    if (!argsInfo.message._guild) throw "";
                }
                return await Message.run(argsInfo, cmdInfo);
            } else {
                Command.all(argsInfo);
                let cmdInfo = await Command.command(argsInfo.command);
                if (cmdInfo) {
                    cmdInfo.command = true;
                    await Message.run(argsInfo, cmdInfo);
                } else new MessageCount(message).log();
            }
        } catch (e) {
            if (e && typeof e !== "boolean") argsInfo.Output.onError(e);
        }
    } catch (e) {
        if (e) Logger.error(e);
>>>>>>> 1.8.0
    }

    active() {
        return this.list()
    }

    //LIST || ACTIVE
    list() {
        if (this.splitMsg.length === 1) {
            let leaderboard = new LeaderboardConstructor(this.message.guild, {
                "active": this.splitMsg[0].toLowerCase() === "!active"
            });
            let list = leaderboard.getList(getNick);
            list.embed.color = settings.embedColor;
            this.message.channel.send(list)
                .then(function (msg) {
                    if (msg.channel.id === getBotChannel(msg.guild).id) msg.delete(settings.deleteDelay);
                })
                .catch((e) => console.log(JSON.stringify(e)));
        } else if (this.splitMsg.length === 2) {
            //Page or type
            let val = this.splitMsg[1].toLowerCase();
            if (val !== "bullet" && val !== "blitz" && val !== "rapid" && val !== "classical") {
                val = parseInt(val);
                if (isNaN(val)) {
                    this.message.channel.send("Bad second parameter (type or page).")
                        .then(function (msg) {
                            if (msg.channel.id === getBotChannel(msg.guild).id) msg.delete(settings.deleteDelay);
                        })
                        .catch((e) => console.log(JSON.stringify(e)));
                    return;
                } else {
                    let leaderboard = new LeaderboardConstructor(this.message.guild, {
                        "page": val,
                        "active": this.splitMsg[0].toLowerCase() === "!active"
                    });
                    let list = leaderboard.getList(getNick);
                    list.embed.color = settings.embedColor;
                    this.message.channel.send(list)
                        .then(function (msg) {
                            if (msg.channel.id === getBotChannel(msg.guild).id) msg.delete(settings.deleteDelay);
                        })
                        .catch((e) => console.log(JSON.stringify(e)));
                }
            }
            else {
                let leaderboard = new LeaderboardConstructor(this.message.guild, {
                    "type": capitalise(val),
                    "active": this.splitMsg[0].toLowerCase() === "!active"
                });
                let list = leaderboard.getList(getNick);
                list.embed.color = settings.embedColor;
                this.message.channel.send(list)
                    .then(function (msg) {
                        if (msg.channel.id === getBotChannel(msg.guild).id) msg.delete(settings.deleteDelay);
                    })
                    .catch((e) => console.log(JSON.stringify(e)));
            }
        } else if (this.splitMsg.length === 3) {
            //Page and type
            let type = this.splitMsg[1].toLowerCase();
            let page = parseInt(this.splitMsg[2]);
            if (type !== "bullet" && type !== "blitz" && type !== "rapid" && type !== "classical") {
                this.message.channel.send("Bad second parameter (type).")
                    .then(function (msg) {
                        if (msg.channel.id === getBotChannel(msg.guild).id) msg.delete(settings.deleteDelay);
                    })
                    .catch((e) => console.log(JSON.stringify(e)));
                return;
            }
            if (isNaN(page)) {
                this.message.channel.send("Bad third parameter (page).")
                    .then(function (msg) {
                        if (msg.channel.id === getBotChannel(msg.guild).id) msg.delete(settings.deleteDelay);
                    })
                    .catch((e) => console.log(JSON.stringify(e)));
                return;
            }
            let leaderboard = new LeaderboardConstructor(this.message.guild, {
                "type": capitalise(type),
                "page": page,
                "active": this.splitMsg[0].toLowerCase() === "!active"
            });
            let list = leaderboard.getList(getNick);
            list.embed.color = settings.embedColor;
            this.message.channel.send(list)
                .then(function (msg) {
                    if (msg.channel.id === getBotChannel(msg.guild).id) msg.delete(settings.deleteDelay);
                })
                .catch((e) => console.log(JSON.stringify(e)));
        }
        this.message.delete();
    }

    //RANK
    myrank() {
        if (this.splitMsg.length === 1) {
            let leaderboard = new LeaderboardConstructor(this.message.guild, {}); //provides the server identity for the leaderboard
            let rank = leaderboard.getRank(getNick, this.message.member.id);
            if (rank.embed) {
                rank.embed.color = settings.embedColor;
            }
            this.message.channel.send(rank)
                .then(function (msg) {
                    if (msg.channel.id === getBotChannel(msg.guild).id) msg.delete(settings.deleteDelay);
                })
                .catch((e) => console.log(JSON.stringify(e)));
        }
        this.message.delete();
    }

    //LEAGUE ROLE TOGGLE
    league() {
        let leagueRole = this.message.member.roles.find(item => item.name === settings.leagueRoleName);
        if (leagueRole) {
            //Remove the role
            this.message.member.removeRole(leagueRole).catch((e) => console.log(JSON.stringify(e)));
            this.message.channel.send("League role removed.")
                .then(function (msg) {
                    if (msg.channel.id === getBotChannel(msg.guild).id) msg.delete(settings.deleteDelay);
                })
                .catch((e) => console.log(JSON.stringify(e)));
        } else {
            //Add the role
            let role = this.message.guild.roles.find(item => item.name === settings.leagueRoleName);
            this.message.member.addRole(role).catch((e) => console.log(JSON.stringify(e)));
            this.message.channel.send("League role added.")
                .then(function (msg) {
                    if (msg.channel.id === getBotChannel(msg.guild).id) msg.delete(settings.deleteDelay);
                })
                .catch((e) => console.log(JSON.stringify(e)));
        }
        this.message.delete();
    }

    //ARENA ROLE TOGGLE
    arena() {
        let arenaRole = this.message.member.roles.find(item => item.name === settings.arenaRoleName);
        if (arenaRole) {
            //Remove the role
            this.message.member.removeRole(arenaRole).catch((e) => console.log(JSON.stringify(e)));
            this.message.channel.send("Arena role removed.")
                .then(function (msg) {
                    if (msg.channel.id === getBotChannel(msg.guild).id) msg.delete(settings.deleteDelay);
                });
        } else {
            //Add the role
            let role = this.message.guild.roles.find(item => item.name === settings.arenaRoleName);
            this.message.member.addRole(role).catch((e) => console.log(JSON.stringify(e)));
            this.message.channel.send("Arena role added.")
                .then(function (msg) {
                    if (msg.channel.id === getBotChannel(msg.guild).id) msg.delete(settings.deleteDelay);
                });
        }
        this.message.delete();
    }

    //STUDY ROLE TOGGLE
    study() {
        let studyRole = this.message.member.roles.find(item => item.name === settings.studyRoleName);
        if (studyRole) {
            //Remove the role
            this.message.member.removeRole(studyRole).catch((e) => console.log(JSON.stringify(e)));
            this.message.channel.send("Study role removed.")
                .then(function (msg) {
                    if (msg.channel.id === getBotChannel(msg.guild).id) msg.delete(settings.deleteDelay);
                });
        } else {
            //Add the role
            let role = this.message.guild.roles.find(item => item.name === settings.studyRoleName);
            this.message.member.addRole(role).catch((e) => console.log(JSON.stringify(e)));
            this.message.channel.send("Study role added.")
                .then(function (msg) {
                    if (msg.channel.id === getBotChannel(msg.guild).id) msg.delete(settings.deleteDelay);
                });
        }
        this.message.delete();
    }

}

module.exports = async (client, message) => {
    try {
        if (message.author.bot) throw "";
        if (!message.content.startsWith("!")) return;
        let splitMsg = message.content.match(msgSplitRegExp);
        let command = splitMsg[0].slice(1);
        if (!/eval|fen/.test(command) && message.channel.name !== settings.botChannelName) return;
        let M = new Message(client, message, splitMsg);
        for (let f of Object.getOwnPropertyNames(message.prototype)) {
            if (f.toLowerCase() === command.toLowerCase() && typeof this[f] === "function") return M[f]();
        };
    } catch (e) {
        if (e) Logger.error(e);
    }
}