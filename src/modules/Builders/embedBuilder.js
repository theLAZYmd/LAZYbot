const Parse = require('../../util/parse');
const Embed = require('../../util/embed');

class Builder extends Parse {

	constructor(message) {
		super(message);
	}

	/**
	 * @returns {Map}
	 */
	get actives () {
		if (this._actives) return this._actives;
		let server = this.server;
		if (!server.builds) server.builds = {};
		return this._actives = new Map(Object.entries(server.builds));
	}

	/**
	 * @property {Map} actives
	 */
	set actives (actives) {
		let server = this.server;
		server.builds = Array.from(actives).reduce((obj, [key, value]) => {
			obj[key] = value;
			return obj;
		}, {});
		this.server = server;
		this._actives = actives;
	}

	/**
	 * Gets the message to edit
	 * @private
	 * @returns {Promise<Message>}
	 */
	getDialogue() {
		this.msgID = this.actives.get(this.channel.id);
		if (!this.msgID) throw new Error('Couldn\'t find matching message reference');
		return this.channel.fetchMessage(this.msgID.dialogue);
	}

	/**
	 * Gets the message to edit
	 * @private
	 * @returns {Promise<Message>}
	 */
	getMessage() {
		this.msgID = this.actives.get(this.channel.id);
		if (!this.msgID) throw new Error('Couldn\'t find matching message reference');
		return this.channel.fetchMessage(this.msgID.embed);
	}

	/**
	 * Creates a new working embed for the channel
	 * @public
	 */
	async build () {
		let dialogue = await this.Output.generic(`Beginning new Embed builder in channel ${this.channel}...\nType ${this.prefixes.get('generic')}publish to embed build.`);
		let embed = await this.Output.generic('');
		let actives = this.actives;
		actives.set(this.channel.id, {
			dialogue: dialogue.id,
			embed: embed.id
		});
		this.actives = actives;
		this.message.delete();
	}

	/**
	 * Sets a property on a working embed in the channel
	 * @param {string} string
	 * @public
	 */
	async set (string = this.argument) {
		try {
			let property = this.command.replace('set', '').toProperCase();
			if (!/^(?:title|author|description|footer|content|url|color|image|thumbnail)$/i.test(property)) throw 'Invalid property to set on embed';
			property = property.replace(/url/i, 'URL');
			let message = await this.getMessage();
			let embed = new Embed(message.embeds[0]);
			embed['set' + property](string);
			this.Output.editor(embed, message);
			this.message.delete();
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}


	/**
	 * Adds a field on a working embed in the channel
	 * @param {string} name
	 * @public
	 */
	async addField (name = this.argument) {
		try {
			let message = await this.getMessage();
			let embed = new Embed(message.embeds[0]);
			let value = await this.Output.response({
				description: 'Please write a \'value\' for this field'
			});
			let inline = await this.Output.confirm({
				description: 'Make the field inline?'
			}, true);
			embed.addField(name, value, inline);
			this.Output.editor(embed, message);
			this.message.delete();			
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}


	async publish () {
		let message = await this.getDialogue();
		message.delete();
		let actives = this.actives;
		actives.delete(this.channel.id);
		this.actives = actives;
		this.message.delete();
	}

}

Builder.active = {};

module.exports = Builder;