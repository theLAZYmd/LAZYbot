const Logger = require("../util/logger");
const DBuser = require("../util/dbuser");
const DataManager = require("../util/datamanger");

module.exports = async (client, member) => {
    Logger.log(["auto", "guildMemberAdd", "leave", "[" + member.user.tag + "]"]);
    let dbuser = DataManager.getData().find(dbuser => dbuser.id === member.id);
    if (!dbuser) return;
    dbuser.left = true;
    DBuser.setData(dbuser);
}
