const Parse = require('../util/parse');
const Embed = require('../util/embed');
const config = require('../config.json');

class Quote extends Parse {

	constructor (message) {
		super(message);
	}

	get quote () {
		if (this._quote) return this._quote;
		return this._quote = this.client.open[this.message.id];
	}

	set quote(obj) {
		this._quote = obj;
	}

	get target () {
		if (this._target) return this._target;
		return this._target = this.Search.users.byID(this.quote.target);
	}

	get quoteChannel () {
		let channel = this.Search.channels.byID(this.quote.channel);
		if (!channel) delete this.client.open[this.message.id];
		return channel;
	}

	async extend () {
		let params = {
			limit: 100
		};
		if (this.userm.size !== 0) params.before = this.userm.last().id;
		return await this.quoteChannel.fetchMessages(params);
	}

	async getUserm () {
		this.userm = this.quoteChannel.messages.filter(m => m.author.id === this.quote.target);
		let i = 0;
		let size = 0;
		while (this.userm.size === 0 && i < 10) {
			this.all = await this.extend();
			this.userm = this.userm.concat(this.all.filter(m => m.author.id === this.quote.target));
			if (this.userm.size === size) break;
			size = this.userm.size;
			i++;
		}
		return this.userm;
	}

	async getArr () {
		let userm = await this.getUserm();
		return userm.array().sort((a, b) => b.createdTimestamp - a.createdTimestamp);
	}

	async getEmbed(index) {
		let arr = await this.getArr();
		let i = 0;
		let size = 0;
		while (index >= arr.length - 3 && i < 5) {
			await this.extend();
			arr = await this.getArr();
			if (this.userm.size === size) break;
			size = this.userm.size;
			i++;
		}
		let m = arr[index];
		return new Embed(this.message.embeds[0])
			.setColor(config.colors.background)
			.setAuthor([
				this.target.tag,
				m ? m.createdAt.toString().slice(0, 21) : '-',
				'#' + this.quoteChannel.name,
				(arr.length - index) + ' / ' + arr.length
			].join(', '), this.target.avatarURL)
			.setDescription(m ? m.content : '');
	}
}

module.exports = Quote;