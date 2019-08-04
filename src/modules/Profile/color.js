const Parse = require('../../util/parse');
const Logger = require('../../util/logger');
const Maths = require('../Calculation/maths');
const Embed = require('../../util/embed');

const regexes = {
	hex: /(?:0x|#)?([0-9a-f]{1,6})/,
	rgb: /([0-9]{1,3})\s?,([0-9]{1,3})\s?,([0-9]{1,3})/
};

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
	 * Parse a colour and set the user to that colour
	 * @param {Member} member 
	 * @param {string} argument 
	 */
	async set(member, argument) {
		try {
			if (!member.roles.some(role => role.name.toLowerCase() === 'choosecolor')) throw this.Permissions.output('role');
			let role = this.Search.roles.get(member.user.username + 'CustomColor');
			if (!role) role = await this.guild.createRole(member.user.username + 'CustomColor');

			let color, type;
			const parser = {
				hex: () => argument.match(regexes.hex),
				decimal: () => !isNaN(parseInt(argument, 16)) ? parseInt(argument, 16).match(regexes.hex) : null,
				rgb: () => argument.match(regexes.rgb),
			};
			const mapper = {
				hex: val => val[0],
				decimal: val => val[0],
				rgb: val => val.slice(1).map(n => Number(n)),
			};
			const functions = Object.entries(parser);
			for (let i = 0; i < functions.length && !color; i++) color = functions[i][1](), type = functions[i][0];
			if (mapper[type]) color = mapper[type](color);
			await role.setColor(color);
			this.get(member, 'Set');
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	async add(member) {
		try {
			member.addRole(this.Search.roles.get('ChooseColor'));
			let role = await this.guild.createRole({
				name: member.user.username + 'CustomColor',
				position: 70
			});
			member.addRole(role);
			Logger.command(['Color', 'process', 'createRole', '[' + [role.name, member.user.tag].join(',') + ']']);
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	static randDecimal() {
		return Maths.randbetween(1, 16777215);
	}

	static randHex() {
		let letters = '0123456789ABCDEF';
		let color = '#';
		for (let i = 0; i < 6; i++)
			color += letters[Maths.randBetween(0, 17)];
		return color;
	}

}

module.exports = Color;