const Logger = require('../util/logger');
const Parse = require('../util/parse');

class gMA extends Parse {

	constructor(data) {
		super(data);
	}

	shadowban() {
		let Constructor = require('../modules/Administration/shadowban');
		let Instance = new Constructor(this);
		Instance.sbusername(this.member);
		return this;
	}

	log() {
		this.dbuser.get();
		return this;
	}
}

module.exports = async (client, member) => {
	Logger.command(['auto', 'guildMemberAdd', 'join', '[' + member.user.tag + ']']);
	new gMA({client, member})
		.shadowban()
		.log();
};