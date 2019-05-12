const Parse = require('../../util/parse');
const Embed = require('../../util/embed');
const DataManager = require('../../util/datamanager');
const ac = require('lazy-aho-corasick');

class Shadowban extends Parse {

	constructor(message) {
		super(message);
	}

	get shadowbanned () { //this is just a utility function, pls ignore
		if (this._shadowbanned) return this._shadowbanned;
		return this._shadowbanned = this.server.shadowbanned || {
			usernames: [],
			users: [],
			newMessages: [],
			phrases: []
		};
	}

	set shadowbanned (shadowbanned) { //this is just a utility function, pls ignore
		let server = this.server;
		server.shadowbanned = shadowbanned;
		this._server = server;
		this.server = server;
	}

	static get trie () {
		if (Shadowban._trie) return Shadowban._trie;
		return Shadowban._trie = Shadowban.getTrie();
	}

	static getTrie() {
		let servers = DataManager.getFile('./src/data/server.json');
		let data = Object.entries(servers).map(([id, data]) => [id, (data.shadowbanned || {}).phrases || []]);
		let obj = {};
		for (let [id, substrings] of data) {
			obj[id] = new ac(substrings);
		}
		return obj;
	}

	get trie () {
		if (this._trie) return this.trie;
		return this._trie = Shadowban.trie[this.guild.id];
	}

	async list() { //displays list of information for conditions for shadowbanning
		let shadowbanned = this.shadowbanned;
		this.Output.sender(new Embed()
			.setTitle('⛔️ List of shadowban conditions on ' + this.guild.name)
			.addField('By Username', shadowbanned.usernames.join('\n').format('css') || '\u200b', false)            
			.addField('By User', shadowbanned.users.join('\n').format('fix') || '\u200b', false)
			.addField('By Message Content', shadowbanned.newMessages.join('\n').format('css') || '\u200b', false)
			.addField('By Phrase', shadowbanned.phrases.join('\n').format() || '\u200b', false)
		);
	}

	async check(message) {
		let x = await this.sbuser(message);
		if (!x) x = await this.sbphrase(message);
		if (!x) x = await this.sbnm(message);
	}

	async sbusername({  user  }) { //if a new User's username matches a regex, BAN them
		try {
			for (let n of this.shadowbanned.usernames) {
				let array = n.split('/');
				let r = new RegExp(array.slice(1, -1).join('/'), array.pop());
				if (!r.test(user.username)) continue;
				this.log(['auto', 'Shadowban', 'byUsername', '[' + [user.tag, r].join(', ') + ']']);
				await this.guild.ban(user, {
					days: 1
				});
				this.Output.sender(new Embed()
					.setTitle('⛔️ User Shadowbanned')
					.addField('Username', user.tag, true)
					.addField('ID', user.id, true)
					.addField('Reason', 'By Username.', true)
				);
				return true;
			}
		} catch (e) {
			if (e) this.error(e);
		}
	}

