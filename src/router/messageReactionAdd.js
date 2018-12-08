const DataManager = require("../util/datamanager.js");
const reactionCommands = require("../data/commands/reaction.json");
const Logger = require("../util/logger.js");

module.exports = async (client, messageReaction, user) => {
    try {
        if (user.bot) throw "";
        if (messageReaction.message.guild && messageReaction.message.author.bot) {
            let reactionmessages = DataManager.getFile("./src/data/reactionmessages.json")[messageReaction.message.guild.id];
            for (let [type, data] of Object.entries(reactionmessages)) {
                for (let messageID of Object.keys(data)) {
                    if (messageReaction.message.id === messageID) {
                        let Constructor = require("../modules/" + (type + (type === "modmail" ? "/action" : "")).toLowerCase() + ".js");
                        let Instance = new Constructor(messageReaction.message);
                        Instance.react(messageReaction, user, reactionmessages[type][messageID]);
                    }
                }
            }
        }
        let f = Array.from(reactionCommands).find(cmdInfo => {
            if (cmdInfo.active === false) return false;
            if (cmdInfo.name === messageReaction.emoji.name) return true;
            if (cmdInfo.id === messageReaction.emoji.id) return true;
            return false;
        });
        if (f) {
            let Constructor = require("../modules/" + f.file.toLowerCase() + ".js");
            let Instance = new Constructor(messageReaction.message);
            Instance[f.method.toLowerCase()](messageReaction, user);
        }
    } catch (e) {
        if (e) Logger.error(e);
    }
}