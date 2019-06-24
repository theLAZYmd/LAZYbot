const {    RichEmbed   } = require('discord.js');

class Embed extends RichEmbed {

	constructor(data = {}) {
		super(data);
		this.content = data.content;
	}

	/**
	 * Sets the content of an embed to be sent as message.content
	 * @param {string} content 
	 * @returns {Embed}
	 */
	setContent(content) {
		content = resolveString(content);
		if (content.length > 2000) throw new RangeError('Message content may not exceed 2000 characters.');
		this.content = content;
		return this;
	}

	/**
	 * Sets a field on a RichEmbed, identified by an index number
	 * @param {string} name 
	 * @param {string} value 
	 * @param {Boolean} inline 
	 * @param {Number} index 
	 */
	setField(name, value, inline, index) {
		if (typeof index === 'undefined') return this.addField(name, value, index);
		if (typeof index !== 'number') throw new TypeError('Index must be a number');
		if (index < 0) index = this.fields.length + index;
		if (!this.fields[index]) throw new RangeError('Index value must be between 0 and ' + this.fields.length - 1 );
		this.fields[index](name, value, inline, index);
		return this;
	}

	/**
	 * Removes a field from an embed, identified by index number
	 * @param {Number} index 
	 * @returns {Embed}
	 */
	removeField(index) {
		if (typeof index !== 'number') throw new TypeError('Index must be a number');
		if (index < 0) index = this.fields.length + index;
		if (!this.fields[index]) throw new RangeError('Index value must be between 0 and ' + this.fields.length - 1 );
		this.fields.splice(index, 1);
		return this;
	}

	static fielder(fields = [], name = ' \u200b', value = ' \u200b', inline = false) {
		fields.push({
			name,
			value,
			inline
		});
		return fields;
	}

	static author(name, url, icon_url) {
		let author = {};
		author.name = name;
		if (url) author.url = url;
		if (icon_url) author.icon_url = icon_url;
		return author;
	}

	static thumbnail(link) {
		return {
			url: link
		};
	}

	static image(image) {
		return {
			url: image
		};
	}

	static footer(text, icon_url) {
		let footer = {};
		if (text) footer.text = text;
		if (icon_url) footer.icon_url = icon_url;
		return footer;
	}

	static receiver(embed) {
		let misprop = ['image', 'thumbnail'];
		for (let prop of misprop)
			if (typeof embed[prop] === 'string') embed[prop] = {url: embed[prop]};
		for (let field of embed.fields || []) {
			if (field.name === '') field.name = ' \u200b';
			if (field.value === '') field.value = ' \u200b';
			if (field.inline === undefined) field.inline = false;
		}
		return new Embed(embed);
	}

}

module.exports = Embed;

function resolveString(data) {
	if (typeof data === 'string') return data;
	if (data instanceof Array) return data.join('\n');
	return String(data);
}