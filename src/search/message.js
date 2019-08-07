const Search = require('../util/search');

class Message extends Search {
	constructor(message) {
		super(message);
		if (this.searchChannel) this.channel = this.searchChannel;
	}

	/**
	 * Searches for a message using a resolvable. Returns it if so; if user is used as resolvable, returns its first.
     * @typedef {string} MessageResolvable
     * @param {MessageResolvable} searchstring @default false
     * @param {boolean} fetch @default false - Whether to guarantee to fetch the message if it exists, rather than just check in cache
     * @param {boolean} exactmode 
	 * @public
     */
	get(searchstring, fetch = false, exactmode = false) {
		if (typeof searchstring !== 'string') return null;
		if (searchstring.length < 2) return null;
		let message;
		const getters = [
			() => this.byID(searchstring, fetch),
			() => this.byContent(searchstring, fetch, exactmode),
			() => this.byUserResolvable(searchstring, fetch, exactmode).first()
		];
		if (!fetch) {
			while (!message && getters[0]) getters.shift().call(this);
			return message;
		} else return new Promise(async (res, rej) => {
			try {
				while (!message && getters[0]) message = await getters.shift().call(this);
				res(message);
			} catch (e) {
				rej(e);
			}
		});
	}

	/**
	 * @param {string} snowflake 
     * @param {boolean} fetch @default false - Whether to guarantee to fetch the message if it exists, rather than just check in cache
	 * @returns {null|Message|Promise<Message>}
	 * @public
	 */
	byID(snowflake, fetch = false) {
		let id = snowflake.match(/[0-9]{18}/);
		if (!id) return null;
		return fetch ? this.channel.fetchMessage(id[0]) : this.channel.find(message => id[0] === message.id);
	}

	/**
	 * Caches more messages for the instance channel
	 * @returns {Promise<Collection<Snowflake, Message>} List of just-fetched messages. Use this.channel.messages for all messages
	 * @public
	 */
	async extend(filter) {
		let total = this.channel.messages;
		for (let i = 0; i < 10 ; i++) {
			let fetched = await this.channel.fetchMessages({
				limit: 100,
				before: this.channel.messages.last().id
			});
			total = total ? total.concat(fetched) : fetched;
			let matched = fetched.filter(filter);
			if (matched.size > 0) break;
		}
	}

	/**
     * @param {UserResolvable} searchstring 
     * @param {boolean} fetch @default false
     * @param {boolean} exactmode @default false
	 * @returns {null|Collection<id, Message>|Promise<Collection<id, Message>>}
	 * @public
     */
	byUserResolvable(searchstring, fetch = false, exactmode) {
		let user = this.Search.users.get(searchstring, exactmode);
		if (!user) throw new Error('Unknown user: ' + searchstring);
		let userm = this.channel.messages.filter(m => m.author.id === user.id);
		if (!fetch) return userm.first();
		return this.extend(m => m.author.id === user.id);
	}

	/**
     * @param {string} string 
     * @param {boolean} exactmode 
	 * @returns {null|Message}
	 * @public
     */
	byContent(string, fetch = false, exactmode) {
		let filter = exactmode ? m => m.content.toLowerCase() === string.toLowerCase() : m => m.content.toLowerCase().startsWith(m.content.toLowerCase());
		if (!fetch) return this.channel.messages.find(filter);
		return new Promise(async (res, rej) => {
			try {
				await this.extend(filter);
				res(this.channel.messages.find(filter));
			} catch (e) {
				rej(e);
			}
		});
	}

	/**
     * @param {string} string 
     * @param {boolean} exactmode 
	 * @returns {null|Message}
	 * @public
     */
	byEmbedTitle(string, fetch = false, exactmode) {
		let filter = exactmode ? m => m.embeds[0].title.toLowerCase() === string.toLowerCase() : m => m.embeds[0].title.toLowerCase().startsWith(string.toLowerCase());
		if (!fetch) return this.channel.messages.find(filter);
		return new Promise(async (res, rej) => {
			try {
				await this.extend(filter);
				res(this.channel.messages.find(filter));
			} catch (e) {
				rej(e);
			}
		});
	}
}

module.exports = Message;