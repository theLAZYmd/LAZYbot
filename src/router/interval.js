const Logger = require("../util/logger")
const Commands = require("../util/commands")

module.exports = async (client, cmdInfo) => {
    try {
        if (cmdInfo.disable) return;
        Commands.run(cmdInfo, { client  });
    } catch (e) {
        if (e) Logger.error(e);
    }
};