const Parse = require('../../util/parse');
const Embed = require('../../util/embed');

class Color extends Parse {

	constructor(message) {
		super(message);
	}

	/**
	 * Handler for using the !colour command
	 * @param {Member} member member at which to apply the change colour function, @default this.member
	 * @param {string[]} args 
	 * @param {string} argument 
	 */
	async run(member = this.member, args = this.args, argument = this.argument) {
		try {
			let color, searchstring;
			switch (args.length) {
				case (0):
					return this.get(member);
				case (1):
					break;
				case (2):
					if (!this.Permissions.role('admin', this)) throw this.Permissions.output('role');
					color = args[0];
					searchstring = argument.slice(color.length).trim();
					member = this.Search.members.get(searchstring);
					if (!member) throw new Error('Invalid user given ' + searchstring);
			}
			this.set(member, argument);
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	/**
	 * Displays the colour for a user
	 * @param {Member} member 
	 * @param {string} action 
	 */
	async get(member, action = '') {
		this.Output.sender(new Embed()
			.setColor(member.displayColor)
			.setDescription((action ? action : 'Current') + ` colour for **${member.user.tag}**: **${this.member.displayColor}**.`)
		);
	}

	/**
	 * Parse a colour and set the user to that colour. WARNING: can lead to dangerous permissions leaks if a malicious user has 'MANAGE_ROLES' permissions and an admin uses this command
	 * @param {Member} member 
	 * @param {string} argument 
	 */
	async set(member = this.member, argument = this.argument) {
		try {
			let control = this.Search.roles.get('ChooseColor');
			if (!control) control = await this.guild.createRole({
				name: 'ChooseColor',
				color: null,
				hoist: false,
				position: member.colorRole.position + 1,
				mentionable: false
			});
			if (!this.member.roles.has(control.id)) throw this.Permissions.output('role');
			let name = member.user.username + 'CustomColor';
			let role = this.Search.roles.get(name);
			if (!role) role = await this.guild.createRole({
				name,
				hoist: false,
				position: control.position,
				mentionable: false
			});
			if (!this.member.roles.has(role.id)) member.addRole(role);
			let color = this.Search.colors.get(argument);
			if (typeof color === 'undefined') throw 'Invalid colour input!';
			if (Array.isArray(color)) color = color.reduce((acc, curr) => acc += curr, 0);
			if (color === 0) color = 'BLACK';
			await role.setColor(color);
			this.get(member, 'Set');
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

}

module.exports = Color;