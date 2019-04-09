const settings = require('../settings');
const Logger = require('../util/logger');

module.exports = async (client, member) => {
	try {
		let foundRole = member.guild.roles.find(item => item.name === settings.unrankedRoleName);
		if (foundRole) member.addRole(foundRole);
	} catch (e) {
		if (e) Logger.error(e);
	}
	Logger.log(['auto', 'guildMemberAdd', 'join', '[' + member.user.tag + ']']);
	let Constructor = require('../modules/Administration/shadowban.js');
	let Instance = new Constructor({ member });
	Instance.sbusername(member);
	let dbuser = DBuser.getUser(member.user);
	if (dbuser.left) delete dbuser.left;
	DBuser.setData(dbuser);
};
