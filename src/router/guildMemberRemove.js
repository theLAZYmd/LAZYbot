const Logger = require('../util/logger');
const Parse = require('../util/parse');
const Embed = require('../util/embed');

class GuildMemberRemove extends Parse {

	constructor(data) {
		super(data);
	}

	async output() {
		let channel = this.Search.channels.get(this.server.channels.leave);
		let emoji = this.Search.emojis.get('F');
		let message = await this.Output.sender(new Embed()
			.setTitle('❌ User left')
			.setDescription(this.member.user.tag)
			.setColor(this.server.colors.error)
			.setThumbnail(this.member.user.displayAvatarURL === this.member.user.defaultAvatarURL ? null : this.member.user.displayAvatarURL)
			.addField('ID', this.member.id, true)
			.addField('Messages', this.dbuser.messages.count.toLocaleString(), true)
			.addField('Last Message', this.dbuser.messages.last.format(), false)
		, channel);
		if (message) message.react(emoji).catch(() => {});
	}

}

module.exports = async (client, member) => {
	Logger.command(['auto', 'guildMemberAdd', 'leave', '[' + member.user.tag + ']']);
	let argsInfo = new GuildMemberRemove({     client, member     });
	await argsInfo.output();
	argsInfo.dbuser.left();
};
