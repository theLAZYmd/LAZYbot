const Logger = require("../util/logger");
const TrackerConstructor = require("../modules/Tracker/main");

module.exports = async (client, member) => {
    let tracker = new TrackerConstructor(client);
    tracker.remove(member.guild.id, member.id, true);
}
