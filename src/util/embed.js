const {    RichEmbed   } = require("discord.js");

class Embed extends RichEmbed {

    constructor(data = {}) {
        super(data);
        this.content = data.content;
    }

    setContent(content) {
        content = resolveString(content);
        if (content.length > 2000) throw new RangeError('Message content may not exceed 2000 characters.');
        this.embed = embed;
        return this;
    }

	static fielder(fields = [], name = " \u200b", value = " \u200b", inline = false) {
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
			"url": link
		}
	}

	static image(image) {
		return {
			"url": image
		}
	}

	static footer(text, icon_url) {
		let footer = {};
		if (text) footer.text = text;
		if (icon_url) footer.icon_url = icon_url;
		return footer
	}

	static receiver(embed) {
		let misprop = ["image", "thumbnail"];
		for (let prop of misprop)
			if (typeof embed[prop] === "string") embed[prop] = {"url": embed[prop]};
		for (let field of embed.fields || []) {
			if (field.name === "") field.name = " \u200b";
			if (field.value === "") field.value = " \u200b";
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