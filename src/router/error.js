const Logger = require("../util/logger.js");

module.exports = async (client, e) => {
    Logger.error(e);
    client.login(require("../token.json").token)
};