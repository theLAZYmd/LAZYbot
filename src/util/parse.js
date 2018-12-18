const config = require("../config.json");
const DBuser = require("./dbuser.js");
const DataManager = require("./datamanager.js");
const Embed = require("./embed.js");
const Aliases = DataManager.getFile("./src/data/aliases.json");
const Permissions = require("./permissions.js");
const Logger = require("./logger.js");

class Parse {

	constructor(message) { //everything extends to here
		this.message = message;
		if (typeof this.message === "object") {
			let guild = this.guild;
			let server = this.server; //to prevent overuse of this keyword
			let content = (this.message.content || "").replace("’", "'")
				.replace("…", "...")
				.replace("—", "--")
				.replace("“", "\"")
				.replace("”", "\"")
				.replace(/[\u200B-\u200D\uFEFF]/g, ''); /*
			if (server)
				for (let [key, alias] of guild ? Aliases._all.concat(Aliases[guild.id] || []) : Aliases.all)
					if (content.toLowerCase().includes(key.toLowerCase()))
						content = content.replace(key, alias.replace(/\${([a-z]+)}/gi, value => server.prefixes[value.match(/[a-z]+/i)]));*/
			this.message.content = content || "";
		}
	}

	//DATA

	get server() {
		if (!this._server) {
			if (this.guild) {
                this._server = DataManager.getServer(this.guild.id);
            }
		}
		return this._server || null;
    }
    
    set server(server) {
        DataManager.setServer(server);
        this._server = server;
    }

	get reactionmessages() {
		if (!this._reactionmessages) if (this.guild) this._reactionmessages = DataManager.getServer(this.guild.id, "./src/data/reactionmessages.json");
		return this._reactionmessages || {};
	}

	set reactionmessages(reactionmessages) {
		DataManager.setServer(reactionmessages, "./src/data/reactionmessages.json");
		this._reactionmessages = reactionmessages;
	}

	//Methods

	get Output() {
		if (!this._Output) {
			let OutputConstructor = require("./output.js");
			this._Output = new OutputConstructor(this.message);
		}
		return this._Output;
	}

	get Permissions() {
		if (!this._Permissions) this._Permissions = Permissions;
		return this._Permissions;
	}

	get Paginator() {
		if (!this._Paginator) {
			let PaginatorConstructor = require("../modules/Utility/paginator");
			this._Paginator = new PaginatorConstructor(this.message);
		}
		return this._Paginator;
	}

	get Embeds() {
		if (!this._Paginator) {
			let EmbedsConstructor = require("../modules/Utility/embeds");
			this._Embeds = new EmbedsConstructor(this.message);
		}
		return this._Embeds;
	}

	get Search() {
		let SearchConstructor = require("./search.js");
		return new SearchConstructor(this.message);
	}

	get Check() {
		if (!this._Check) {
			let CheckConstructor = require("./check.js");
			return this._Check = new CheckConstructor(this.message);
		}
		return this._Check;
    }

    get error() {
        if (!this._log) return this._log = Logger.error;
        return this._log;
    }
    
    get log() {
        if (!this._log) return this._log = Logger.log;
        return this._log;
    }

	//argsInfo

	get client() {
		if (this._client) return this._client;
		return this._client = this.message ? this.message.client : null;
	}

	get member() {
		if (this._member) return this._member;
		return this._member = this.message ? this.message.member : null;
	}

	set member(value) {
		this._member = value;
	}

	get guild() {
		if (this._guild) return this._guild;
		if (!this._guild && this.member) this._guild = this.member.guild;
		if (!this._guild && this.message) this._guild = this.message.guild || this.message._guild;
		return this._guild || null;
	}

	set guild(value) {
		this._guild = value;
	}

	get author() {
		if (this._author) return this._author;
		return this.message ? this._author = this.message.author : null;
	}

	get channel() {
		if (this._channel) return this._channel;
		return this.message ? this._channel = this.message.channel : null;
	}

	get user() {
		if (this._user) return this._user;
		return this._user = this.member ? this.member.user : null;
	}

	set user(value) {
		this._user = value;
	}

	get dbuser() {
		if (!this.user) return null;
		return DBuser.getUser(this.user);
	}

	get dbindex() {
		if (!this.dbuser) return null;
		return DBuser.byIndex(this.dbuser);
	}

	get prefix() {
		if (this._prefix) return this._prefix;
		for (let prefix of Array.from(this.prefixes.values()))
			if (this.message.content.startsWith(prefix))
				return this._prefix = prefix;
		return "";
    }
    
    get prefixes() {
        if (this._prefixes) return this._prefixes;
        let prefixes = this.server ? this.server.prefixes : {
            "generic": "!",
            "nadeko": "."
        }
        return this._prefixes = new Map(Object.entries(prefixes));
    }

	get words() {
        if (this._words) return this._words;
        if (!this.message || !this.message.content) return [];
		return this._words = this.message.content.slice(this.prefix.length).match(/[^\s]+/gi) || [];
	}

	get command() {
        if (this._command) return this._command;
		return this._command = this.words.length > 0 ? this.words[0] : "";
	}

	get args() {
		if (this._args) return this._args;
		return this._args = this.words.length > 0 ? this.words.slice(1) : [];
	}

	get argument() {
		if (this._argument) return this._argument;
		return this._argument = this.args.join(" ") || "";
	}

	get embed() {
		if (this._embed) return this._embed;
		return this.message && this.message.embeds ? this.message.embeds[0] : null;
	}

	static ratingData(dbuser, source, username) {
		try {
			let account = dbuser[source.key][username];
			if (!account) throw "No account found for that username!";
			let rating = [];
			for (let [key, variant] of Object.entries(config.variants[source.key]))
				if (account[key]) rating.push([variant.name, (account[key].endsWith("?") ? "" : "**") + account[key] + (account[key].endsWith("?") ? "" : "**")]);
			return rating.toPairs();
		} catch (e) {
			if (e) throw e;
		}
	}

	static profile(dbuser, source, username) {
		return `[${username}](${(config.sources[source.key].url.profile.replace("|", username))})`;
	}

}

module.exports = Parse;