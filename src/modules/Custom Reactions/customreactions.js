const Parse = require('../../util/parse');
const Embed = require('../../util/embed');
const DataManager = require('../../util/datamanager');
const Logger = require('../../util/logger');
const ac = require('lazy-aho-corasick');

const CRFile = DataManager.getFile('./src/data/customreactions.json');

class CustomReactions extends Parse {

	constructor(message) {
		super(message);
		this.CRData = CRFile[message.guild.id] || {
			text: {},
			emoji: {}
		};
		if (Array.isArray(this.CRData.text) || Array.isArray(this.CRData.emoji)) this.reformat();
	}

	get type() {
		if (this._type) return this._type;
		if (/^(?:[a-z]cr|[a-z]+cust(?:om)?react(?:ion)?)$/i.test(this.command)) return this._type = 'text';
		if (/^(?:[a-z]er|[a-z]+emo(?:ji)?react(?:ion)?)$/i.test(this.command)) return this._type = 'emoji';
		return null;
	}

	reformat() {
		let obj = {
			_id: this.guild.id,
			text: {},
			emoji: {}
		};
		for (let r of this.CRData.text) {
			obj.text[r.trigger] = {
				type: 'text',
				anyword: r.anyword,
				reaction: r.reaction
			};
		}
		for (let r of this.CRData.emoji) {
			obj.emoji[r.trigger] = {
				type: 'emoji',
				anyword: r.anyword,
				reaction: r.reaction
			};
		}
		this.CRData = obj;
		this.onUpdate();
	}

	get trie () {
		if (this._trie) return this._trie;
		return this._trie = CustomReactions.trie[this.guild.id];
	}
    
	static get trie () {
		if (CustomReactions._trie) return CustomReactions._trie;
		return CustomReactions._trie = CustomReactions.getTrie();
	}

	static set trie (trie) {
		CustomReactions._trie = trie;
	}

	static getTrie() {
		let obj = {};
		for (let [id, data] of Object.entries(CRFile)) {
			let map = Object.entries(data.text).concat(Object.entries(data.emoji));
			let [anyword, whole] = map.partition(entry => entry[1].anyword).map(s => new Map(s));
			let dict = new ac(Array.from(anyword.keys()));
			obj[id] = { dict, anyword, whole  };
		}
		return obj;
	}

	check(string) { //router
		try {
			if (this.command && /^(?:[a-z](?:c|e)r|[a-z]+customreaction)$/i.test(this.command)) throw '';
			let w = this.trie.whole.get(string.trim());
			if (w) this[w.type](w.reaction);
			let result = this.trie.dict.search(string).filter(r => this.trie.anyword.get(r));
			for (let r of result) {
				let a = this.trie.anyword.get(r);
				this[a.type](a.reaction);
			}
			if (result.length > 0) Logger.command([this.author.tag, 'CustomReactions', 'auto', '[' + result.join(', ') + ']']);
		} catch (e) {
			if (e) this.error(e);
		}
	}

	async text(content) {
		this.Output.generic(content);
	}

	async emoji(emojiname) {
		let emoji = this.Search.emojis.get(emojiname) ? this.Search.emojis.get(emojiname) : emojiname;
		this.message.react(emoji).catch(() => {});
	}

	async onUpdate() {
		CRFile[this.guild.id] = this.CRData;
		DataManager.setFile(CRFile, './src/data/customreactions.json');
		this.message.react(this.Search.emojis.get('true'));
	}

	async list () {
		this.Output.sender(new Embed()
			.setTitle(this.type.toProperCase() + ' Reactions')
			.setDescription(Object.entries(this.CRData[this.type]).reduce((acc, [trigger, r]) => {
				return acc += trigger.bold()
                    + ': ' + (this.type === 'emoji' ? this.Search.emojis.get(r.reaction) : r.reaction)
                    + (r.anyword === false ? '  *' : '') //"        " + this.Search.emojis.get("triggers_at_start_of_phrase") : "")
                    + (r.autodeletes ? '    †' : '') //"        " + this.Search.emojis.get(":deletes_trigger_message:") : "");
                    + '\n';
			}, ''))
			.setFooter('* denotes a start-only trigger. † denotes an automatically-deleting trigger.')
		);
	}

	async add() { //acr or aer
		try {
			let trigger = this.argument;
			if (/^".+"$/.test(trigger)) trigger = trigger.slice(1, -1);
			if (Object.keys(this.CRData[this.type]).find(t => this.argument.trim() === t.trim())) throw `Reaction ${trigger} already exists!`;
			let reaction = await this.Output.response({
				description: `Please type the ${this.type} response you would like to respond to your trigger '${trigger}'`,
			});
			let r = {
				type: this.type,
				reaction: reaction.trim(),
				anyword: false
			};
			this.CRData[this.type][trigger] = r;
			this.trie.whole.set(trigger, r);
			await this.onUpdate();
		} catch (e) {
			if (e) this.Output.onError(e);
			this.message.react(this.Search.emojis.get('false'));
		}
	}

	async edit() { //ecr or eer
		try {
			if (this.argument.length === 0) throw this.Permissions.output('args');
			if (/^".+"$/.test(this.argument)) this.argument = this.argument.slice(1, -1);
			let trigger = Object.keys(this.CRData[this.type]).find(t => this.argument.trim() === t.trim());
			if (!this.CRData[this.type][trigger]) throw `Couldn't find trigger '${this.argument}' in ${this.type.toProperCase()} Reactions`;
			let reaction = await this.Output.response({
				description: `Please type the ${this.type} response you would like to respond to your trigger '${trigger}'`,
			});
			let r = {
				type: this.type,
				reaction: reaction.trim(),
				anyword: false
			};
			this.CRData[this.type][trigger] = r;
			this.trie.whole.set(trigger, r);
			this.onUpdate();
			CustomReactions.trie = CustomReactions.getTrie();
		} catch (e) {
			if (e) this.Output.onError(e);
			this.message.react(this.Search.emojis.get('false'));
		}
	}

	async toggle() { //tcr or ter
		try {
			if (!this.argument) throw this.Permissions.output('args');
			if (/^".+"$/.test(this.argument)) this.argument = this.argument.slice(1, -1);
			let trigger = Object.keys(this.CRData[this.type]).find(t => this.argument.trim() === t.trim());
			if (!this.CRData[this.type][trigger]) throw `Couldn't find trigger '${this.argument}' in ${this.type.toProperCase()} Reactions`;
			this.CRData[this.type][trigger].anyword = !this.CRData[this.type][trigger].anyword;
			this.onUpdate();
			CustomReactions.trie = CustomReactions.getTrie();
		} catch (e) {
			if (e) this.Output.onError(e);
			this.message.react(this.Search.emojis.get('false'));
		}
	}

	async delete() { //dcr or der
		try {
			if (this.argument.length === 0) throw this.Permissions.output('args');
			if (/^".+"$/.test(this.argument)) this.argument = this.argument.slice(1, -1);
			let trigger = Object.keys(this.CRData[this.type]).find(t => this.argument.trim() === t.trim());
			if (!this.CRData[this.type][trigger]) throw `Couldn't find trigger '${this.argument}' in ${this.type.toProperCase()} Reactions`;
			delete this.CRData[this.type][trigger];
			this.onUpdate();
			CustomReactions.trie = CustomReactions.getTrie();
		} catch (e) {
			if (e) this.Output.onError(e);
			this.message.react(this.Search.emojis.get('false'));
		}
	}

}

module.exports = CustomReactions;