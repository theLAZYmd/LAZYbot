const DataManager = require("../util/datamanager");
const Logger = require("../util/logger");
const All = DataManager.getFile("./src/commands/all.json");
const Bot = DataManager.getFile("./src/commands/bot.json");
const DM = DataManager.getFile("./src/commands/DM.json");
const Message = DataManager.getFile("./src/commands/message.json");
const Reaction = DataManager.getFile("./src/commands/reaction.json");
const Interval = DataManager.getFile("./src/commands/interval.json");
const ac = require('lazy-aho-corasick');
const fs = require('fs');

class Trie {

    static get all () {
        if (Trie._all) return Trie._all;
        return Trie.getAll();
    }

    static get bot () {
        if (Trie._bot) return Trie._bot;
        return Trie.getBot();
    }
    
    static get dm () {
        if (Trie._dm) return Trie._dm;
        return Trie.getDM();
    }
    
    static get message () {
        if (Trie._message) return Trie._message;
        return Trie.getMessage();
    }
    
    static get reaction () {
        if (Trie._reaction) return Trie._reaction;
        return Trie.getReaction();
    }

    static get interval () {
        if (Trie._interval) return Trie._interval;
        return Trie.getInterval();
    }
    
    static getAll (time = Date.now()) {
        let map = Array.from(All);
        Logger.load(time, [[map.length, "All message commands"]], [map.length, "All message commands"]);
        return Trie._all = map;
    }

    static getBot (time = Date.now()) {
        let map = new Map(Array.from(Bot)
            .map(c => [c.title.toLowerCase(), Trie.parse(c)])
        )
        Logger.load(time, [[map.size, "Bot message commands"]], [map.size, "Bot message commands"]);
        return Trie._bot = map;
    }

    static getDM (time = Date.now()) {
        let i = 0;
        let aliases = new Map();
        let regexes = new Map();
        let def;
        for (let c of Object.values(DM).flat()) {
            let info = Trie.parse(c);
            if (c.aliases) {
                for (let alias of c.aliases) {
                    aliases.set(alias.toLowerCase(), info);
                }
            }
            if (c.regex) regexes.set(c.regex, info);
            if (c.default) def = info;
        }
        Logger.load(time, [[aliases.size, "Command keys"], [regexes.size, "Regexes"]], [i, "DM commands"]);
        return Trie._dm = {    aliases, regexes, def    };
    }

    static getMessage (time = Date.now()) {
        let substrings = [];
        let index = new Map();
        for (let Module of Object.values(Message)) {
            for (let i = 0; i < Module.length; i++) {
                let command = Module[i];
                for (let a of command.aliases) {
                    substrings.push(a);
                    index.set(a, [Module, i, null]);
                }
                if (command.subcommands && command.subcommands.length > 0) {
                    for (let j = 0; j < command.subcommands.length; j++) {
                        let sc = command.subcommands[j];
                        for (let a of sc.aliases) {
                            if (a.split(/\s/g).length >= 2) {
                                substrings.push(a);
                                index.set(a, [Module, i, j]);
                            } else for (let alias of command.aliases) {
                                let key = alias + " " + a;
                                substrings.push(key);
                                index.set(key, [Module, i, j]);
                            }
                        }
                    }
                }
            }
        }
        let trie = new ac(substrings, {
            "startOnly": false
        });
        Logger.load(time, [[substrings.length, "Command keys"]]);
        return Trie._message = {    trie, substrings, index    };
    }

    static getReaction (time = Date.now()) {
        let i = 0;
        let name = new Map();
        let key = new Map();
        for (let c of Object.values(Reaction).flat()) {
            i++;
            let info = Trie.parse(c);
            if (c.name) name.set(c.name.toLowerCase(), info);
            if (c.key) key.set(c.key.toLowerCase(), info);
        }
        Logger.load(time, [[name.size, "Emoji names"], [key.size, "ID-constructor keys"]], [i, "emoji data files"]);
        return Trie._reaction = {   name, key   }
    }

    static getInterval (time = Date.now()) {
        return Trie._interval = Object.entries(Interval);
    }

}

module.exports = Trie;