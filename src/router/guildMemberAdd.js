const Logger = require("../util/logger");
const DBuser = require("../util/dbuser");

module.exports = async (client, member) => {
    Logger.log(["auto", "guildMemberAdd", "join", "[" + member.user.tag + "]"]);
    let Constructor = require("../modules/Administration/shadowban.js");
    let Instance = new Constructor({ member })
    Instance.sbusername(member);
    let dbuser = DBuser.getUser(member.user);
    if (dbuser.left) delete dbuser.left;
    DBuser.setData(dbuser);
}
