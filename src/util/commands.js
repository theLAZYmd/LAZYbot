const DataManager = require("./datamanager.js");
const All = DataManager.getFile("./src/commands/all.json");
const Bot = DataManager.getFile("./src/commands/bot.json");
const DM = DataManager.getFile("./src/commands/DM.json");
const Message = DataManager.getFile("./src/commands/Message.json");
const Reaction = DataManager.getFile("./src/commands/Reaction.json");

class Commands {

    constructor() {
    }

    static parse () {

        class cmdInfo {

            constructor(c, base = {}) {
                if (c.prefix || base.prefix) this.prefix = c.prefix || base.prefix;
                this.module = c.module || base.module;
                this.file = c.file || base.file;
                this.method = c.method;
                if (c.arguments) this.arguments = c.arguments;
                if (c.requires) this.requires = c.requires;
                if (c.active) this.active = c.active;
                if (c.guild) this.guild = c.guild;
            }

        }
        
        return new cmdInfo(...arguments);
    }

    get all () {
        if (this._all) return this._all;
        return this._all = Array.from(All);
    }

    get bot () {
        if (this._bot) return this._bot;
        return this._bot = new Map(Array.from(Bot)
            .map(c => [c.title, Commands.parse(c)])
        )  
    }

    get dm () {
        if (this._dm) return this._dm;
        let aliases = new Map();
        let regexes = new Map();
        let def;
        for (let c of Object.values(DM).flat()) {
            let info = Commands.parse(c);
            if (c.aliases) {
                for (let alias of c.aliases) {
                    aliases.set(alias, info);
                }
            }
            if (c.regex) regexes.set(c.regex, info);
            if (c.default) def = info;
        }
        return this._dm = {    aliases, regexes, def    };
    }

    get message () {
        if (this._message) return this._message;
        let commands = new Map();
        let aliases = new Map();
        for (let c of Object.values(Message).flat().filter(c => Array.isArray(c.aliases))) {
            let info = Commands.parse(c);
            if (c.subcommands && c.subcommands.length > 0) {
                info.subcommands = new Map();
                for (let sc of c.subcommands) for (let a of sc.aliases) {
                    if (a.split(/\s/g).length < 2) info.subcommands.set(a, Commands.parse(sc, c));
                    else aliases.set(a, info);
                }
            }
            for (let alias of c.aliases) {
                if (alias.split(/\s/g).length < 2) commands.set(alias, info);
                else aliases.set(alias, info);
            }
        }
        return this._message = {    commands, aliases    };
    }

    get reaction () {
        if (this._reaction) return this._reaction;
        let name = new Map();
        let key = new Map();
        for (let c of Object.values(Reaction).flat()) {
            let info = Commands.parse(c);
            if (c.name) name.set(c.name, info);
            if (c.key) key.set(c.key, info);
        }
        return this._reaction = {   name, key   }
    }
}

new Commands();

module.exports = Commands;