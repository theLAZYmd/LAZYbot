const config = require("../config.json");
const Embed = require("./embed.js");
const Parse = require("./parse.js");

class Output extends Parse {

	constructor(message) {
		super(message);
	}

	async sender(embed, NewChannel) {
		try {
			if (config.states.debug) throw "";
			if (!embed) throw "**this.Output.sender():** Embed object is undefined.";
			if (!embed.color) embed.color = config.colors.generic;
			let channel = NewChannel || this.channel;
			embed = Embed.receiver(embed);
			if (typeof embed._apiTransform === "function") embed = embed._apiTransform();
			return await channel.send(embed.content, {embed});
		} catch (e) {
			if (e) console.log(e);
		}
	}

	async editor(embed, msg) {
		try {
			if (!embed) throw "this.Output.editor(): Embed object is undefined.";
			if (!msg) throw "this.Output.editor(): Couldn't find message to edit.";
			if (!embed.color) embed.color = config.colors.generic;
			embed = Embed.receiver(embed);
			if (typeof embed._apiTransform === "function") embed = embed._apiTransform();
			return await msg.edit(embed.content, {embed});
		} catch (e) {
			if (e) console.log(e);
		}
	}

	async generic(description, NewChannel) {
		try {
			return await this.sender({
				description
			}, NewChannel);
		} catch (e) {
			if (e) this.onError(e);
		}
	}

	async embed(name) {
		try {
			try {
				let embed = await this.Embeds.find(name);
				if (!embed) throw "";
				if (this.command === "...") this.message.delete();
				return this.Paginator.sender(embed, this.command === "..." ? Infinity : 180000, name);
			} catch (e) {
				let filter = m => m.author.bot;
				try {
					await this.channel.awaitMessages(filter, {
						"max": 1,
						"time": 1000,
						"errors": ["time"]
					})
				} catch (e) {
					throw "Couldn't find guide matching that name.";
				}
			}
		} catch (e) {
			if (e) this.onError(e);
		}
	}

