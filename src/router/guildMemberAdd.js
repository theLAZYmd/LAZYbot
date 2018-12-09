const Logger = require("../util/logger.js");

module.exports = async (client, member) => {
    Logger.log(["auto", "guildMemberAdd", "join", "[" + member.user.tag + "]"]);
    let Constructor = require("../modules/shadowban.js");
    let Instance = new Constructor({ member })
    Instance.sbusername(member);
}
