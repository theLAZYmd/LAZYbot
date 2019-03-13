const Logger = require("../util/logger.js");

module.exports = async (client, e) => {
    Logger.error(e);
    client.login(process.env.TOKEN ? process.env.TOKEN : require("../token.json").token)
};