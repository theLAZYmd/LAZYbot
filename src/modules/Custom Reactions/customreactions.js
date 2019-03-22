const Parse = require("../../util/parse");
const Embed = require('../../util/embed');
const DataManager = require("../../util/datamanager");
const Logger = require("../../util/logger");
const LAZYac = require("../../../../LAZYahocorasick/src/main");

const CRFile = DataManager.getFile("./src/data/customreactions.json");

class CustomReactions extends Parse {

    constructor(message) {
        super(message);
        this.CRData = CRFile[message.guild.id] || {
            "text": {},
            "emoji": {}
        }
        if (Array.isArray(this.CRData.text) || Array.isArray(this.CRData.emoji)) this.reformat();
    }

    get type() {
        if (this._type) return this._type;
        if (/^(?:[a-z]cr|[a-z]+customreaction)$/i.test(this.command)) return this._type = "text";
        if (/^(?:[a-z]er|[a-z]+emojireaction)$/i.test(this.command)) return this._type = "emoji";
        return null;
    }

    reformat() {
        let obj = {
            "_id": this.guild.id,
            "text": {},
            "emoji": {}
        }
        for (let r of this.CRData.text) {
            obj.text[r.trigger] = {
                "type": "text",
                "anyword": r.anyword,
                "reaction": r.reaction
            };
        }
        for (let r of this.CRData.emoji) {
            obj.emoji[r.trigger] = {
                "type": "emoji",
                "anyword": r.anyword,
                "reaction": r.reaction
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
            let dict = new LAZYac(Array.from(anyword.keys()));
            obj[id] = { dict, anyword, whole  };
        }
        return obj;
    }

    check(string) { //router
        try {
            if (this.command && /^(?:[a-z](?:c|e)r|[a-z]+customreaction)$/i.test(this.command)) throw "";
            let w = this.trie.whole.get(string);
            if (w) this[w.type](w.reaction)
            let result = this.trie.dict.search(string).filter(r => this.trie.anyword.get(r));
            for (let r of result) {
                let a = this.trie.anyword.get(r);
                this[a.type](a.reaction);
            }
            if (result.length > 0) Logger.log([this.author.tag, "CustomReactions", "auto", "[" + result.join(", ") + "]"]);
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
        this.message.react(this.Search.emojis.get("true"));
    }

    async list () {
        this.Output.sender(new Embed()
            .setTitle(this.type.toProperCase() + " Reactions")
            .setDescription(Object.entries(this.CRData[this.type]).reduce((acc, [trigger, r]) => {
                return acc += trigger.bold()
                    + ": " + (this.type === "emoji" ? this.Search.emojis.get(r.reaction) : r.reaction)
                    + (r.anyword === false ? "  *" : "") //"        " + this.Search.emojis.get("triggers_at_start_of_phrase") : "")
                    + (r.autodeletes ? "    †" : "") //"        " + this.Search.emojis.get(":deletes_trigger_message:") : "");
                    + "\n";
            }, ""))
            .setFooter('* denotes a start-only trigger. † denotes an automatically-deleting trigger.')
        );
    }

    async add() { //acr or aer
        try {
            switch (this.type) {
                case "text":
                    if (this.args.length < 2) throw this.Permissions.output('args');
                case "emoji":
                    if (this.args.length !== 2) throw this.Permissions.output('args');
            }
            let trigger = this.args[0];
            let reaction = this.argument.slice(trigger.length).trim();
            let r = {
                "type": this.type,
                "reaction": reaction,
                "anyword": false
            };
            this.CRData[this.type][trigger] = r;
            this.trie.whole.set(trigger, r);
            await this.onUpdate();
        } catch (e) {
            if (e) this.Output.onError(e);
            this.message.react(this.Search.emojis.get("false"));
        }
    }

    async edit() { //ecr or eer
        try {
            switch (this.type) {
                case "text":
                    if (this.args.length < 2) throw this.Permissions.output('args');
                case "emoji":
                    if (this.args.length !== 2) throw this.Permissions.output('args');
            }
            let trigger = this.args[0];
            let reaction = this.argument.slice(this.args[0].length).trim();
            this.CRData[this.type][trigger] = {
                "type": this.type,
                "reaction": reaction,
                "anyword": false
            };
            await this.onUpdate();
        } catch (e) {
            if (e) this.Output.onError(e);
            this.message.react(this.Search.emojis.get("false"));
        }
    }

    async toggle() { //tcr or ter
        try {
            if (this.args.length === 0) throw this.Permissions.output('args');
            for (let r of this.args) try {
                if (!this.CRData[this.type][r]) throw "Couldn't find trigger " + r + " in " + this.type.toProperCase() + " Reactions"
                this.CRData[this.type][r].anyword = !this.CRData[this.type][r].anyword;
            } catch (e) {
                if (e) this.Output.onError(e);
            }
            this.onUpdate();
            CustomReactions.trie = CustomReactions.getTrie();
        } catch (e) {
            if (e) this.Output.onError(e);
            this.message.react(this.Search.emojis.get("false"));
        }
    }

    async delete() { //dcr or der
        try {
            if (this.args.length === 0) throw this.Permissions.output('args');
            for (let r of this.args) try {
                if (!this.CRData[this.type][r]) throw "Couldn't find trigger " + r + " in " + this.type.toProperCase() + " Reactions"
                delete this.CRData[this.type][r];
            } catch (e) {
                if (e) this.Output.onError(e);
            }
            this.onUpdate();
            CustomReactions.trie = CustomReactions.getTrie();
        } catch (e) {
            if (e) this.Output.onError(e);
            this.message.react(this.Search.emojis.get("false"));
        }
    }

}

module.exports = CustomReactions;