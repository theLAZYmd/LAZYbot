const Parse = require("../util/parse.js");
const Embed = require("../util/embed.js");
const DataManager = require("../util/datamanager.js");
const commands = DataManager.getFile("./src/data/commands/message.json");
const Package = require("../../package.json");

class Help extends Parse {
	constructor(message) {
		super(message);
	}

	async run(args) {
		try {
			if (!args[0]) return this.Output.sender(new Embed()
				.setTitle(Package.name + " v" + Package.version + " by theLAZYmd#2353")
				.addField("Help on using Discord", "Type `... discord`", false)
				.addField(`View all commands", "Type \`${this.server.prefixes.generic}commands\``, false)
				.addField(`Get help on an individual command", "Type \`${this.server.prefixes.generic}help commandName\` for any given command`, false)
				.addField("View the bot's GitHub repo", "[theLAZYmd/LAZYbot](http://bit.ly/LAZYbot)", false)
			);
			if (args.length > 1 && this.guild) throw "Cannot use this command outside of a guild.";
			for (let cmdInfo of commands) {
				for (let alias of cmdInfo.aliases) {
					if (alias.toLowerCase() === args[0].toLowerCase() || this.server.prefixes[cmdInfo.prefix] + alias.toLowerCase() === args[0].toLowerCase()) {
						this.cmdInfo = cmdInfo;
						break;
					}
				}
			}
			if (!this.cmdInfo) throw "Couldn't find that command. Please verify that that command exists.\nNote: some commands get removed for stability issues.";
			let embed = {};
			let properties = ["title", "color", "thumbnail", "description", "fields", "footer"];
			for (let property of properties)
				embed[property] = this[property];
			this.Output.sender(embed);
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	get color() {
		return 11126483
	}

	get title() {
		return "`" + this.cmdInfo.aliases.map(alias => /\s| /.test(alias) ? alias : this.prefix + alias).join(" `** / **` ") + "`";
	}

	get description() {
		return this.cmdInfo.description
			.replace(/\${([a-z]+)}/gi, value => this.server.prefixes[value.match(/[a-z]+/i)])
		//.replace(/\${generic}/gi, this.server.prefixes.generic)
		//.replace(/\${nadeko}/gi, this.server.prefixes.nadeko);
	}

	get prefix() {
		if (this._prefix) return this._prefix;
		this._prefix = this.server.prefixes[this.cmdInfo.prefix];
		return this._prefix;
	}

	get fields() {
		let fields = [];
		if (this.cmdInfo.subcommands) fields.push({
			"name": "Subcommands",
			"value": this.subcommands,
			"inline": false
		});
		fields.push({
			"name": "Usage",
			"value": this.usage,
			"inline": false
		});
		if (typeof this.cmdInfo.requires === "string" && this.requires.trim()) fields.push({
			"name": "Requirements",
			"value": this.requires,
			"inline": false
		});
		return fields;
	}

	get requires() {
		if (this._requires) return this._requires;
		let array = [];
		for (let [type, _value] of Object.entries(this.cmdInfo.requires)) { //[channel: "spam"]
			let value = !Array.isArray(_value) ? [_value] : _value; //if it's not array (i.e. multiple possible satisfactory conditions)
			value = value.map((item) => {
				let _item = this.map(type, item);
				if (typeof _item === "undefined") return _item; //if couldn't find lookup value, just use the given value
				return _item;
			});
			if (value.includes("undefined")) continue;
			array.push([
				"• " + type.toProperCase(),
				value.join(" or ")
			])
		}
		this._requires = array.toPairs();
		return this._requires;
	}

	get subcommands() {
		if (this._subcommands) return this._subcommands;
		this._subcommands = "";
		for (let [type, s] of this.cmdInfo.subcommands) { //[channel: "spam"]
			this._subcommands += "***" + type + "***\n";
			let array = [];
			if (s)
				for (let [ex, v] of Object.entries(s)) array.push([
					"- `" + ex + (v.aliases && v.aliases.length > 0 ? " ` / ` " + v.aliases.join(" ` / ` ") + "`" : "`"),
					typeof v === "string" ? v : v.description
				])
			this._subcommands += array.toPairs() + "\n";
		}
		return this._subcommands;
	}

	get footer() {
		return Embed.footer("Module: " + this.cmdInfo.module);
	}

	get usage() {
		let string = "";
		if (this.cmdInfo.subcommands) {
			let subcommands = this.cmdInfo.subcommands.map(([subcommand]) => subcommand);
			string += "`" + this.prefix + this.cmdInfo.aliases[0] + "` ***" + subcommands.join(" ") + "***\n";
		}
		string += "`" + this.cmdInfo.usage.map(u => this.cmdInfo.aliases.inArray(u.match(/[\w]+/gi)[0]) ? this.prefix + u : u).join("`\n`") + "`";
		return string;
	}

	map(type, item) { //basically a custom map function customisable to the type
		switch (type) {
			case "house":
				return "[House Discord Server](https://discord.gg/RhWgzcC) command only.";
			case "user":
				if (item === "owner") return "**Bot owner only**. [Active developers](https://github.com/theLAZYmd/LAZYbot/graphs/contributors).";
				let user = this.Search.users.get(item);
				if (user) return user;
				return "";
			case "state":
				return item;
			case "channels":
				return this.Search.channels.get(this.server.channels[item]);
			case "role":
				if (item === "owner") return "**Server owner only**.";
				return this.Search.roles.get(this.server.roles[item]);
			case "bot":
				return undefined;
			case "response":
				return undefined;
			case "args":
				let string = "";
				if (item.hasOwnProperty("length")) {
					if (!Array.isArray(item.length)) item.length = [item.length];
					for (let i in item.length)
						if (item.length[i] === "++")
							item.length[i] = "more";
					string += "`" + item.length.join("` or `") + "` arguments"
				}
				return string;
			default:
				return undefined;
		}
	}
}

module.exports = Help;