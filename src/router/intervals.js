const IntervalCommands = require("../data/commands/interval.json");
const Logger = require("../util/logger.js")

module.exports = async () => {
    try {
        for (let cmdInfo of IntervalCommands) {
            if (!cmdInfo.file || !cmdInfo.method || !cmdInfo.args || !cmdInfo.interval) continue;
            setInterval(async () => {
                let Constructor = require("../modules/" + cmdInfo.file.toLowerCase() + ".js");
                await Constructor[cmdInfo.method](...cmdInfo.args);
            }, cmdInfo.interval)
        }
    } catch (e) {
        if (e) Logger.error(e);
    }
};