const DataManager = require("./datamanager");
const Logger = require("./logger");
const All = DataManager.getFile("./src/commands/all.json");
const Bot = DataManager.getFile("./src/commands/bot.json");
const DM = DataManager.getFile("./src/commands/DM.json");
const Message = DataManager.getFile("./src/commands/Message.json");
const Reaction = DataManager.getFile("./src/commands/Reaction.json");
const fs = require('fs');

class Commands {

    static run (cmdInfo) {
        let directory = "modules/" + cmdInfo.module + "/" + cmdInfo.file.toLowerCase();
        let path = "modules/" + cmdInfo.module + "/" + cmdInfo.file.toLowerCase();
        let extensions = [".js", ".ts", ".mjs"]
        while (!fs.existsSync("./src/" + path)) {
            if (extensions.length === 0) throw "Couldn't find module ./src/" + directory;
            path += directory + extensions.shift();
        }
        let Constructor = require("../" + path);
        let Instance = new Constructor(argsInfo.message);
        if (typeof Instance[cmdInfo.method] === "function") return Instance[cmdInfo.method](...cmdInfo.arguments);
        return !!eval("Instance." + cmdInfo.method + "(...cmdInfo.arguments)");
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

    static get all () {
        if (Commands._all) return Commands._all;
        return Commands.getAll();
    }

    static get bot () {
        if (Commands._bot) return Commands._bot;
        return Commands.getBot();
    }
    
    static get dm () {
        if (Commands._dm) return Commands._dm;
        return Commands.getDM();
    }
    
    static get message () {
        if (Commands._message) return Commands._message;
        return Commands.getMessage();
    }
    
    static get reaction () {
        if (Commands._reaction) return Commands._reaction;
        return Commands.getReaction();
    }
    
    static getAll (time = Date.now()) {
        let map = Array.from(All);
        Logger.load(time, [[map.length, "All message commands"]], [map.size, "Bot message commands"]);
        return Commands._all = map;
    }

    static getBot (time = Date.now()) {
        let map = new Map(Array.from(Bot)
            .map(c => [c.title, Commands.parse(c)])
        )
        Logger.load(time, [[map.size, "Bot message commands"]], [map.size, "Bot message commands"]);
        return Commands._bot = map;
    }

    static getDM (time = Date.now()) {
        let i = 0;
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
        Logger.load(time, [[aliases.size, "Command keys"], [regexes.size, "Regexes"]], [i, "DM commands"]);
        return Commands._dm = {    aliases, regexes, def    };
    }

    static getMessage (time = Date.now()) {
        let i = 0;
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
            i++;
        }
        Logger.load(time, [[commands.size, "Command keys"], [aliases.size, "Aliases"]], [i, "command files"]);
        return Commands._message = {    commands, aliases    };
    }

    static getReaction (time = Date.now()) {
        let i = 0;
        let name = new Map();
        let key = new Map();
        for (let c of Object.values(Reaction).flat()) {
            i++;
            let info = Commands.parse(c);
            if (c.name) name.set(c.name, info);
            if (c.key) key.set(c.key, info);
        }
        Logger.load(time, [[name.size, "Emoji names"], [key.size, "ID-constructor keys"]], [i, "emoji data files"]);
        return Commands._reaction = {   name, key   }
    }
}

Commands.run();

module.exports = Commands;