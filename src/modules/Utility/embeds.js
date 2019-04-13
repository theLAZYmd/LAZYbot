const Parse = require('../../util/parse');
const DataManager = require('../../util/datamanager');
const rp = require('request-promise');
const config = require('../../config.json');
const Embed = require('../../util/embed');

class Embeds extends Parse {
	constructor(message) {
		super(message);
	}

	async find(arg) {
		try {
			let file = await this.getEmbeds();
			for (let [, collection] of Object.entries(file)) {
				for (let [key, embed] of Object.entries(collection)) {
					if (arg !== key) continue;
					return Array.isArray(embed) ? embed : [embed];
				}
			}
			return null;
		} catch (e) {
			if (e) throw e;
		}
	}

	async post(args) {
		try {
			if (typeof args === 'string') args = [args];
			for (let a of args)
				this.Output.embed(a);
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	async list() {
		try {
			let prefix = this.server.prefixes.nadeko + '..';
			let file = await this.getEmbeds();
			let embed = new Embed()
				.setTitle(`Guides for server ${this.guild.name} on ${this.client.user.username}`)
				.setColor(11126483)
				.setFooter(`Type "${prefix} GuideName" to view a guide. e.g. "${prefix} zh"`);
			for (let [name, collection] of Object.entries(file)) { //for each subsection
				let embeds = Object.keys(collection);
				let value = embeds.reduce((str, guide, i) => {
					let line = prefix + ' ' + guide;
					str += line;
					str += (i < embeds.length - 1 && !(i & 1) ? ' '.repeat(Math.max(0, 28 - line.length)) + '\u200b' : '');
					str += (i & 1 ? '\n' : '');
					return str;
				}, '').format('css');
				embed.addField(name.toProperCase(), value, true);
			}
			this.Output.sender(embed);
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	async getEmbeds() {
		if (this._embeds) return this._embeds;
		try {
			if (this.client.user.id === config.ids.betabot) throw '';
			return await rp.get({
				uri: config.urls.embeds,
				json: true
			});
		} catch (e) {
			if (e) this.Output.onError(e);
			this._embeds = DataManager.getFile('./src/data/embeds.json');
		}
		return this._embeds;
	}

}

module.exports = Embeds;