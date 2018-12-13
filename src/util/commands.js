const DataManager = require("./datamanager.js");
const All = DataManager.getFile("./src/commands/all.json");
const Bot = DataManager.getFile("./src/commands/bot.json");
const DM = DataManager.getFile("./src/commands/DM.json");
const Message = DataManager.getFile("./src/commands/Message.json");
const Reaction = DataManager.getFile("./src/commands/Reaction.json");

class Commands {

    constructor() {

    }

    get all () {
        if (this._all) return this._all;
    }

    get bot () {
        if (this._bot) return this._bot;
    }

    get dm () {
        if (this._dm) return this._dm;
    }

    get message () { //doesn't support subcommnads for the moment
        if (this._message) return this._message;
        return this._message = new Map(Object.values(Commands)  //  [[{}, {}], [{}, {}]]
            .flat()                                             //  [{}, {}, {}, {}]
            .map(c => c.aliases.map(a => [                      //  [[[setUsername, {}]], [[setPrefix, {}]], [[help, {}],[ h, {}]], [[guild, {}],[ ..: {}]]]
                a, {
                    "prefix": c.prefix,
                    "module": c.module,
                    "file": c.file,
                    "method": c.method,
                    "arguments": c.arguments.join(","),
                    "requires": c.requires,
                    "active": c.active
                }
            ]))
            .flat()                                             //  [[setUsername, {}], [setPrefix, {}], [help, {}], [h, {}], [guild, {}], [.., {}]]
        )                                                       //  [setUsername => {}, setPrefix => {}, help => {}, h => {}, guild => {}, .. => {}]
    }

    get reaction () {
        if (this._reaction) return this._reaction;
    }
}

module.exports = Commands;