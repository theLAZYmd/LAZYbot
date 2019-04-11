const Logger = require('../util/logger');
const Search = require('../util/search');

module.exports = async (client, member) => {
	Logger.log(['auto', 'guildMemberAdd', 'join', '[' + member.user.tag + ']']);
	let Constructor = require('../modules/Administration/shadowban.js');
	let Instance = new Constructor({ member });
	Instance.sbusername(member);
	new Search().dbusers.getUser(member).joined();
};