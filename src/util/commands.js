const DataManager = require("./datamanager");
const Logger = require("./logger");
const All = DataManager.getFile("./src/commands/all.json");
const Bot = DataManager.getFile("./src/commands/bot.json");
const DM = DataManager.getFile("./src/commands/DM.json");
const Message = DataManager.getFile("./src/commands/message.json");
const Reaction = DataManager.getFile("./src/commands/reaction.json");
const Interval = DataManager.getFile("./src/commands/interval.json");
const fs = require('fs');

class Commands {

    static async run (cmdInfo, message) {
        let directory = "modules/" + cmdInfo.module + "/" + cmdInfo.file.toLowerCase();
        let path = "modules/" + cmdInfo.module + "/" + cmdInfo.file.toLowerCase();
        let extensions = [".js", ".ts", ".mjs"]
        while (!fs.existsSync("./src/" + path)) {
            if (extensions.length === 0) throw "Couldn't find module ./src/" + directory;
            path = directory + extensions.shift();
        }
        let Constructor = require("../" + path);
        let Instance = await new Constructor(message);
        if (typeof Instance[cmdInfo.method] === "function") return Instance[cmdInfo.method](...(cmdInfo.args || []));
        return !!eval("Instance." + cmdInfo.method + "(...cmdInfo.arguments)");
    }

    static getFunction (cmdInfo) {
        let directory = "modules/" + cmdInfo.module + "/" + cmdInfo.file.toLowerCase();
        let path = "modules/" + cmdInfo.module + "/" + cmdInfo.file.toLowerCase();
        let extensions = [".js", ".ts", ".mjs"]
        while (!fs.existsSync("./src/" + path)) {
            if (extensions.length === 0) throw "Couldn't find module ./src/" + directory;
            path = directory + extensions.shift();
        }
        let Constructor = require("../" + path);
        let method = Constructor.prototype[cmdInfo.method];
        if (typeof method !== "function") method = Constructor.prototype.getProp(cmdInfo.method); // eval("Constructor.prototype." + cmdInfo.method);
        if (typeof method !== "function") console.error(path, cmdInfo.method);
        if (typeof method !== "function") return null;
        return method;
    }

    static parse () {

        class cmdInfo {

            constructor(c, base = {}) {
                if (c.prefix || base.prefix) this.prefix = c.prefix || base.prefix;
                this.module = c.module || base.module;
                this.file = c.file || base.file;
                this.method = c.method;
                this.description = c.description;
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

    static get interval () {
        if (Commands._interval) return Commands._interval;
        return Commands.getInterval();
    }
    
    static getAll () {
        let map = Array.from(All);
        return Commands._all = map;
    }

    static getBot () {
        let map = new Map(Array.from(Bot)
            .map(c => [c.title.toLowerCase(), Commands.parse(c)])
        )
        return Commands._bot = map;
    }

    static getMessage () {
        let commands = new Map();
        let aliases = new Map();
        for (let c of Object.values(Message).flat()) {
            if (!Array.isArray(c.aliases)) continue;
            let info = Commands.parse(c);
            if (c.subcommands && c.subcommands.length > 0) {
                info.subcommands = new Map();
                for (let sc of c.subcommands) {
                    for (let a of sc.aliases) {
                        if (a.split(/\s/g).length < 2) info.subcommands.set(a.toLowerCase(), Commands.parse(sc, c));
                        else aliases.set(a.toLowerCase(), info);
                    }
                }
            }
            for (let alias of c.aliases) {
                if (alias.split(/\s/g).length < 2) commands.set(alias.toLowerCase(), info);
                else aliases.set(alias.toLowerCase(), info);
            }
        }
        return Commands._message = {    commands, aliases    };
    }

    static getDM () {
        let aliases = new Map();
        let regexes = new Map();
        let def;
        for (let c of Object.values(DM).flat()) {
            let info = Commands.parse(c);
            if (c.aliases) {
                for (let alias of c.aliases) {
                    aliases.set(alias.toLowerCase(), info);
                }
            }
            if (c.regex) regexes.set(c.regex, info);
            if (c.default) def = info;
        }
        return Commands._dm = {    aliases, regexes, def    };
    }

    static getReaction () {
        let name = new Map();
        let key = new Map();
        for (let c of Object.values(Reaction).flat()) {
            let info = Commands.parse(c);
            if (c.name) name.set(c.name.toLowerCase(), info);
            if (c.key) key.set(c.key.toLowerCase(), info);
        }
        return Commands._reaction = {   name, key   }
    }

    static getInterval () {
        return Commands._interval = Object.entries(Interval);
    }

}

module.exports = Commands;