	async data(json, NewChannel, type = "json") {
		try {
			let string = (typeof json === "object" ? JSON.stringify((typeof json._apiTransform === "function" ? json._apiTransform() : json), null, 2) : json).replace(/`/g, "\\`");
			let index = Math.ceil(string.length / 2000);
			let keylength = Math.floor(string.length / index);
			for (let i = 0; i < index; i++) {
				console.log(i === index.length - 1);
				this.sender({
					"color": 9359868,
					"description": "```" + type + "\n" + string.slice(i * keylength, (i === index.length - 1 ? string.length + 2 : i * keylength + keylength)) + " ".repeat(48) + "\u200b" + "```",
					"footer": Embed.footer((i + 1) + " / " + index)
				}, NewChannel);
			}
		} catch (e) {
			if (e) this.onError(e);
		}
	}

	async onError(error, channel = this.channel) {
		try {
			console.log(error);
			let description = error;
			if (typeof error === "object") {
				if (error.name && error.message) description = "**" + error.name + ":** " + error.message;
				else return;
			}
			return await this.sender({
				"description": description.replace(/\${([a-z]+)}/gi, value => this.server.prefixes[value.match(/[a-z]+/i)]),
				"color": config.colors.error
			}, channel)
		} catch (e) {
			if (e) console.log(e);
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
			if (!embed) throw "";
			let msg = await this[typeof channel.send === "function" ? "sender" : "editor"](embed, channel); //send it
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
				"action": "this action",
				"channel": this.channel,
				"author": this.author,
				"time": 30000,
				"errors": []
			}, data);
			data.emojis = ["✅", "❎"];
			let msg = await this.reactor(data.embed ? data.embed : {
				"description": data.description ? data.description : "**" + data.author.tag + "** Please confirm " + data.action + "."
			}, data.editor ? data.editor : data.channel, data.emojis);
			let rfilter = (reaction, user) => data.emojis.includes(reaction.emoji.name) && (data.author.id === user.id || (data.role && this.Permissions.role(data.role, new Parse(msg))));
			let mfilter = (m) => m.author.id === data.author.id && /^(?:y(?:es)?|n(?:o)?|true|false)$/i.test(m.content);
			let collected = await Promise.race([
				(async () => {
					let rcollected = await msg.awaitReactions(rfilter, { //wait for them to react back
						"max": 1,
						"time": data.time,
						"errors": ["time"]
					}).catch(() => {
					});
					if (rcollected.first().emoji.name === "✅") return true;
					if (rcollected.first().emoji.name === "❎") return false;
				})().catch(() => {
				}),
				(async () => {
					let mcollected = await msg.channel.awaitMessages(mfilter, {
						"max": 1,
						"time": data.time,
						"errors": ["time"]
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
			if (typeof collected !== "boolean") {
				collected = false;
				if (data.cancel) return true;
				if (data.errors.includes("time")) throw "";
			}
			if (!collected && !r) throw "";
			return collected;
		} catch (e) {
			if (e) this.Output.onError(e);
			throw "";
		}
	}

	async choose(data = {}) {
		try {
			data = Object.assign({
				"author": this.author,
				"channel": this.channel,
				"filter": () => {
					return true
				},
				"options": [],
				"role": "",
				"time": 18000,
				"title": "",
				"type": "option"
			}, data);
			let emojis = [],
				description = "";
			let author = data.title ? {
				"name": data.title
			} : {};
			let title = data.description ? data.description : `Please choose a${/^(a|e|i|o|u)/.test(data.type) ? "n" : ""} ${data.type}:`;
			for (let i = 0; i < data.options.length; i++) {
				emojis.push((i + 1) + "⃣");
				description += (i + 1) + "⃣ **" + data.options[i] + "**\n";
			}
			emojis.push("❎");
			let msg = await this.reactor({
				author,
				title,
				description
			}, data.channel, emojis);
			let rfilter = (reaction, user) => {
				if (user.id !== data.author.id) return false;
				if (reaction.emoji.name === "❎") return true;
				let number = reaction.emoji.name.match(/([1-9])⃣/);
				if (Number(number[1]) > data.options.length) return false;
				return true;
			};
			let mfilter = (m) => {
				if (m.author.id !== data.author.id) return false;
				if (!m.content) return false;
				if (isNaN(m.content)) return false;
				if (parseInt(m.content) > data.options.length) return false;
				return true;
			};
			let number = await Promise.race([
				(async () => {
					let rcollected = await msg.awaitReactions(rfilter, { //wait for them to react back
						"max": 1,
						"time": data.time,
						"errors": ["time"]
					}).catch(() => {
					});
					if (rcollected.first().emoji.name === "❎") throw "";
					return Number(rcollected.first().emoji.name.match(/([1-9])⃣/)[1]);
				})().catch(() => {
				}),
				(async () => {
					let mcollected = await msg.channel.awaitMessages(mfilter, {
						"max": 1,
						"time": data.time,
						"errors": ["time"]
					});
					mcollected.first().delete(1000).catch(() => {
					});
					return parseInt(mcollected.first().content);
				})().catch(() => {
				})
			]);
			if (!number) throw "";
			data.autodelete !== false ? msg.delete().catch(() => {
			}) : msg.clearReactions().catch(() => {
			});
			return (number - 1); //and if valid input, send of modmail for that guild
		} catch (e) {
			if (e) this.onError(e);
		}
	}

	async response(data = {}, r) {
		try {
			data = Object.assign({
				"author": this.author,
				"channel": this.channel,
				"description": "Please type your response below.",
				"filter": () => {
					return true
				},
				"number": false,
				"time": 60000
			}, data);
			let author = data.title ? Embed.author(data.title) : {};
			let msg = await this.reactor({
				author,
				"description": data.description
			}, data.editor ? data.editor : data.channel, ["❎"]);
			let rfilter = (reaction, user) => {
				if (user.id !== data.author.id) return false;
				if (reaction.emoji.name !== "❎") return false;
				return true;
			};
			let mfilter = m => m.author.id === data.author.id && m.content !== undefined && (!isNaN(m.content) || !data.number) && (m.content.trim().split(/\s+/g).length === 1 || !data.oneword) && data.filter(m); //condition, plus user speicifed filter
			try {
				let collected = await Promise.race([
					(async () => {
						let reaction = await msg.awaitReactions(rfilter, { //wait for them to react back
							"max": 1,
							"time": data.time,
							"errors": ["time"]
						});
						if (reaction) return false;
						throw ""
					})().catch(() => {
					}),
					msg.channel.awaitMessages(mfilter, {
						"max": 1,
						"time": data.time,
						"errors": ["time"]
					})
				]);
				if (!collected) throw "";
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