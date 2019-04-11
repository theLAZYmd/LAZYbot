const config = require('../../config.json');
const Parse = require('../../util/parse.js');
const Embed = require('../../util/embed.js');

class Profile extends Parse {

	constructor(message) {
		super(message);
	}

	/**
	 * Creates a new profile embed for a given Discord user
	 * @public
	 */
	async get(argument = this.argument) {
		try {
			if (argument) { //!profile titsinablender
				let user = this.Search.users.get(argument);
				if (user) this.member = this.Search.members.byUser(user);
				else throw 'Couldn\'t find user!';
			}
			this.user = this.member.user;
			Object.defineProperty(this, 'dbuser', {
				value: this.dbuser
			});
			Object.defineProperty(this, 'dbindex', {
				value: this.dbuser.getIndex()
			});
			let embedgroup = [];
			for (let i = 0; i < this.pages; i++) {
				embedgroup.push(this.build(i));
			}
			this.Paginator.sender(embedgroup, 30000);
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	/**
	 * Builds the page for a profile to store and send off to paginator
	 * @param {number} page 
	 */
	build(page) {
		this.page = page;
		let embed = {};
		let properties = ['title', 'color', 'thumbnail', 'description', 'fields'];
		for (let property of properties) {
			embed[property] = this[property];
		}
		return Embed.receiver(embed);
	}

	/**
	 * The number of pages the profile embed is to be
	 * There should be one for the user's basic information, then one for every 4 accounts linked
	 * @type {number}
	 */
	get pages() {
		if (this._pages) return this._pages;
		return this._pages = 1 + Math.ceil(this.chessFields.length / 4);
	}

	/**
	 * Returns a short string saying whose profile is being displayed. Is constant across all pages
	 * @type {string}
	 */
	get title() {
		if (this._title) return this._title;
		let chessTitle;
		for (let source of Object.keys(config.sources)) {
			if (this.dbuser[source] && this.dbuser[source]._title) {
				chessTitle = this.Search.emojis.get(this.dbuser[source]._title.toLowerCase());
				break;
			}
		}
		return this._title = `${this.flairs.join(' ')}Profile for ${chessTitle ? chessTitle + ' ' : ''} ${this.user.tag}`;
	}

	/**
	 * Returns a list of flairs applicable to the user in emoji form
	 * @type {Emoji[]}
	 */
	get flairs() {
		if (this._flairs) return this._flairs;
		return this._flairs = Object.entries({
			bot: this.user.bot,
			patron: this.dbuser.patron
		}).filter(([, value]) => value).map(([key]) => this.Search.emojis.get(key));
	}

	/**
	 * The colour of the discord user, dictated by highest role colour
	 * @type {Number}
	 */
	get color() {
		return this.member.displayColor;
	}

	/**
	 * Adds the Discord user's avatar, if available to the side of the profile, otherwise simply a blank image to maintain spacing
	 * @type {Object}
	 * @property {string} url
	 */
	get thumbnail() {
		if (this._thumbnail) return this._thumbanil;
		return this._thumbnail = Embed.thumbnail(this.user.avatarURL ? this.user.avatarURL : 'https://i.imgur.com/EncsMs8.png');
	}

	/**
	 * Compiles dbuser's finger and mod notes into a string for displaying in the 'description' field of the embed
	 * @type {string}
	 */
	get description() {
		if (this._description) return this._description;
		let string = '';
		if (this.dbuser.finger) string += this.dbuser.finger.format();
		if (this.dbuser.modnotes) string += ('-mod notes\n' + this.dbuser.modnotes).format('diff');
		return this._description = string;
	}

	/**
	 * Gets the fields relevant for a page in the embed
	 * @type {RichEmbed#field[]}
	 */
	get fields() {
		if (this.page === 0) return this._string = this.ProfileFields;
		let minField = 4 * (this.page - 1);
		let maxField = Math.max(this.chessFields.length, 4); //solved issue of making array longer than it was
		return this.chessFields.slice(minField, maxField); //if page === 1, 1, 2, 3, 4; if page = 2, 5, 6, 7, 8
	}

	/**
	 * Gets the fields for the first page of the profile display
	 * @type {RichEmbed#field[]}
	 * @private
	 */
	get ProfileFields() {
		if (!this._ProfileFields) {
			this._ProfileFields = [];
			let fields = [
				['a.k.a.', this.aliases, false],
				[(this.dbuser.modverified ? ' ' + this.Search.emojis.get(this.dbuser.modverified[0]) : '') + 'Info', this.info, true],
				['Joined Date', this.joined, this.info ? true : false],
				['Index', this.ids, this.dbuser.messages ? true : false],
				['Messages Sent', this.dbuser.messages ? this.dbuser.messages.count.toLocaleString() : undefined, true],
				//["Roles", this.roles],
				['House Trophies', this.award, true]
			];
			for (let field of fields) {
				if (field[1]) {
					this._ProfileFields.push(field.toField());
				}
			}
		}
		return this._ProfileFields;
	}

	/**
	 * Gets an array of all the user's linked accounts, to be sliced as per page
	 * @type {RichEmbed#field[]}
	 * @private
	 */
	get chessFields() {
		if (this._chessFields) return this._chessFields;
		this._chessFields = [];
		for (let [key, source] of Object.entries(config.sources)) {
			if (!this.dbuser[key]) continue;
			for (let account of Object.keys(this.dbuser[key])) {
				if (account.startsWith('_')) continue;
				this._chessFields.push([
					this.Search.emojis.get(key) + ' ' + source.name,
					Parse.profile(this.dbuser, source, account) + '\n' + Parse.ratingData(this.dbuser, source, account),
					true
				].toField());
			}
		}
		return this._chessFields;
	}

	/**
	 * An array of unique names for the database user, across all accounts
	 * @type {string[]}
	 */
	get aliases() {
		if (this._aliases) return this._aliases;
		let names = [this.user.username];
		if (this.member.nickname) names.push(this.member.nickname);
		for (let source of Object.keys(config.sources)) {
			if (!this.dbuser[source]) continue;
			for (let account of Object.keys(this.dbuser[source])) {
				if (account.startsWith('_')) continue;
				if (names.inArray(account)) continue;
				names.push(account);
			}
			let name = this.dbuser[source]._name;
			if (name && !names.inArray(name)) names.unshift(this.dbuser[source]._name);
		}
		return this._aliases = names.slice(1).join('\n');
	}

	/**
	 * Returns a concatenated string of different key: value pairs for general information to be displayed in a field
	 * @type {string}
	 * @private
	 */
	get info() {
		let region = this.server.regions.find(r => this.Search.roles.get(r) && this.member.roles.some(role => role.name.toLowerCase() === r.toLowerCase())) || 'None set.';
		let emoji = this.Search.emojis.get(this.dbuser.sex);
		return [
			['Age', this.dbuser.age],
			['Sex', this.dbuser.sex ? (emoji ? emoji : this.dbuser.sex) : ''],
			//check if emoji exists, otherwise just display text
			['Location', this.dbuser.location],
			['Region', region]
		].filter(entry => entry[1]).toPairs('bold');
	}

	/**
	 * Returns a concatenated string of different key: value pairs for information on user join to be displayed in a field
	 * @type {string}
	 * @private
	 */
	get joined() {
		return [
			['Discord', Date.getISOtime(this.user.createdTimestamp).slice(4, 15)],
			[this.guild.name, Date.getISOtime(this.member.joinedTimestamp).slice(4, 15)]
		].toPairs('bold');
	}

	/**
	 * Returns a concatenated string of user IDs to be displayed in a field
	 * @type {string}
	 * @private
	 */
	get ids() {
		return [
			['UID', '`' + this.user.id + '`', false],
			['Position in Database', this.dbindex]
		].toPairs('bold');
	}

	get roles() {
		let rolelist = this.Search.members.get(this.member).splice(0, 1);
		return rolelist ? rolelist.toPairs() : ''; //in case we want to display roles in the future.
	}

	/**
	 * Generates an 'award' field if any trophies or medal have been associated with a user
	 * @type {string}
	 * @private
	 */
	get award() {
		if (this._award) return this._award;
		let arr = [];
		if (this.medal) arr.push(this.medal);
		if (this.trophies) arr.push(this.trophies);
		return this._award = arr.join('\n');
	}

	/**
	 * Awards a user a medal if they are high up in the database
	 * @type {string}
	 * @private
	 */
	get medal() {
		if (this._medal) return this._medal;
		let medal = '';
		switch (this.dbindex) {
			case (1):
				medal = ':first_place: **First in Database.**';
				break;
			case (2):
				medal = ':second_place: **Second in Database.**';
				break;
			case (3):
				medal = ':third_place: **Third in Database.**';
				break;
		}
		return this._medal = medal;
	}

	/**
	 * Returns the list of trophies awarded to a user
	 * @type {string}
	 * @private
	 */
	get trophies() {
		if (this._trophies) return this._trophies;
		if (!this.dbuser.trophy) return '';
		return this._trophies = this.dbuser.trophy.toPairs('bold', ':trophy: ');
	}

	/**
	 * Returns a concatenated string of modnotes left for a user
	 * @type {string}
	 * @private
	 */
	get modnotes() {
		return (this.dbuser.modnotes ? this.dbuser.modnotes.toPairs() : '');
	}

}

module.exports = Profile;