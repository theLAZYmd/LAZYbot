const Parse = require('../../util/parse');
const Embed = require('../../util/embed');

class Roles extends Parse {

	constructor(message) {
		super(message);
	}

	get(group) {
		let server = this.server;
		if (!server.sars) server.sars = [];
		let embed = new Embed()
			.setTitle('Self-assignable roles on ' + this.guild.name);
		if (group !== undefined) server.sars = server.sars.filter((r, i) => i === group);
		for (let i = 0; i < server.sars.length; i++) {
			let key = '', value = '';
			for (let id of server.sars[i]) {
				let role = this.Search.roles.byID(id);
				if (!role) continue;
				value += role + '\n';
				if (!key) key = i === 0 ? 'Group 0 [Non-exclusive]' : 'Group ' + i;
			}
			if (key) embed.addField(key, value, false);
		}
		if (embed.fields.length === 0) embed.setDescription('No self-assignable roles in this server');
		else embed.setFooter('Use \'' + this.prefix + 'role\' to assign yourself one of the following roles');
		this.Output.sender(embed);
	}

	async add(group = parseInt(this.args[0]), argument = this.argument) {
		try {
			//Parse the values
			if (isNaN(group)) group = 0;
			else argument = argument.slice(group.toString().length).trim();
			if (!argument) argument = await this.Output.response({
				description: 'Please specify a valid role',
				filter: r => this.Search.roles.get(r)
			});
			let role = this.Search.roles.get(argument);
			if (!role) throw 'Couldn\'t find role ' + argument;
			let server = this.server;
			if (!server.sars) server.sars = [];
			if (server.sars.find(group => group.find(r => r === role.id))) throw 'Role **' + role.name + '** is already self-assignable';

			//Set the values
			for (let i = 0; i <= group; i++) {
				if (!server.sars[i]) server.sars[i] = [];
			}
			server.sars[group].push(role.id);
			this.server = server;
			this.get(group);
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	async remove(group = parseInt(this.args[0]), argument = this.argument) {
		try {
			//Parse the values
			if (isNaN(group)) group = 0;
			else argument = argument.slice(group.toString().length).trim();

			let server = this.server;
			if (!server.sars || !server.sars[group]) throw 'No such group ' + group;
			if (!argument) argument = await this.Output.response({
				description: 'Please specify a valid role',
				filter: (r) => {
					let role = this.Search.roles.get(r);
					if (!role) return false;
					if (server.sars.indexOf(role.id) === -1) return false;
					return true;
				}
			});
			let role = this.Search.roles.get(argument);
			let index = server.sars.indexOf(role.id);
			if (index === -1) throw 'Couldn\'t find role ' + argument + ' in group ' + group;
			
			//Set the values
			server.sars[group].splice(index, 1);
			this.server = server;
			this.get(group);
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	async assign (argument = this.argument) {
		try {
			//Parse the role
			let role = this.Search.roles.get(argument);
			if (!role) throw 'No such role!';

			//Assigns the role
			let server = this.server;
			if (!server.sars) server.sars = [];
			for (let group = 0; group < server.sars.length; group++) {
				if (server.sars[group].includes(role.id)) {
					if (this.member.roles.has(role.id)) {
						this.member.removeRole(role).catch(() => {});
						this.Output.generic('You now longer have **' + role.name + '** role');
					} else {
						this.member.addRole(role).catch(() => {});
						this.Output.generic('You now have **' + role.name + '** role');
						if (group !== 0) for (let id of server.sars[group]) {
							if (id === role.id) continue;
							if (this.member.roles.has(id)) this.member.removeRole(id).catch(() => {});
						}
					}
					return;
				}
			}
			throw 'Role ' + role.name + ' is not self-assignable';
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}
}
module.exports = Roles;