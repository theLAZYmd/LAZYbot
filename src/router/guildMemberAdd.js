const Logger = require("../util/logger.js");

module.exports = async (client, member) => {
    Logger.log(["auto", "guildMemberAdd", "join", "[" + member.user.tag + "]"]);
    let Constructor = require("../modules/Administration/shadowban.js");
    let Instance = new Constructor({ member })
    Instance.sbusername(member);
    let dbuser = DBuser.getUser(member);
    if (dbuser.left) delete dbuser.left;
    DBuser.setData(dbuser);
}
