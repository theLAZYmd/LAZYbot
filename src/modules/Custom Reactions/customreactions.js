const Parse = require("../../util/parse");
const DataManager = require("../../util/datamanager");
const Logger = require("../../util/logger");
const LAZYac = require("../../../../LAZYahocorasick/src/main");

const CRFile = DataManager.getFile("./src/data/customreactions.json");

class CustomReactions extends Parse {

    constructor(message) {
        super(message);
        if (/^(?:[a-z]cr|[a-z]+customreaction)$/i.test(this.command)) this._command === "text";
        if (/^(?:[a-z]er|[a-z]+emojireaction)$/i.test(this.command)) this._command === "emoji";
        this.CRData = CRFile[message.guild.id] || {
            "text": {},
            "emoji": {}
        }
        if (Array.isArray(this.CRData.text) || Array.isArray(this.CRData.emoji)) this.reformat();
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
        let w = this.trie.whole.get(string);
        if (w) this[w.type](w.reaction)
        let result = this.trie.dict.search(string).filter(r => this.trie.anyword.get(r));
        for (let r of result) {
            let a = this.trie.anyword.get(r);
            this[a.type](a.reaction);
        }
        Logger.log([this.author.tag, "CustomReactions", "auto", "[" + result.join(", ") + "]"])
    }

    async text(content) {
        this.Output.generic(content);
    }

    async emoji(emojiname) {
        let emoji = this.Search.emojis.get(emojiname) ? this.Search.emojis.get(emojiname) : emojiname;
        this.message.react(emoji).catch(() => {});
    }
    
    async update(string, f) { //router
        try {
            let result = this.trie.dict.search(string);
            for (let r of result) {
                let a = this.trie.anyword.get(r);
                if (a && a.type === this._command) f(this.CRData[this._command][r]);
            }
            if (result.length === 0) throw "";
            await this.onUpdate();
            this.message.react(this.Search.emojis.get("true"));
        } catch (e) {
            if (e) Logger.error(e);
            this.message.react(this.Search.emojis.get("false"));
        }
    }

    async onUpdate() {
        CRFile[this.guild.id] = this.CRData;
        DataManager.setFile(CRFile, "./src/data/customreactions.json");
        return true;
    }

    async add() { //acr or aer
        let entry = {
            "trigger": this.args[0],
            "reaction": this.argument.slice(this.args[0].length).trim(),
            "anyword": false
        };
        this.CRData[this._command].push(entry);
        this.message.react(this.Search.emojis.get("tick"));
        this.onUpdate();
    }

    async edit() { //ecr or eer
        this.update(this.argument.slice(this.args[0].length), (foundEntry) => {
            foundEntry.trigger = this.args[0];
            foundEntry.reaction = this.argument.slice(this.args[0].length).trim();
            foundEntry.anyword = false
        })
    }

    async toggle() { //tcr or ter
        this.update(this.argument, (foundEntry) => {
            foundEntry.anyword = !foundEntry.anyword;
        })
    }

    async delete() { //dcr or der
        this.update(this.argument, (foundEntry) => {
            foundEntry.trigger = null; //set its to null to be cleaned it up in the remove
        })
    }

}

module.exports = CustomReactions;