const Parse = require('../util/parse');
const Embed = require('../util/embed');
const Logger = require('../util/logger');
const settings = require('../settings');
const Package = require('../../package.json');
const config = require('../config.json');

class Message extends Parse {

	constructor(message) {
		super(message);
		this.splitMsg = this.words;
	}

	/**
	 * Eval Command
	 * Allows the evaluation of JavaScript code client side
	 */
	async eval(argument = this.argument) {
		try {
			if (!settings.owners.includes(this.author.id)) throw 'That command is bot owner only.\nIf you are not an active developer on the bot, you cannot use this command.'; //extra protection, in case permission.js fails
			if (/^```[a-z]+[\s\n]+([\w\W]+)```$/.test(argument)) argument = argument
				.match(/^```[a-z]+\s+([\w\W"]+)```$/)[1];
			else throw 'Incorrect formatting! Use a code block!';
			eval(argument);
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	/**
	 * Outputs a position and link to Lichess study based on an FEN
	 */
	async fen() {
		try {
			if (this.args.length === 0) throw 'Wrong amount of parameters.';
			const FEN = require('../modules/Chess/fen');
			let Instance = new FEN(this.message);
			return Instance.run();
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	/**
	 * Displays an embed with a help message
	 */
	async dbhelp() {
		try {
			if (this.args.length !== 0) throw 'Wrong amount of parameters';
			let prefix = this.prefix;
			let name = `${Package.name.replace('lazy', 'LAZY')}${this.client.user.id === config.ids.betabot ? "beta" : ""} v.${Package.version}`;
			return this.Output.sender(new Embed()
				.setTitle(`${name} by ${Package.author}`)
				.setColor(settings.embedColor)
				.addField(`${prefix}Lichess [Lichess Username]`,
					'Links you to a specific username on Lichess.', false)
				.addField(`${prefix}Chesscom [Chess.com Username]`,
					'Links you to a specific username on Chess.com.', false)
				.addField(`${prefix}Remove`,
					'Removes you from the rating tracker.', false)
				.addField(`${prefix}Update`,
					'Queue prioritised update of your ratings.', false)
				.addField(`[${prefix}List | ${prefix}Active] [page]`,
					'Show current leaderboard. Page is optional.', false)
				.addField(`[${prefix}List | ${prefix}Active] [bullet | blitz | rapid | classical]`,
					'Show current leaderboard. Time control is optional.', false)
				.addField(`[${prefix}List | ${prefix}Active] [bullet | blitz | rapid | classical] [page]`,
					'Show current leaderboard. Time control is optional. Page is optional.', false)
				.addField(`${prefix}MyRank`,
					'Displays your current rank.', false)
				.addField(`${prefix}Arena`,
					'Toggles arena role.', false)
				.addField(`${prefix}League`,
					'Toggles league role.', false)
				.addField(`${prefix}Study`,
					'Toggles study role.', false)
				.addField(`${prefix}Fen [FEN]`,
					'Will show the board.', false)
				.addField(`${prefix}Lichess [Lichess username] [@Discord User Mention]`,
					'Links discord user to a specific username on Lichess.', false)
				.addField(`${prefix}Chesscom [Chess.com username] [@Discord User Mention]`,
					'Links discord user to a specific username on Chess.com.', false)
				.addField(`${prefix}Remove [Chesscom | Lichess] [Chess.com or Lichess Username]`,
					'Removes a username on respective platform from the rating tracker.', false)
			)
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	/**
	 * Toggles whether an owner has a role or not
	 * @private
	 */
	async toggleRole(roleType) {
		try {
			let roleName = settings[roleType.toLowerCase() + 'RoleName'];
			if (!roleName) throw ('Couldn\'t find corresponding role in bot settings! Please alert a server mod.');			
			let memberRole = this.member.roles.find(item => item.name === roleName);
			if (memberRole) {
				//Remove the role
				this.member.removeRole(memberRole);
				this.Output.generic('Arena role removed.');
			} else {
				//Add the role
				let role = this.guild.roles.find(item => item.name === roleName);
				if (!role) throw ('Couldn\'t find role: **' + roleName + "**");
				this.member.addRole(role);
				this.Output.generic('Arena role added.');
			}
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	/**
	 * Toggles league role
	 */
	async league() {
		this.toggleRole('league');
	}

	/**
	 * Toggles arena role
	 */
	async arena() {
		this.toggleRole('arena');
	}

	
	/**
	 * Toggles study role
	 */
	async study() {
		this.toggleRole('study');
	}

	//REMOVE
	remove() {
		if (this.splitMsg.length === 1) {
			tracker.remove(this.guild.id, this.member.id);
		} else if (this.splitMsg.length === 3) {
			let source = this.splitMsg[1].toLowerCase();
			if (source === 'chesscom' || source === 'lichess') {
				tracker.removeByUsername(this.guild.id, source, this.splitMsg[2]);
			} else {
				this.channel.send('Bad second parameter (source).')
					.then(function (msg) {
						if (msg.channel.id === getBotChannel(msg.guild).id) msg.delete(settings.deleteDelay);
					})
					.catch((e) => console.log(JSON.stringify(e)));
			}
		} else {
			this.channel.send('Wrong amount of parameters.')
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
			tracker.queueForceUpdate(this.guild.id, this.member.id);
			this.channel.send('Queued for update.')
				.then(function (msg) {
					if (msg.channel.id === getBotChannel(msg.guild).id) msg.delete(settings.deleteDelay);
				})
				.catch((e) => console.log(JSON.stringify(e)));
		}
		this.message.delete();
	}

	//ADD LICHESS
	lichess() {
		if (this.splitMsg.length === 2) {
			//Adding sender to tracking
			tracker.track(this.guild.id, this.member.id, 'Lichess', this.splitMsg[1]);
		} else if (this.splitMsg.length === 3) {
			if (canManageRoles(this.member)) {
				let member = getMemberFromMention(this.guild, this.splitMsg[2]);
				if (member) {
					tracker.track(this.guild.id, member.id, 'Lichess', this.splitMsg[1]);
				} else {
					this.channel.send('Invalid user mention given.')
						.then(function (msg) {
							if (msg.channel.id === getBotChannel(msg.guild).id) msg.delete(settings.deleteDelay);
						})
						.catch((e) => console.log(JSON.stringify(e)));
				}
			} else {
				this.channel.send('You do not have permission to do this.')
					.then(function (msg) {
						if (msg.channel.id === getBotChannel(msg.guild).id) msg.delete(settings.deleteDelay);
					})
					.catch((e) => console.log(JSON.stringify(e)));
			}
		} else {
			this.channel.send('Wrong amount of parameters.')
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
			tracker.track(this.guild.id, this.member.id, 'Chesscom', this.splitMsg[1]);
		} else if (this.splitMsg.length === 3) {
			if (canManageRoles(this.member)) {
				let member = getMemberFromMention(this.guild, this.splitMsg[2]);
				if (member) {
					tracker.track(this.guild.id, member.id, 'Chesscom', this.splitMsg[1]);
				} else {
					this.channel.send('Invalid user mention given.')
						.then(function (msg) {
							if (msg.channel.id === getBotChannel(msg.guild).id) msg.delete(settings.deleteDelay);
						})
						.catch((e) => console.log(JSON.stringify(e)));
				}
			} else {
				this.channel.send('You do not have permission to do this.')
					.then(function (msg) {
						if (msg.channel.id === getBotChannel(msg.guild).id) msg.delete(settings.deleteDelay);
					})
					.catch((e) => console.log(JSON.stringify(e)));
			}
		} else {
			this.channel.send('Wrong amount of parameters.')
				.then(function (msg) {
					if (msg.channel.id === getBotChannel(msg.guild).id) msg.delete(settings.deleteDelay);
				})
				.catch((e) => console.log(JSON.stringify(e)));
		}
		this.message.delete();
	}

	active() {
		return this.list();
	}
	
	//RANK
	myrank() {
		try {
			if (this.args.length !== 1) throw 'Wrong amount of parameters';
			let leaderboard = new LeaderboardConstructor(this.guild, {}); //provides the server identity for the leaderboard
			let rank = leaderboard.getRank(getNick, this.member.id);
			if (rank.embed) {
				rank.embed.color = settings.embedColor;
			}
			this.channel.send(rank);
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	//LIST || ACTIVE
	list() {
		if (this.splitMsg.length === 1) {
			let leaderboard = new LeaderboardConstructor(this.guild, {
				'active': this.splitMsg[0].toLowerCase() === '!active'
			});
			let list = leaderboard.getList(getNick);
			list.embed.color = settings.embedColor;
			this.channel.send(list)
				.then(function (msg) {
					if (msg.channel.id === getBotChannel(msg.guild).id) msg.delete(settings.deleteDelay);
				})
				.catch((e) => console.log(JSON.stringify(e)));
		} else if (this.splitMsg.length === 2) {
			//Page or type
			let val = this.splitMsg[1].toLowerCase();
			if (val !== 'bullet' && val !== 'blitz' && val !== 'rapid' && val !== 'classical') {
				val = parseInt(val);
				if (isNaN(val)) {
					this.channel.send('Bad second parameter (type or page).')
						.then(function (msg) {
							if (msg.channel.id === getBotChannel(msg.guild).id) msg.delete(settings.deleteDelay);
						})
						.catch((e) => console.log(JSON.stringify(e)));
					return;
				} else {
					let leaderboard = new LeaderboardConstructor(this.guild, {
						'page': val,
						'active': this.splitMsg[0].toLowerCase() === '!active'
					});
					let list = leaderboard.getList(getNick);
					list.embed.color = settings.embedColor;
					this.channel.send(list)
						.then(function (msg) {
							if (msg.channel.id === getBotChannel(msg.guild).id) msg.delete(settings.deleteDelay);
						})
						.catch((e) => console.log(JSON.stringify(e)));
				}
			} else {
				let leaderboard = new LeaderboardConstructor(this.guild, {
					'type': capitalise(val),
					'active': this.splitMsg[0].toLowerCase() === '!active'
				});
				let list = leaderboard.getList(getNick);
				list.embed.color = settings.embedColor;
				this.channel.send(list)
					.then(function (msg) {
						if (msg.channel.id === getBotChannel(msg.guild).id) msg.delete(settings.deleteDelay);
					})
					.catch((e) => console.log(JSON.stringify(e)));
			}
		} else if (this.splitMsg.length === 3) {
			//Page and type
			let type = this.splitMsg[1].toLowerCase();
			let page = parseInt(this.splitMsg[2]);
			if (type !== 'bullet' && type !== 'blitz' && type !== 'rapid' && type !== 'classical') {
				this.channel.send('Bad second parameter (type).')
					.then(function (msg) {
						if (msg.channel.id === getBotChannel(msg.guild).id) msg.delete(settings.deleteDelay);
					})
					.catch((e) => console.log(JSON.stringify(e)));
				return;
			}
			if (isNaN(page)) {
				this.channel.send('Bad third parameter (page).')
					.then(function (msg) {
						if (msg.channel.id === getBotChannel(msg.guild).id) msg.delete(settings.deleteDelay);
					})
					.catch((e) => console.log(JSON.stringify(e)));
				return;
			}
			let leaderboard = new LeaderboardConstructor(this.guild, {
				'type': capitalise(type),
				'page': page,
				'active': this.splitMsg[0].toLowerCase() === '!active'
			});
			let list = leaderboard.getList(getNick);
			list.embed.color = settings.embedColor;
			this.channel.send(list)
				.then(function (msg) {
					if (msg.channel.id === getBotChannel(msg.guild).id) msg.delete(settings.deleteDelay);
				})
				.catch((e) => console.log(JSON.stringify(e)));
		}
		this.message.delete();
	}

}

module.exports = async (client, message) => {
	try {
		if (message.author.bot) throw '';
		let argsInfo = new Message(message);
		if (!argsInfo.prefix) return;
		let method = Object.getOwnPropertyNames(Message.prototype).find(f => f.toLowerCase() === argsInfo.command.toLowerCase() && typeof argsInfo[f] === 'function');
		if (!method) return;
		Logger.log(`Command: ${argsInfo.message}`);
		argsInfo[method]();			
		if (argsInfo.botChannel) argsInfo.message.delete(settings.deleteDelay);
	} catch (e) {
		if (e) Logger.error(e);
	}
};