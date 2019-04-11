const config = require('../config.json');
const Embed = require('./embed');
const Parse = require('./parse');

class Output extends Parse {

	constructor(message) {
		super(message);
	}

	async sender(embed, channel = this.channel) {
		try {
			if (!embed) throw 'this.Output.sender(): Embed object is undefined.';
			if (!embed.color) embed.color = config.colors.generic;
			if (channel.channel || channel.constructor.name === 'Message') channel = channel.channel;
			let content = embed.content;
			embed = Embed.receiver(embed);
			if (typeof embed._apiTransform === 'function') embed = embed._apiTransform();
			return await channel.send(content, {embed});
		} catch (e) {
			if (e) this.log(e);
		}
	}

	async editor(embed, msg) {
		try {
			if (!embed) throw 'this.Output.editor(): Embed object is undefined.';
			if (!msg) throw 'this.Output.editor(): Couldn\'t find message to edit.';
			if (!embed.color) embed.color = config.colors.generic;
			let content = embed.content;
			embed = Embed.receiver(embed);
			if (typeof embed._apiTransform === 'function') embed = embed._apiTransform();
			return await msg.edit(content, {embed});
		} catch (e) {
			if (e) this.log(e);
		}
	}

	async generic(description, channel) {
		try {
			return await this.sender({
				description
			}, channel);
		} catch (e) {
			if (e) this.onError(e);
		}
	}

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

