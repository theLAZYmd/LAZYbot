const DataManager = require("../util/datamanager.js");
const Logger = require("../util/logger.js");

const Commands = require("../util/commands.js");
const {    name, key    } = Commands.reaction;

class messageReactionAdd {

    static async bot () {

    }

    static async button (messageReaction, user) {
        const reactionMessages = DataManager.getFile("./src/data/reactionmessages.json")[messageReaction.message.guild.id];
        let ids = new Map(Object.entries(reactionMessages)
            .filter(([prop]) => !prop.startsWith("_"))
            .map(([type, data]) => [Object.keys(data).filter(prop => !prop.startsWith("_")).map(snowflake => [snowflake, key.get(type)])])
            .flat(2)
        )
        let data = new Map(Object.entries(reactionMessages) //not happy about this
            .filter(([prop]) => !prop.startsWith("_"))
            .map(([, data]) => [Object.entries(data).filter(([prop]) => !prop.startsWith("_"))])
            .flat(2)
        )
        let cmdInfo = ids.get(messageReaction.message.id);
        if (cmdInfo) {
            let path = "../modules/" + (cmdInfo.module ? cmdInfo.module + "/" : "") + cmdInfo.file.toLowerCase() + ".js";
            let Constructor = require(path);
            let Instance = new Constructor(messageReaction.message);
            if (typeof Instance[cmdInfo.method] !== "function") return Logger.error(path + " | " + cmdInfo.method + "() is not a function.")
            Instance[cmdInfo.method](messageReaction, user, data.get(messageReaction.message.id));
        }
    }

    static async name (messageReaction, user) {
        let cmdInfo = name.get(messageReaction.name);
        if (!cmdInfo) return null;
        if (cmdInfo.active === false) return null;
        let Constructor = require("../modules/" + cmdInfo.module + cmdInfo.file.toLowerCase() + ".js");
        let Instance = new Constructor(messageReaction.message);
        Instance[cmdInfo.method.toLowerCase()](messageReaction, user);
    }

}

module.exports = async (client, messageReaction, user) => {
    try {
        if (user.bot) messageReactionAdd.bot(messageReaction, user);
        else if (messageReaction.message.guild && messageReaction.message.author.bot) messageReactionAdd.button(messageReaction, user);
        else messageReactionAdd.name(messageReaction, user);
    } catch (e) {
        if (e) Logger.error(e);
    }
}