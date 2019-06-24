const Parse = require('../../util/parse.js');
const config = require('../../config.json');
const rp = require('request-promise');

const regexes = {
	reddit: /(?:^|\b)\/?r\/(\w{2,21})(?:^|\b)/gi,
	uri: /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)/
};

class Reddit extends Parse {

	constructor(message) {
		super(message);
	}

	/**
	 * Enforces 'reddit rules' on a channel - Image submissions only, and reacts to each message with upvote and downvote buttons
	 * @param {Message} message 
	 */
	async channel(message = this.message) {
		try {
			if (message.attachments.size === 0) return message.delete().catch(() => {});
			const names = ['upvote', 'downvote'];
			const emojis = names.map(emoji => this.Search.emojis.get(emoji));
			for (let i = 0; i < emojis.length; i++) try {
				if (!message) break;
				if (!emojis[i]) throw names[i];
				await message.react(emojis[i]).catch(() => {});
			} catch (e) {
				if (e) this.error(e);
			}
		} catch (e) {
			if (e) this.Output.onError(e);
			throw e;
		}
	}

	/**
	 * Outputs a link to a subreddit for every 'subreddit mention' in a message
	 * @param {string} content
	 * @public
	 */
	async link(content = this.message.content) {
		try {
			if (!content || !regexes.reddit.test(content)) throw '';
			let arr = await Reddit.stringToLinks(content);
			this.Output.generic(arr.join('\n'));
			return arr;
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	/**
	 * Checks a string if there are any subreddit mentions 
	 * @param {string} str 
	 */
	static async stringToLinks(str) {
		try {
			return str.match(regexes.reddit)
				.filter(n => regexes.uri.test(n))
				.filter(async (name) => {
					try {
						let uri = config.urls.reddit.api.replace('|', name);
						let body = JSON.parse(await rp({uri,
							json: true,
							timeout: 2000
						}).toString());
						if (!body) return false;
						if (body.error) return false;
						if (body.message === 'Not Found') return false;
						if (!body.after) return false;
						return true;
					} catch (e) {
						return false;
					}
				})
				.map(n => `[${config.urls.reddit.name.replace('|', n)}](${config.urls.reddit.link.replace('|', n)})`);
		} catch (e) {
			if (e) throw e;
		}
	}

}

module.exports = Reddit;