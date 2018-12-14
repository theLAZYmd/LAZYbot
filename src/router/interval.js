const IntervalCommands = require("../data/commands/interval.json");
const Logger = require("../util/logger")
const Commands = require("../util/commands")

module.exports = async (client, cmdInfo) => {
    try {
        Commands.run(cmdInfo);
    } catch (e) {
        if (e) Logger.error(e);
    }
};