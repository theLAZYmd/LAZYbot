const Parse = require("../../util/parse.js");
const CRFile = require("../../data/customreactions.json");
const DataManager = require("../../util/datamanager.js");
const Logger = require("../../util/logger.js");
const LAZYac = require("../../../../LAZYahocorasick/src/main");

class CustomReactions extends Parse {

    constructor(message) {
        super(message);
        if ((this.command.length === 3 && this.command[1] === "c") || (this.command.includes("custom"))) this._command = "text";
        if ((this.command.length === 3 && this.command[1] === "e") || (this.command.includes("emoji"))) this._command = "emoji";
        this.CRData = CRFile[message.guild.id] ? CRFile[message.guild.id] : {
            "text": [],
            "emoji": []
        }
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
            let map = data.text
                .map(entry => [entry.trigger, {
                    "type": "text",
                    "anyword": entry.anyword,
                    "reaction": entry.reaction
                }])
                .concat(data.emoji
                .map(entry => [entry.trigger, {
                    "type": "emoji",
                    "anyword": entry.anyword,
                    "reaction": entry.reaction
                }])
            );
            let [anyword, whole] = map.partition(entry => entry[1].anyword).map(s => new Map(s));
            let dict = new LAZYac(Array.from(anyword.keys()));
            obj[id] = { dict, anyword, whole  };
        }
        return obj;
    }

    check(string) { //router
        let w = this.trie.whole.get(string);
        if (w) this[w.type](w.reaction)
        let result = this.trie.dict.search(string);
        for (let r of result) {
            let a = this.trie.anyword.get(r);
            if (a) this[a.type](a.reaction);
        }
    }

    async text(content) {
        this.Output.generic(content);
    }

    async emoji(emojiname) {
        let emoji = this.Search.emojis.get(emojiname) ? this.Search.emojis.get(emojiname) : emojiname;
        this.message.react(emoji)
            .catch(() => {});
    }
    
    update(SearchArray, functionOnFound) { //router
        let foundboolean = false;
        for (let i = 0; i < SearchArray.length; i++) {
            if (SearchArray[i].trigger === this.args[0]) {
                functionOnFound(SearchArray[i]);
                foundboolean = true;
            }
            if (!SearchArray[i].trigger) {
                SearchArray.remove(i); //removes null ones
                i--;
            }
        }
        if (foundboolean) {
            this.onUpdate()
                .then(() => this.message.react(this.Search.emojis.get("true")))
                .catch((e) => {
                    this.message.react(this.Search.emojis.get("false"));
                    Logger.error(e);
                })
        } else this.message.react(this.Search.emojis.get("false"));
    }

    onUpdate() {
        return new Promise((resolve, reject) => {
            CRFile[this.guild.id] = this.CRData;
            DataManager.setFile(CRFile, "./src/data/customreactions.json");
            resolve(true)
        });
    }

    add(args, argument) { //acr or aer
        let entry = {
            "trigger": args[0],
            "reaction": argument.slice(args[0].length).trim(),
            "anyword": false
        };
        if (this.CRData[this._command][0]) this.CRData[this._command].push(entry);
        else this.CRData[this._command][0] = entry;
        this.message.react(this.Search.emojis.get("tick"));
        this.onUpdate();
    }

    edit(args, argument) { //ecr or eer
        this.update(this.CRData[this._command], (foundEntry) => {
            foundEntry.trigger = args[0];
            foundEntry.reaction = argument.slice(args[0].length).trim();
            foundEntry.anyword = false
        })
    }

    toggle() { //tcr or ter
        this.update(this.CRData[this._command], (foundEntry) => {
            foundEntry.anyword = !foundEntry.anyword;
        })
    }

    delete() { //dcr or der
        this.update(this.CRData[this._command], (foundEntry) => {
            foundEntry.trigger = null; //set its to null to be cleaned it up in the remove
        })
    }

}

module.exports = CustomReactions;