	async data(json, channel, type = 'json') {
		try {
			let string = (typeof json === 'object' ? JSON.stringify((typeof json._apiTransform === 'function' ? json._apiTransform() : json), null, 2) : json).replace(/`/g, '\\`');
			let index = Math.ceil(string.length / 2000);
			let keylength = Math.floor(string.length / index);
			for (let i = 0; i < index; i++) {
				this.sender(new Embed()
					.setColor(config.colors.data)
					.setDescription((string.slice(i * keylength, (i === index.length - 1 ? string.length + 2 : i * keylength + keylength)) + ' '.repeat(48) + '\u200b').format(type))
					.setFooter((i + 1) + ' / ' + index)
				, channel);
			}
		} catch (e) {
			if (e) this.onError(e);
		}
	}

	async onError(error, channel = this.channel) {
		try {
			console.log(error);
			if (!error) throw '';
			this.error(error);
			let description = error;
			if (typeof error === 'object') {
				if (error.name && error.message) description = '**' + error.name + ':** ' + error.message;
				else return;
			}
			return await this.sender(new Embed()
				.setDescription(description.replace(/\${([a-z]+)}/gi, value => this.server.prefixes[value.match(/[a-z]+/i)]))
				.setColor(config.colors.error)
			, channel);
		} catch (e) {
			if (e) this.log(e);
		}
	}

	async owner(description) {
		try {
			let owners = config.ids.owner.map(owner => this.Search.users.byID(owner));
			for (let owner of owners)
				this.generic(description, owner);
		} catch (e) {
			if (e) this.onError(e);
		}
	}

	async reactor(embed, channel, emojis) { //sends a message with custom emojis
		try {
			if (!embed) throw '';
			let msg = await this[typeof channel.send === 'function' ? 'sender' : 'editor'](embed, channel); //send it
			for (let i = 0; i < emojis.length; i++) { //then react to it
				setTimeout(() => {
					if (msg) msg.react(emojis[i]).catch(() => {
					});
				}, i * 1000); //prevent api spam and to get the order right
			}
			return msg;
		} catch (e) {
			if (e) this.Output.onError(e);
			throw e;
		}
	}

	async confirm(data = {}, r) {
		try {
			data = Object.assign({
				action: 'this action',
				channel: this.channel,
				author: this.author,
				time: 30000,
				errors: []
			}, data);
			data.emojis = ['✅', '❎'];
			let msg = await this.reactor(data.embed ? data.embed : {
				description: data.description ? data.description : '**' + data.author.tag + '** Please confirm ' + data.action + '.'
			}, data.editor ? data.editor : data.channel, data.emojis);
			let rfilter = (reaction, user) => data.emojis.includes(reaction.emoji.name) && (data.author.id === user.id || (data.role && this.Permissions.role(data.role, new Parse(msg))));
			let mfilter = (m) => m.author.id === data.author.id && /^(?:y(?:es)?|n(?:o)?|true|false)$/i.test(m.content);
			let collected = await Promise.race([
				(async () => {
					let rcollected = await msg.awaitReactions(rfilter, { //wait for them to react back
						max: 1,
						time: data.time,
						errors: ['time']
					}).catch(() => {
					});
					if (rcollected.first().emoji.name === '✅') return true;
					if (rcollected.first().emoji.name === '❎') return false;
				})().catch(() => {
				}),
				(async () => {
					let mcollected = await msg.channel.awaitMessages(mfilter, {
						max: 1,
						time: data.time,
						errors: ['time']
					});
					mcollected.first().delete(1000).catch(() => {
					});
					if (/^(?:y(?:es)?|true)$/i.test(mcollected.first().content)) return true;
					if (/^(?:n(?:o)?|false)$/i.test(mcollected.first().content)) return false;
				})().catch(() => {
				})
			]);
			data.autodelete !== false ? msg.delete().catch(() => {
			}) : msg.clearReactions().catch(() => {
			});
			if (typeof collected !== 'boolean') {
				collected = false;
				if (data.cancel) return true;
				if (data.errors.includes('time')) throw '';
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
     * @property {object} channel - The channel this message should be posted in
     * @property {function} filter - The list of options that should be displayed in the choose message
     * @property {number} time - The time in milliseconds allowed for the user to pick an option in ms. Defaults to 18000 (18 seconds).
     * @property {string} title - The embed title of the choose message that should be displayed. Can be anything.
     * @property {string} option - The kind of thing that is chosen. Will be displayed as 'Please choose a [...]'
     * @returns {number}
     */
	async choose(data = {}) {
		try {
			data = Object.assign({
				author: this.author,
				channel: this.channel,
				options: [],
				time: 18000,
				title: '',
				type: 'option'
			}, data);
			let description = '';
			let emojis = this.Search.Emojis.unicodes.slice(1, data.options.length + 1);
			let author = data.title ? {
				name: data.title
			} : {};
			let title = data.description ? data.description : `Please choose a${data.type.vowel() ? 'n' : ''} ${data.type}:`;
			for (let i = 0; i < data.options.length; i++) {
				description += this.Search.emojis.get(emojis[i]) + '**' + data.options[i] + '**\n';
			}
			emojis.push('❎');
			let msg = await this.reactor({
				author,
				title,
				description
			}, data.channel, emojis);
			let rfilter = (reaction, user) => {
				if (user.id !== data.author.id) return false;
				if (reaction.emoji.name === '❎') return true;
				if (this.Search.Emojis.unicodes.indexOf(reaction.emoji.name) < 1) return false;
				if (this.Search.Emojis.unicodes.indexOf(reaction.emoji.name) > data.options.length) return false;
				return true;
			};
			let mfilter = (m) => {
				if (m.author.id !== data.author.id) return false;
				if (!m.content) return false;
				if (m.content === 'cancel') return true;
				if (m.content.length !== 1) return false;
				if (this.Search.Emojis.hexatrigintamals.indexOf(m.content) < 1) return false;
				if (this.Search.Emojis.hexatrigintamals.indexOf(m.content) > data.options.length) return false;
				return true;
			};
			try {
				let number = await Promise.race([
					(async () => {
						let rcollected = await msg.awaitReactions(rfilter, { //wait for them to react back
							max: 1,
							time: data.time,
							errors: ['time']
						}).catch(() => {});
						if (rcollected.first().emoji.name === '❎') throw '';
						return this.Search.Emojis.hexatrigintamals[this.Search.Emojis.unicodes.indexOf(rcollected.first().emoji.name)];
					})().catch(() => {}),
					(async () => {
						let mcollected = await msg.channel.awaitMessages(mfilter, {
							max: 1,
							time: data.time,
							errors: ['time']
						}).catch(() => {});                          
						mcollected.first().delete(1000).catch(() => {}); 
						if (mcollected.first().content === 'cancel') throw ''; 
						return this.Search.Emojis.hexatrigintamals.indexOf(mcollected.first().content);
					})().catch(() => {})
				]);
				if (!number) throw null;                
				data.autodelete !== false ? msg.delete().catch(() => {}) : msg.clearReactions().catch(() => {});
				return number - 1; //and if valid input, send of modmail for that guild
			} catch (e) {
				data.autodelete !== false ? msg.delete().catch(() => {}) : msg.clearReactions().catch(() => {});
				throw e;
			}
		} catch (e) {
			if (e) this.onError(e);
			else throw e;
		}
	}

	async response(data = {}, r) {
		try {
			data = Object.assign({
				author: this.author,
				channel: this.channel,
				description: 'Please type your response below.',
				filter: () => {
					return true;
				},
				number: false,
				time: 60000
			}, data);
			let author = data.title ? Embed.author(data.title) : {};
			let msg = await this.reactor(new Embed()
				.setAuthor(data.title || '')
				.setDescription(data.description || '')
				.setFooter(data.footer || '')
			, data.editor ? data.editor : data.channel, ['❎']);
			let rfilter = (reaction, user) => {
				if (user.id !== data.author.id) return false;
				if (reaction.emoji.name !== '❎') return false;
				return true;
			};
			let mfilter = m => m.author.id === data.author.id && m.content !== undefined && (!isNaN(m.content) || !data.number) && (m.content.trim().split(/\s+/g).length === 1 || !data.oneword) && data.filter(m); //condition, plus user speicifed filter
			try {
				let collected = await Promise.race([
					(async () => {
						let reaction = await msg.awaitReactions(rfilter, { //wait for them to react back
							max: 1,
							time: data.time,
							errors: ['time']
						});
						if (reaction) return false;
						throw '';
					})().catch(() => {
					}),
					msg.channel.awaitMessages(mfilter, {
						max: 1,
						time: data.time,
						errors: ['time']
					})
				]);
				if (!collected) throw '';
				msg.delete().catch(() => {
				});
				if (r) return collected.first();
				else {
					let value = collected.first().content;
					collected.first().delete().catch(() => {
					});
					return value;
				}
			} catch (e) {
				msg.delete().catch((e) => {
				});
				throw e;
			}
		} catch (e) {
			if (e) this.Output.onError(e);
			throw e;
		}
	}

}

module.exports = Output;