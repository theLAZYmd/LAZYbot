const config = require('../config.json');
const Embed = require('./embed');
const Parse = require('./parse');
const Logger = require('./logger');
const Package = require('../../package.json');

const path = require('path');

class Output extends Parse {

	constructor(message) {
		super(message);
	}

	get errorURL () {
		return this.isBetaBot() ? 'http://localhost:80/logs/error.log' : 'http://lazybot.co.uk/logs/error.log';
	}

	/**
	 * Sends an embed through the Discord API
	 * @param {Embed} embed 
	 * @param {Channel|Message} channel 
	 * @private
	 * @returns {Promise<Message>}
	 */
	async sender(embed, channel = this.channel) {
		try {
			if (!embed) throw new SyntaxError('Cannot output undefined!');
			if (!embed.color) embed.color = config.colors.generic;
			if (!channel) throw new SyntaxError('Invalid channel!');
			if (channel.channel || channel.constructor.name === 'Message') channel = channel.channel;
			let content = embed.content;
			embed = new Embed(embed);
			if (typeof embed._apiTransform === 'function') embed = embed._apiTransform();
			return await channel.send(content, {embed});
		} catch (e) {
			if (e) Logger.error(e);
			throw e;
		}
	}

	/**
	 * Edits an message with an embed through the Discord API
	 * @param {Embed} embed 
	 * @param {Message} msg 
	 * @private
	 * @returns {Promise<Message>}
	 */
	async editor(embed, msg) {
		try {
			if (!embed) throw new SyntaxError('Undefined embed parameter');
			if (!msg) throw new SyntaxError('Undefined message parameter');
			if (!embed.color) embed.color = config.colors.generic;
			let content = embed.content;
			embed = new Embed(embed);
			if (typeof embed._apiTransform === 'function') embed = embed._apiTransform();
			return await msg.edit(content, {embed});
		} catch (e) {
			if (e) this.onError(e);
		}
	}

	/**
	 * Sends an embed throught the Discord API with a single description value of a string message
	 * @param {string} description 
	 * @param {Channel} channel 
	 * @private
	 * @returns {Promise<Message>}
	 */
	async generic(description, channel) {
		try {
			return await this.sender({	description	 }, channel);
		} catch (e) {
			if (e) this.onError(e);
		}
	}

	/**
	 * Sends a named embed from the database to the Discord API
	 * @param {string} name 
	 * @private
	 * @returns {Promise<Message>}
	 */
	async embed(name) {
		try {
			try {
				let embed = await this.Embeds.find(name);
				if (!embed) throw '';
				if (this.command === '...') this.message.delete();
				return this.Paginator.sender(embed, this.command === '...' ? Infinity : 180000, name);
			} catch (e) {
				let filter = m => m.author.bot;
				try {
					await this.channel.awaitMessages(filter, {
						max: 1,
						time: 1000,
						errors: ['time']
					});
				} catch (e) {
					throw 'Couldn\'t find guide matching that name.';
				}
			}
		} catch (e) {
			if (e) this.onError(e);
		}
	}

