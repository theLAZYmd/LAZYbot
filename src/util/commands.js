const DataManager = require("./datamanager.js");
const All = DataManager.getFile("./src/commands/all.json");
const Bot = DataManager.getFile("./src/commands/bot.json");
const DM = DataManager.getFile("./src/commands/DM.json");
const Message = DataManager.getFile("./src/commands/Message.json");
const Reaction = DataManager.getFile("./src/commands/Reaction.json");
require("../extensions");

class Commands {

    constructor() {
        //if (this.message) {};
        console.log(this.message);
    }

    static parse (c, base) {
        return {
            "prefix": c.prefix || base.prefix,
            "module": c.module || base.module,
            "file": c.file || base.file,
            "method": c.method,
            "arguments": c.arguments,
            "requires": c.requires,
            "active": c.active
        }
    }

    get all () {
        if (this._all) return this._all;
        return this._all = Array.from(All);
    }

    get bot () {
        if (this._bot) return this._bot;
        return this._bot = new Map(Array.from(Bot)
            .map(c => [
                c.title, {
                    "module": c.module,
                    "file": c.file,
                    "method": c.method,
                    "arguments": c.arguments,
                    "requires": c.requires,
                    "active": c.active
                }
            ])
        )  
    }

    get dm () {
        if (this._dm) return this._dm;
        let aliases = new Map();
        let regexes = new Map();
        for (let c of Object.values(DM).flat()) {
            let info = Commands.parse(c);
            if (c.aliases) {
                for (let alias of c.aliases) {
                    aliases.set(alias, info);
                }
            }
            if (c.regex) regexes.set(regex, info);
        }
        return {    aliases, regexes    };
    }

    get message () {
        if (this._message) return this._message;
        let commands = new Map();
        let aliases = new Map();
        for (let c of Object.values(Message).flat()) {
            if (!Array.isArray(c.aliases) ) continue;
            let info = Commands.parse(c);
            if (c.subcommands && c.subcommands.length > 0) {
                info.subcommands = new Map();
                for (let sc of c.subcommands) {
                    for (let a of sc.aliases) {
                        if (a.split(/\s/g).length < 2) info.subcommands.set(a, Commands.parse(sc, c));
                        else aliases.set(a, info);
                    }
                }
            }
            for (let alias of c.aliases) {
                if (alias.split(/\s/g).length < 2) commands.set(alias, info);
                else aliases.set(alias, info);
            }
        }
        return {    commands, aliases    };
    }

    get reaction () {
        if (this._reaction) return this._reaction;
    }
}

new Commands();

module.exports = Commands;