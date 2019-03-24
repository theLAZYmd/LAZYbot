const settings = require("../settings");
const Logger = require("../util/logger");

module.exports = async (client, member) => {
    try {
        let foundRole = member.guild.roles.find(item => item.name === settings.unrankedRoleName);
        if (foundRole) member.addRole(foundRole);
    } catch (e) {
        if (e) Logger.error(e);
    }
}
