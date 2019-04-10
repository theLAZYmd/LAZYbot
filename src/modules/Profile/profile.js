const config = require("../../config.json");
const Parse = require("../../util/parse.js");
const Embed = require("../../util/embed.js");
const DBuser = require("../../util/dbuser.js");

class Profile extends Parse {

	constructor(message) {
		super(message);
	}

	async get() {
		try {
			if (this.args.length === 1) { //!profile titsinablender
				let user = this.Search.users.get(this.args[0]);
				if (user) this.member = this.Search.members.byUser(user);
				else throw "Couldn't find user!";
			}
			this.user = this.member.user;
			this._dbuser = Object.assign({}, this.dbuser);
			this._dbindex = DBuser.getIndex(this._dbuser);
			let embedgroup = [];
			for (let i = 0; i < this.pages; i++)
				embedgroup.push(this.build(i));
			this.Paginator.sender(embedgroup, 30000);
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	build(page) {
		this.page = page;
		let embed = {};
		let properties = ["title", "color", "thumbnail", "description", "fields"];
		for (let property of properties)
			embed[property] = this[property];
		return Embed.receiver(embed);
	}

	get pages() {
		if (!this._pages) {
			let accounts = this.chessFields.length;
			this._pages = 1 + Math.ceil(accounts / 4);
		}
		return this._pages;
	}

	get title() {
		let chessTitle;
		for (let source of Object.keys(config.sources).filter(source => this._dbuser[source] && this._dbuser[source]._title)) {
            chessTitle = this._dbuser[source]._title;
        }
		let title =
			this.flair.join(" ") + " " +
			"Profile for " +
			(chessTitle ? this.Search.emojis.get(chessTitle.toLowerCase()) + " " : "") +
			this.user.tag;
		return title;
	}

	get flair() {
        return Object.entries({
			"bot": this.user.bot,
			"patron": this._dbuser.patron
        }).filter(([, value]) => value).map(([key]) => this.Search.emojis.get(key))
	}

	get color() {
		return this.member.displayColor;
	}

	get thumbnail() {
		return Embed.thumbnail(this.user.avatarURL ? this.user.avatarURL : "https://i.imgur.com/EncsMs8.png");
	}

	get description() {
		let string = "";
		if (this._dbuser.finger) string += this._dbuser.finger.format();
		if (this._dbuser.modnotes) string += ("-mod notes\n" + this._dbuser.modnotes).format("diff");
		return string;
	}

	get fields() {
		if (this.page === 0) return this.ProfileFields;
		else {
			let minField = 4 * (this.page - 1);
			let maxField = Math.max(this.chessFields.length, 4); //solved issue of making array longer than it was
			return this.chessFields.slice(minField, maxField); //if page === 1, 1, 2, 3, 4; if page = 2, 5, 6, 7, 8
		}
	}

	get ProfileFields() {
		if (!this._ProfileFields) {
			this._ProfileFields = [];
			let fields = [
				["a.k.a.", this.aliases, false],
				[(this._dbuser.modverified ? " " + this.Search.emojis.get(this._dbuser.modverified[0]) : "") + "Info", this.info, true],
				["Joined Date", this.joined, this.info ? true : false],
				["Index", this.ids, this._dbuser.messages ? true : false],
				["Messages Sent", this._dbuser.messages ? this._dbuser.messages.count.toLocaleString() : undefined, true],
				["Last Message", this.lastMessage, false],
				//["Roles", this.roles],
				["House Trophies", this.award, true]
			];
			for (let field of fields)
				if (field[1]) Embed.fielder(this._ProfileFields, ...field);
		}
		return this._ProfileFields;
	}

	get chessFields() {
		if (!this._chessFields) {
			this._chessFields = [];
			for (let [key, source] of Object.entries(config.sources).filter(([k]) => this._dbuser[k])) {
				for (let account of Object.keys(this._dbuser[key])) {
					if (account.startsWith("_")) continue;
					this._chessFields.push([
						this.Search.emojis.get(key) + " " + source.name,
						Parse.profile(this._dbuser, source, account) + "\n" + Parse.ratingData(this._dbuser, source, account),
						true
                    ].toField());
				}
			}
		}
		return this._chessFields;
	}

	get sourcecount() {
		let sourcecount = 0;
		for (let i = 0; i < config.sources.length; i++) {
			let source = config.sources[i][1];
			if (this._dbuser[source]) sourcecount++;
		}
		return sourcecount;
	}

	get footer() {
		if (this.page === 0) {
			return Embed.footer("Use !finger to change your finger message.");
		}
	}

	get aliases() {
        let specifiers = this.member.nickname ? [this.member.nickname] : [];
        for (let source of Object.keys(config.sources).filter(s => this._dbuser[s])) {
            specifiers.push(Object.keys(this._dbuser[source])
                .filter(account => !account.startsWith("_"))
            //    .map(account => account.url(config.sources[source].url.profile.replace("|", account)))
                .join(" | ")
            );
            if (this._dbuser[source]._name) specifiers.unshift(this._dbuser[source]._name)
        }
        specifiers = specifiers.reduce((acc, curr) => {
            if (acc.inArray(curr)) return acc;
            acc.push(curr);
            return acc;
        }, [this.user.username]).slice(1);
        return specifiers.toPairs();
	}

	get info() {
        let region = this.server.regions.find(r => this.Search.roles.get(r) && this.member.roles.some(role => role.name.toLowerCase() === r.toLowerCase())) || "None set.";
		return [
			["Age", this._dbuser.age],
			["Sex", this._dbuser.sex ? (this.Search.emojis.get(this._dbuser.sex) ? this.Search.emojis.get(this._dbuser.sex) : this._dbuser.sex) : ""],
			//check if emoji exists, otherwise just display text
			["Location", this._dbuser.location],
			["Region", region]
		].filter(entry => entry[1]).toPairs("bold");
	}

	get joined() {
		return [
			["Discord", Date.getISOtime(this.user.createdTimestamp).slice(4, 15)],
			[this.guild.name, Date.getISOtime(this.member.joinedTimestamp).slice(4, 15)]
		].toPairs("bold");
	}

	get ids() {
		return [
			["UID", "`" + this.user.id + "`", false],
			["Position in Database", this._dbindex]
		].toPairs("bold")
	}

	get lastMessage() {
		if (!this._dbuser.lastmessage) return "";
		let string =
			(this._dbuser.lastmessagedate ? `\nSent at ${Date.getISOtime(this._dbuser.lastmessagedate)}.` : "") +
			(this._dbuser.lastmessage.startsWith("<:") && this._dbuser.lastmessage.endsWith(">") ?
				"\n" + this._dbuser.lastmessage :
				"\`\`\`" + this._dbuser.lastmessage + "\`\`\`"
			);
		return string;
	}

	get roles() {
		let rolelist = this.Search.members.get(this.member).splice(0, 1);
		return rolelist ? rolelist.toPairs() : ""; //in case we want to display roles in the future.
	}

	get award() {
		let string =
			(this.medal ? this.medal : "") +
			(this.trophies && this.medal ? `\n` : "") +
			(this.trophies ? this.trophies : "");
		return string;
	}

	get medal() {
		let metal = "";
		if (this._dbindex === 1) medal = ":first_place: **First in Database.**";
		if (this._dbindex === 2) medal = ":second_place: **Second in Database.**";
		if (this._dbindex === 3) medal = ":third_place: **Third in Database.**";
		return metal;
	}

	get trophies() {
		return (this._dbuser.trophy ? this._dbuser.trophy.toPairs("bold", ":trophy: ") : "");
	}

	get modnotes() {
		return (this._dbuser.modnotes ? this._dbuser.modnotes.toPairs() : "");
	}

}

module.exports = Profile;