	/**
	 * Sends a JavaScript Object through the Discord API as a Discord Embed by stringifying JSON values. Permits overspill. Primarily a debugging tool.
	 * @param {Object|Array} json 
	 * @param {Channel} channel 
	 * @param {string} type 
	 * @private
	 */
	async data(json, channel, type = 'json') {
		try {
			let string, obj;
			switch (typeof json) {
				case ('object'):
					if (typeof json._apiTransform === 'function') obj = json._apiTransform();
					else obj = json;
					try {
						string = JSON.stringify(obj, null, 4);
					} catch (e) {
						if (e) {
							if (e.message.includes('circular')) {
								Logger.error(e);
								string = '[circular Object]';
							} else this.Output.onError(e);
						}
					}
					break;
				default:
					string = json.toString().replace(/`/g, '\\`');
					break;
			}
			let index = Math.ceil(string.length / 2000);
			let keylength = Math.floor(string.length / index);
			for (let i = 0; i < index; i++) {
				let start = i * keylength;
				let finish = i === index.length - 1 ? string.length + 2 : (i + 1) * keylength;
				let description = string.slice(start, finish) + ' '.repeat(48) + '\u200b';
				this.sender(new Embed()
					.setColor(config.colors.data)
					.setDescription(description.format(type))
					.setFooter((i + 1) + ' / ' + index)
				, channel);
			}
		} catch (e) {
			if (e) Logger.error(e);
		}
	}

	/**
	 * Outputs an error as a Discord Embed through the Discord API
	 * @param {string|Error} error 
	 * @param {Channel} channel 
	 * @private
	 * @returns {Promise<Message>}
	 */
	async onError(error, channel = this.channel) {
		try {
			if (!error) throw '';
			let title, description, url;
			const regex = new RegExp(process.cwd().split(path.sep).join('\\\\'), 'g');
			if (typeof error === 'object' && error.stack && error.name && error.message) {
				const lines = error.stack.split('\n');
				let res = lines.find(l => l.match(regex));
				if (res) {
					const [cwd] = regex.exec(res);
					const i = res.indexOf(cwd) + cwd.length;
					const extension = res.slice(i);
					const [relativePath, lineNumber] = extension.split(':'); //[relativePath, lineNumber, columnNumber]
					url = Package.branch + relativePath.split('\\').join('/') + '#L' + lineNumber;
				}
				title = error.name;
				description = error.message				
					.slice(0, 2048)					
					.format();
			} else description = error
				.toString()
				.replace(/\${([a-z]+)}/gi, value => this.server.prefixes[value.match(/[a-z]+/i)]);
			let embed = new Embed()
				.setDescription(description)
				.setColor(config.colors.error)
				.setURL(url && !url.includes('node_modules') ? url : this.errorURL);
			if (title) embed.setTitle(title);
			if (!channel) throw error;
			Logger.error(error);
			return await this.sender(embed, channel);
		} catch (e) {
			if (e) Logger.error(e);
		}
	}

	/**
	 * DMs a message to all 'bot owners' in the form of a Discord Embed
	 * @param {string} description 
	 * @private
	 */
	async owner(description) {
		try {
			let owners = config.ids.owner.map(owner => this.Search.users.byID(owner));
			for (let owner of owners) {
				this.generic(description, owner);
			}
		} catch (e) {
			if (e) this.onError(e);
		}
	}

	/**
	 * Same as Output.prototype.sender but reacts to the message afterwards with a set of custom emojis. Order is maintained.
	 * @param {Embed} embed 
	 * @param {Channel} channel 
	 * @param {string[]} emojis - The list of emojis with which to react
	 * @param {Boolean} promisify - Use if outputting as the final call for a function and a return value is not needed
	 * @returns {Promise<Message>}
	 */
	async reactor(embed, channel, emojis, promisify = false) {
		try {
			if (!embed) throw '';
			let msg = await this[typeof channel.send === 'function' ? 'sender' : 'editor'](embed, channel);
			let f = () => msg ? msg.react(emojis.shift()).catch(() => {}) : () => {};
			for (let i = 0; i < emojis.length; i++) {
				if (!msg) break;
				if (promisify) await f();
				else setTimeout(f, i * 1000);
			}
			return msg;
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}
	
	/**
	 * @typedef {object} confirmOptions
	 * @property {object} author - The user allowed to choose an option
	 * @property {object} channel - The channel this message should be posted in
	 * @property {function} action - The type of action that is being confirmed. Default description is 'Please confirm \'action\''
	 * @property {number} time - The time in milliseconds allowed for the user to pick an option in ms. Defaults to 18000 (18 seconds).
	 * @property {Message} editor - Whether the message should edit a previous message, rather than posting a new confirmation message
	 * @property {Boolean} cancel - Is this a confirmation to cancel? If so, return true on timeout
	 */

	/**
	 * Returns a user-defined option
	 * @param {confirmOptions} data 
	 * @property {object} author - The user allowed to choose an option
	 * @property {role} role - If no author is supplied, the role allowed to choose an option
	 * @property {object} channel - The channel this message should be posted in
	 * @property {string} description - Write a custom description for the confirmation message? If so, renders redundant the 'action' property
	 * @property {Embed} embed - An embed to use. If found, bypasses 'description' field.
	 * @property {string} action - The type of action that is being confirmed. Default description is 'Please confirm \'action\''
	 * @property {number} time - The time in milliseconds allowed for the user to pick an option in ms. Defaults to 18000 (18 seconds).
	 * @property {Message} editor - Whether the message should edit a previous message, rather than posting a new confirmation message
	 * @property {Boolean} cancel - Is this a confirmation to cancel? If so, return true on timeout
	 * @param {Boolean} r - Whether to return a Boolean value of the confirmation result (true) or simply throw on confirmation failure
	 * @returns {Promise<Boolean?>}
	 */
	async confirm({
		author = this.author,
		channel = this.channel,
		description = '',
		action = 'this action',
		time = 30000,
		embed = undefined,
		editor = undefined,
		role = undefined,
		cancel = false,
		autodelete = true,
		errors = []
	} = {}, r = false) {
		try {
			const emojis = ['✅', '❎'];
			const rfilter = (reaction, user) => {
				if (!emojis.includes(reaction.emoji.name)) return false;
				if (author.id === user.id) return true;
				if (!this.member) this.member = this.Search.members.byUser(user);
				if (role && this.Permissions.role(role, this)) return true;
				return false;
			};
			const mfilter = m => m.author.id === author.id && /^(?:y(?:es)?|n(?:o)?|true|false)$/i.test(m.content);
			const awaitOptions = {
				max: 1,
				time,
				errors: ['time']
			};
			let msg = await this.reactor(
				embed || new Embed().setDescription(description || '**' + author.tag + '** Please confirm ' + action + '.'),
				editor || channel,
				emojis.slice(0)
			);
			let collected = await Promise.race([
				(async () => {
					let rcollected = await msg.awaitReactions(rfilter, awaitOptions).catch(() => {});
					if (rcollected.first().emoji.name === '✅') return true;
					if (rcollected.first().emoji.name === '❎') return false;
				})().catch(() => {}),
				(async () => {
					let mcollected = await msg.channel.awaitMessages(mfilter, awaitOptions).catch(() => {});
					mcollected.first().delete(1000).catch(() => {});
					if (/^(?:y(?:es)?|true)$/i.test(mcollected.first().content)) return true;
					if (/^(?:n(?:o)?|false)$/i.test(mcollected.first().content)) return false;
				})().catch(() => {})
			]);
			if (autodelete !== false) msg.delete().catch(() => {});
			else msg.clearReactions().catch(() => {});
			if (typeof collected !== 'boolean') {
				collected = false;
				if (cancel) return true;
				if (errors.includes('time')) throw '';
			}
			if (!collected && !r) throw '';
			return collected;
		} catch (e) {
			if (e) this.Output.onError(e);
			throw '';
		}
	}
	
	/**
	 * @typedef {object} chooseOptions
	 * @property {object} author - The user allowed to choose an option
	 * @property {object} channel - The channel this message should be posted in
	 * @property {function} filter - The list of options that should be displayed in the choose message
	 * @property {number} time - The time in milliseconds allowed for the user to pick an option in ms. Defaults to 18000 (18 seconds).
	 * @property {string} title - The embed title of the choose message that should be displayed. Can be anything.
	 * @property {string} option - The kind of thing that is chosen. Will be displayed as 'Please choose a [...]'
	 */

	/**
	 * Returns a user-defined option
	 * @param {chooseOptions} data 
	 * @property {object} author - The user allowed to choose an option
	 * @property {Boolean} autodelete - Whether the choose dialogue should be delete once an option has been chosen. Defaults to true.
	 * @property {object} channel - The channel this message should be posted in
	 * @property {description} description - A message to be displaye with the choose dialogue. Will be displayed in the 'title' field
	 * @property {function} options - The list of options that should be displayed in the choose message
	 * @property {number} time - The time in milliseconds allowed for the user to pick an option in ms. Defaults to 18000 (18 seconds).
	 * @property {string} title - The embed title of the choose message that should be displayed. Can be anything.
	 * @property {string} type - The kind of thing that is chosen. Will be displayed as 'Please choose a [...]'
	 * @returns {Promise<Number?>}
	 */
	async choose({
		author = this.author,
		autodelete = true,
		channel = this.channel,
		description = '',
		options = [],
		time = 18000,
		title = '',
		type = 'option'
	} = {}) {
		try {
			let emojis = this.Search.emojis.constructor.unicodes.slice(1, options.length + 1).concat(['❎']);
			let embed = new Embed()
				.setTitle(description ? description : `Please choose a${type.vowel() ? 'n' : ''} ${type}:`)
				.setDescription(options.map((option, i) => this.Search.emojis.get(emojis[i]) + '**' + option + '**\n'))
				.setAuthor(title);
			let msg = await this.reactor(embed, channel, emojis);
			const rfilter = (reaction, user) => {
				if (user.id !== author.id) return false;
				if (reaction.emoji.name === '❎') return true;
				if (this.Search.emojis.constructor.unicodes.indexOf(reaction.emoji.name) < 1) return false;
				if (this.Search.emojis.constructor.unicodes.indexOf(reaction.emoji.name) > options.length) return false;
				return true;
			};
			const mfilter = (m) => {
				if (m.author.id !== author.id) return false;
				if (!m.content) return false;
				if (m.content === 'cancel') return true;
				if (m.content.length !== 1) return false;
				if (this.Search.emojis.constructor.hexatrigintamals.indexOf(m.content) < 1) return false;
				if (this.Search.emojis.constructor.hexatrigintamals.indexOf(m.content) > options.length) return false;
				return true;
			};
			const awaitOptions = {
				max: 1,
				time,
				errors: ['time']
			};
			try {
				const number = await Promise.race([
					(async () => {
						let rcollected = await msg.awaitReactions(rfilter, awaitOptions).catch(() => {});
						if (rcollected.first().emoji.name === '❎') throw '';
						return this.Search.emojis.constructor.hexatrigintamals[this.Search.emojis.constructor.unicodes.indexOf(rcollected.first().emoji.name)];
					})().catch(() => {}),
					(async () => {
						let mcollected = await msg.channel.awaitMessages(mfilter, awaitOptions).catch(() => {});                          
						await mcollected.first().delete(1000).catch(() => {}); 
						if (mcollected.first().content === 'cancel') throw ''; 
						return this.Search.emojis.constructor.hexatrigintamals.indexOf(mcollected.first().content);
					})().catch(() => {})
				]);
				if (!number) throw null;
				return number - 1;
			} catch (e) {
				throw e;
			} finally {
				if (autodelete !== false) await msg.delete().catch(() => {});
				else msg.clearReactions().catch(() => {});
			}
		} catch (e) {
			if (e) this.onError(e);
			else throw e;
		}
	}
	
	/**
	 * @typedef {object} responseOptions
	 * @property {object} author - The user allowed to choose an option
	 * @property {object} channel - The channel this message should be posted in
	 * @property {string} description = The description to display in the embed message
	 * @property {function} filter - Valid message.content responses that shold be accepted
	 * @property {number} time - The time in milliseconds allowed for the user to respond. Defaults to 60000 (100 seconds).
	 * @property {string} title - The embed title of the choose message that should be displayed. Can be anything.
	 * @property {string} footer - A footer to be included in the embed, if desired
	 * @property {Message} editor - If this response message should be posted as an edit of a previous message, the message should be sent here
	 * @property {Boolean} number - If acceptable responses should be numbers
	 * @property {Boolean} oneword - If acceptable responses should be only one word
	 */

	/**
	 * Returns a user-defined option
	 * @param {responseOptions} data 
	 * @property {object} author - The user allowed to choose an option. Defaults to this.author
	 * @property {object} channel - The channel in which this message should be posted. Defaults to this.channel
	 * @property {string} description = The description to display in the embed message. Defaults to 'Please type your response below'
	 * @property {function} filter - Valid message.content responses that shold be accepted. Defaults to any
	 * @property {number} time - The time in milliseconds allowed for the user to respond. Defaults to 60000 (100 seconds).
	 * @property {string} title - The embed title of the choose message that should be displayed, if desired. Can be anything.
	 * @property {string} footer - A footer to be included in the embed, if desired
	 * @property {Message} editor - If this response message should be posted as an edit of a previous message, the message should be sent here
	 * @property {Boolean} number - If acceptable responses should be numbers
	 * @property {Boolean} oneword - If acceptable responses should be only one word
	 * @property {Boolean} json - If the response should be parsed as a JSON
	 * @param {Boolean} r - If the whole message object should be returned, rather than just the content
	 * @returns {Promise<string|Number|Message>}
	 */
	async response({
		title = '',
		description = 'Please type your response below.',
		footer = '',
		author = this.author,
		channel = this.channel,
		editor = undefined,
		filter = () => true,
		number = false,
		oneword = false,
		json = false,
		time = 60000
	} = {}, r) {
		try {
			let msg = await this.reactor(new Embed()
				.setAuthor(title)
				.setDescription(description)
				.setFooter(footer)
			, editor || channel, ['❎']);
			const rfilter = (reaction, user) => {
				if (user.id !== author.id) return false;
				if (reaction.emoji.name !== '❎') return false;
				return true;
			};
			const mfilter = (m) => {
				if (m.author.id !== author.id) return false;
				if (m.content === undefined) return false;
				if (isNaN(m.content) && number) return false;
				if (m.content.trim().split(/\s+/g).length > 1 && oneword) return false;
				return filter(m);
			};
			const awaitOptions = {
				max: 1,
				time,
				errors: ['time']
			};
			try {
				let collected = await Promise.race([
					(async () => {
						let reaction = await msg.awaitReactions(rfilter, awaitOptions).catch(() => {});
						if (reaction) return false;
						throw '';
					})().catch(() => {}),
					msg.channel.awaitMessages(mfilter, awaitOptions).catch(() => {})
				]);
				msg.delete().catch(() => {});
				if (!collected) throw '';
				try {
					if (json) r = JSON.parse(r);
				} catch (e) {
					throw 'Couldn\t parse ' + r + ' as JSON';
				}
				if (r) return collected.first();
				else {
					let value = collected.first().content;
					collected.first().delete().catch(() => {});
					return value;
				}
			} catch (e) {
				throw e;
			}
		} catch (e) {
			if (e) this.Output.onError(e);
			throw e;
		}
	}

}

module.exports = Output;