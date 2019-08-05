const Parse = require('../util/parse.js');
const config = require('../config.json');
const StatesConstructor = require('../modules/Administration/states.js');
const Logger = require('../util/logger.js');

class PresenceUpdate extends Parse {
	constructor(data) {
		super(data);
		this.States = new StatesConstructor(data);
	}

	async bot(oldPresence, newPresence) {
		if (this.member.id !== config.ids.bouncer) return;
		let forced;
		if (oldPresence.status !== 'offline' && newPresence.status === 'offline') forced = true;
		if (newPresence.status !== 'offline' && oldPresence.status === 'offline') forced = false;
		if (forced === undefined) return;
		await this.States.bcp(forced);
		Logger.command({
			author: {
				tag: 'auto'
			},
			args: [forced],
			command: 'bcp'
		}, {
			file: 'Presence',
			prefix: ''
		}); //log updates received as a command
	}

	async streamer(oldPresence, newPresence) {
		try {
			let live;
			if (!oldPresence.game && newPresence.game && newPresence.game.streaming) live = true;
			if (!newPresence.game && oldPresence.game && oldPresence.game.streaming) live = false;
			if (live === undefined) return;
			let streamersbox = this.Search.channels.get('Streamers Box');
			if (!streamersbox) return;
			for (let region of this.server.regions || []) {
				streamersbox.overwritePermissions(this.Search.roles.get(region), {
					VIEW_CHANNEL: live
				});
			}
			Logger.command(['auto', 'Presence', 'streamers box', '[' + ['live'].join(', ') + ']']);
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

}

module.exports = (client, oldMember, newMember) => {
	let Instance = new PresenceUpdate({
		guild: oldMember.guild,
		_guild: oldMember.guild,
		member: oldMember
	});
	if (oldMember.user.bot) {
		Instance.bot(oldMember.presence, newMember.presence);
	}
	//else Instance.streamer(oldMember.presence, newMember.presence);
};