	async sbuser(message) { //if a specific user specified, delete all their messages. Ban them if they ping someone.
		try {
			if (!this.shadowbanned.users.some(id => id === this.message.author.id)) return;
			this.log(['auto', 'Shadowban', 'byUser', '[' + [message.author.tag, message.content].join(', ') + ']']);
			message.delete();
			if (!((m) => {
				if (m.mentions.everyone) return true;
				if (m.mentions.users.size > 0) return true;
				for (let p of Object.values(this.server.prefixes)) {
					if (m.content.startsWith(p)) return true;
				}
				return false;
			})(message)) return false;
			this.guild.ban(message.author, {
				days: 1
			});
			this.Output.sender(new Embed()
				.setTitle('⛔️ User Shadowbanned')
				.addField('Username', message.author.tag, true)
				.addField('ID', message.author.id, true)
				.addField('Reason', 'Admin Shadowbanned.', true)
			);
			return true;
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	async sbnm(message) { //for all new users (less than 50 messages), if their message matches the content, ban them. Otherwise if it's just a content match, alert mods.
		try {
			if (/^!(?:sb|shadowban)/.test(message.content)) return;
			for (let n of this.shadowbanned.newMessages) {
				let array = n.split('/');
				let r = new RegExp(array.slice(1, -1).join('/'), array.pop());
				if (!r.test(message.content)) continue;
				this.log(['auto', 'Shadowban', 'byNewMessage', '[' + [message.author.tag, message.content].join(', ') + ']']);
				if (Date.now() - this.member.joinedTimestamp < 48 * 60 * 60 * 1000) {
					if (this.dbuser.messages.count < 100) {
						await this.guild.ban(message.author, {
							days: 1
						});
						this.Output.sender(new Embed()
							.setTitle('⛔️ User Shadowbanned')
							.addField('Username', message.author.tag, true)
							.addField('ID', message.author.id, true)                                    
							.addField('Reason', 'By new message.', true)
						, this.Search.channels.get(this.server.channels.modmail));
					}
				}
				this.Output.sender(new Embed()
					.setTitle('Automod filtered message')
					.addField('Author', this.author, true)
					.addField('Channel', this.channel, true)
					.addField('Time', '[' + Date.getISOtime(message.editedTimestamp || message.createdTimestamp).slice(0, 24) + '](' + message.url + ')', true)
					.addField('Rule', r.toString().format('css'), false)
					.addField('Content', message.content.format(), false)
				, this.Search.channels.get(this.server.channels.modmail));
				return true;
			}
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	async sbphrase(message) { //for all new users (less than 50 messages), if their message matches the content, ban them. Otherwise if it's just a content match, alert mods.
		try {
			if (/^!(?:sb|shadowban)/.test(message.content)) return;
			let matches = this.trie.search(message.content);
			if (!matches.length) return;
			this.log(['auto', 'Shadowban', 'byPhrase', '[' + [message.author.tag, message.content].join(', ') + ']']);
			if (Date.now() - this.member.joinedTimestamp < 48 * 60 * 60 * 1000) {
				if (this.dbuser.messages.count < 100) {
					await this.guild.ban(message.author, {
						days: 1
					});
					this.Output.sender(new Embed()
						.setTitle('⛔️ User Shadowbanned')
						.addField('Username', message.author.tag, true)
						.addField('ID', message.author.id, true)                                    
						.addField('Reason', 'By matching phrase.', true)
					, this.Search.channels.get(this.server.channels.modmail));
				}
			}
			this.Output.sender(new Embed()
				.setTitle('Automod filtered message')
				.addField('Author', this.author, true)
				.addField('Channel', this.channel, true)
				.addField('Time', '[' + (message.editedTimestamp || message.createdTimestamp).toString().slice(0, 24) + '](' + message.url + ')', true)
				.addField('Phrase', matches.join('\n').format('css'), false)
				.addField('Content', message.content.format(), false)
			, this.Search.channels.get(this.server.channels.modmail));
			return true;
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	async adder(args) { //router
		try {
			let command = 'add' + (/User|Username|NewMessage|Phrase/i.test(args[0]) ? args.shift() : 'User');
			for (let f of Object.getOwnPropertyNames(Shadowban.prototype)) {
				if (f.toLowerCase() === command.toLowerCase() && typeof this[f] === 'function') return this[f](args);
			}
			throw 'Invalid second parameter given **' + this.args[0] + '**.';
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	async addUser([_user]) { //if a user has a specific ID, DELETE all their messages
		try {
			let member = this.Search.members.get(_user, true);
			if (!member) throw 'Couldn\'t find matching member to shadowban.';
			let user = member.user;
			let shadowbanned = this.shadowbanned;
			shadowbanned.users.push(user.id);
			this.shadowbanned = shadowbanned;
			if (!/false/.test(this.argument)) {
				let all = await member.lastMessage.channel.fetchMessages({
					around: member.lastMessage.id
				});
				let cache = await all.filter(m => m.author.id === user.id);
				member.lastMessage.channel.bulkDelete(cache);
			}
			this.Output.sender(new Embed()
				.setTitle('⛔️ User Shadowbanned')
				.addField('Username', user, true)
				.addField('ID', user.id, true)
			, this.Search.channels.get(this.server.channels.modmail));
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	async addUsername([username]) { //if a user
		try {
			let array = username.split('/');
			let regex = new RegExp(array.slice(0, -1).join('/'), array.pop());
			if (!regex) throw 'Invalid RegExp to validate new users!';
			let shadowbanned = this.shadowbanned;
			shadowbanned.usernames.push(username);
			this.shadowbanned = shadowbanned;
			this.Output.sender(new Embed()
				.setTitle('⛔️ Username Shadowbanned')
				.addField('Username', username.format('css'), true)
				.addField('Channel', this.Search.channels.get(this.server.channels.join), true)
			, this.Search.channels.get(this.server.channels.modmail));
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	async addNewMessage(args) {
		try {
			let msg = args.join(' ');
			let array = msg.split('/');
			let regex = new RegExp(array.slice(0, -1).join('/'), array.pop());
			if (!regex) throw 'Invalid RegExp to validate messages from new users!';
			let shadowbanned = this.shadowbanned;
			shadowbanned.newMessages.push(msg);
			this.shadowbanned = shadowbanned;
			this.Output.sender(new Embed()
				.setTitle('⛔️ Message Content Shadowbanned')
				.addField('Message Content', msg.format('css'), true)
			);
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	async addPhrase(args) {
		try {
			let msg = args.join(' ');
			if (!msg) throw 'Invalid phrase';
			let shadowbanned = this.shadowbanned;
			shadowbanned.phrases.push(msg);
			this.shadowbanned = shadowbanned;
			this.Output.sender(new Embed()
				.setTitle('⛔️ Phrase Shadowbanned')
				.addField('Phrase', msg.format(), true)
			);
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	async remove() {
		try {
			let shadowbanned = this.shadowbanned;
			let key, index;
			if (this.args.length > 2) throw this.Permissions.output('args');
			if (this.args.length > 0) [key, index] = this.args.map(v => v - 1);
			if (!key) key = await this.Output.choose({
				options: Object.keys(shadowbanned),
				type: 'condition of shadowbanning to modify'
			});
			if (typeof key !== 'number' || key < 0 || key >= Object.keys(shadowbanned).length) throw RangeError(key);
			let type = Object.keys(shadowbanned)[key];
			if (!index) index = await this.Output.choose({
				options:  this.shadowbanned[type].map(c => c.format(/usernames|newMessages/.test(type) ? 'css' : 'fix')),
				type: 'data entry to remove'
			});
			if (typeof index !== 'number' || index < 0 || index >= shadowbanned[type].length) throw RangeError(index);
			let entry = shadowbanned[type][index];
			shadowbanned[type].remove(index);
			this.shadowbanned = shadowbanned;
			this.Output.sender(new Embed()
				.setTitle('Removed shadowban condition')
				.addField(type, entry.format(/usernames|newMessages/.test(type) ? 'css' : 'fix'), true)
				.addField('Admin', this.author, true)                
			);
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

}

module.exports = Shadowban;