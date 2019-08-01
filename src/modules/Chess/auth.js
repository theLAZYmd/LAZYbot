const Parse = require('../../util/parse');
const DataManager = require('../../util/datamanager');
const Embed = require('../../util/embed');
const path = require('path');

class Auth extends Parse {

	constructor(message) {
		super(message);
	}

	/**
	 * Begins the process to use an OAuth2 grant to link the identity of a Discord profile with a Lichess profile
	 * @param {User} user 
	 * @public
	 */
	async verifyReq (user = this.user) {
		let auth = DataManager.getFile(path.join(__dirname, 'auth.json'));
		const state = Math.random().toString(36).substring(2);
		this.argument = state;
		auth[state] = {
			guild: this.guild.id,
			id: user.id,
			data: null
		};
		DataManager.setFile(auth, path.join(__dirname, 'auth.json'));
		this.Output.generic('DM-ed a link to verify with Lichess server!');
		this.Output.sender(new Embed()
			.setTitle(this.Search.emojis.get('lichess') + ' New Lichess Verification request')
			.setDescription('[Verification Link](' + (this.isBetaBot() ? 'http://localhost:80/auth' : 'http://LAZYbot.co.uk/auth') + '?state=' + state + ')')
		, user);
	}

	async verifyRes (state, data) {
		this.guild = this.client.guilds.get(data.guild);
		let user = this.Search.users.byID(data.id);
		let dbuser = await this.Search.dbusers.getUser(user);
		if (!dbuser.lichess.verified) dbuser.lichess.verified = [];
		dbuser.lichess.verified.push(data.data.username);
		dbuser.setData();
		if (this.server.roles && this.server.roles.verified) {
			let member = this.Search.members.byUser(user);
			let role = this.Search.roles.get(this.server.roles.verified) || await this.guild.createRole({
				name: this.server.roles.verified
			});
			member.addRole(role);
		}
		let auth = DataManager.getFile(path.join(__dirname, 'auth.json'));
		delete auth[state];
		DataManager.setFile(auth, path.join(__dirname, 'auth.json'));
	}

}

module.exports = Auth;