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
		try {
			let dialogue = await this.Output.generic(`Beginning new Embed builder in channel ${this.channel}...\nType \`${this.prefixes.get('generic')}publish\` to embed build.`);
			let embed = await this.Output.generic('');
			let actives = this.actives;
			actives.set(this.channel.id, {
				dialogue: dialogue.id,
				embed: embed.id
			});
			this.actives = actives;
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}
	

	/**
	 * Creates a new working embed for the channel
	 * @public
	 */
	async edit (id = this.argument) {
		try {
			let message;
			if (!id) {
				let collection = await this.channel.fetchMessages({ limit: 1});
				let msg = collection.first();
				if (msg.author.id !== this.client.user.id) throw 'Can\'t create Embed builder with no ID specified when last message is not by ' + this.client.user;
				if (!msg.embeds[0]) throw 'Embed builder must be created on message with an embed';
				message = msg;
			} else {
				if (id.length !== 18) throw 'Invalid Message ID format.';
				message = await this.channel.fetchMessage(id);
			}
			if (!message) throw 'Invalid Message ID';
			let dialogue = await this.Output.generic(`Creating new Embed builder in channel ${this.channel} on message ${id}...\nType \`${this.prefixes.get('generic')}publish\` to embed build.`);
			let actives = this.actives;
			actives.set(this.channel.id, {
				dialogue: dialogue.id,
				embed: message.id
			});
			this.actives = actives;
		} catch (e) {
			if (e) this.Output.onError(e);
		}
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
			const message = await this.getMessage();
			const embed = new Embed(message.embeds[0]);
			if (!name) name = await this.Output.response({
				description: 'Please write a \'name\' for this field'
			});
			let value = await this.Output.response({
				description: 'Please write a \'value\' for this field'
			});
			let inline = await this.Output.confirm({
				description: 'Make the field inline?'
			}, true);
			embed.addField(name, value, inline);
			this.Output.editor(embed, message);		
		} catch (e) {
			if (e) this.Output.onError(e);
		} finally {
			this.message.delete();	
		}
	}

	/**
	 * Adds a field on a working embed in the channel
	 * @param {string} name
	 * @public
	 */
	async removeField (index = this.argument) {
		try {
			let message = await this.getMessage();
			let embed = new Embed(message.embeds[0]);
			if (isNaN(Number(index))) {
				index = embed.fields.map(({name}) => name).indexOf(index);
				if (index === -1) throw 'Must specify a field to remove by Index number';
			} else index = Number(index);
			embed.removeField(index);
			this.Output.editor(embed, message);
			this.message.delete();			
		} catch (e) {
			if (e) this.Output.onError(e);
		} finally {
			this.message.delete();	
		}
	}

	async publish () {
		try {
			let message = await this.getDialogue();
			message.delete();
			let actives = this.actives;
			actives.delete(this.channel.id);
			this.actives = actives;
		} catch (e) {
			if (e) this.Output.onError(e);
		} finally {
			this.message.delete();	
		}
	}

}

Builder.active = {};

module.exports = Builder;