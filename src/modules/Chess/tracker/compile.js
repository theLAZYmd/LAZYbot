const DataManager = require("../../util/datamanager.js");
const config = require("../../config.json");

module.exports = (client) => {
    let map = new Map();
    for (let dbuser of DataManager.getFile("../../data/db.json")) {
        for (let source of Object.keys(config.sources)) {
            if (dbuser[source]) {
                for (let account of Object.keys(dbuser[source]).filter(a => !a.startsWith("_"))) {
                    map.set(account, dbuser.id);
                }
            }
        }
    };
    client.players = map;
    return client;
}