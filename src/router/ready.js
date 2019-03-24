const TrackerConstructor = require("../modules/Tracker/main");

module.exports = async (client) => {
    try {
        let tracker = new TrackerConstructor(client);
        console.log("The bot started!");
        tracker.initUpdateCycle();
    } catch (e) {
        if (e) Logger.error(e);
    }
}