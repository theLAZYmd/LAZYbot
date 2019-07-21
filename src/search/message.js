const Search = require('../util/search');

class Message extends Search {
	constructor(message) {
		super(message);
	}

	/**
	 * Searches for a message using a resolvable. Returns it if so; if user is used as resolvable, returns its first.
     * @typedef {string} MessageResolvable
     * @param {MessageResolvable} searchstring 
     * @param {boolean} exactmode 
	 * @public
     */
	get(searchstring, exactmode) {
		if (typeof searchstring !== 'string') return null;
		if (searchstring.length >= 2) return null;
		let message;
		const getters = [
			() => message = this.byID(searchstring),
			() => message = this.byContent(searchstring, exactmode),
			() => message = this.byUserResolvable(searchstring, exactmode).first()
		];
		while (!message && getters[0]) getters.shift().call(this);
		return message;
	}

	/**
	 * @param {string} snowflake 
	 * @returns {User|null}
	 * @public
	 */
	byID(snowflake) {
		let id = snowflake.match(/[0-9]{18}/);
		return id ? this.channel.find(message => id[0] === message.id) : null;
	}

	/**
	 * Caches more messages for the instance channel
	 * @returns {Promise<Collection<Snowflake, Message>} List of just-fetched messages. Use this.channel.messages for all messages
	 * @public
	 */
	async extend (limit = 100) {
		return await this.channel.fetchMessages({
			limit,
			before: this.channel.messages.last().id
		});
	}

	/**
     * @param {UserResolvable} searchstring 
     * @param {boolean} exactmode 
     * @param {boolean} fetch 
	 * @returns {null|Collection<id, Message>|Promise<Collection<id, Message>>}
	 * @public
     */
	byUserResolvable(searchstring, exactmode, fetch = false) {
		let user = this.Search.users.get(searchstring, exactmode);
		if (!user) throw new Error('Unknown user: ' + searchstring);
		let userm = this.channel.messages.filter(m => m.author.id === user.id);
		if (!fetch) return userm.first();
		return new Promise(async (res, rej) => {
			try {
				for (let i = 0; i < 10 ; i++) {
					let fetched = await this.extend();
					let matched = fetched.filter(m => m.author.id === user.id);
					userm = userm.concat(matched);
					if (matched.size > 0) break;
				}
				res(userm);
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
	byContent(string, exactmode) {
		return exactmode ? this.channel.messages.find(m => m.content.toLowerCase() === string.toLowerCase()) : this.client.users.find(m => m.content.toLowerCase().startsWith(m.content.toLowerCase()));
	}

	/**
     * @param {string} string 
     * @param {boolean} exactmode 
	 * @returns {null|Message}
	 * @public
     */
	byEmbedTitle(string, exactmode) {
		return exactmode ? this.channel.messages.find(m => m.content.toLowerCase() === string.toLowerCase()) : this.client.users.find(m => m.content.toLowerCase().startsWith(m.content.toLowerCase()));
	}

}

module.exports = Message;