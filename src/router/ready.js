const onStartup = require("./onStartup.js"); //doesn't require Parse
const config = require("../config.json");
const Logger = require("../util/logger.js");

module.exports = async (client) => {
    try {
        let data = new onStartup(client);
        for (let prop of Object.getOwnPropertyNames(onStartup.prototype)) try {
            if (prop === "constructor") continue;
            if (typeof data[prop] === "function") await data[prop]();
        } catch (e) {
            if (e) Logger.error(e);
        }
        Logger.log("bleep bloop! It's showtime.");
        require("./intervals.js")();
        if (config.states.debug) Bot.debug(data);
    } catch (e) {
        if (e) Logger.error(e);
    }
};