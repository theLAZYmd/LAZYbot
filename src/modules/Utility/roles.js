const Parse = require('../../util/parse');
const Embed = require('../../util/embed');

class Roles extends Parse {

	constructor(message) {
		super(message);
	}

	async create(name = this.argument) {
		this.guild.createRole({name})
			.then((r) => this.Output.generic('Successfully created role **' + r.name + '**'))
			.catch(this.Output.onError);
	}

	async delete(argument = this.argument) {
		try {
			let role = this.Search.roles.get(argument);
			if (!role) throw 'No such role ' + argument;
			role.delete();
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	async set(args = this.args) {
		for (let i = 0; i < args.length; i++) {
			let userName = args.slice(0, i + 1).join(' ');
			let roleName = args.slice(i + 1).join(' ');
			let role = this.Search.roles.get(roleName);
			if (!role) continue;
			let member = this.Search.members.get(userName);
			if (!member) continue;
			member.addRole(role)
				.then(() => this.Output.generic('Successfully added role **' + role.name + '** to user **' + member.user.tag + '**'))
				.catch(this.Output.onError);
			return;
		}
		this.Output.onError('Couldn\'t find matching role and user');
	}

	async remove(args = this.args) {
		for (let i = 0; i < args.length; i++) {
			let userName = args.slice(0, i + 1).join(' ');
			let roleName = args.slice(i + 1).join(' ');
			let role = this.Search.roles.get(roleName);
			if (!role) continue;
			let member = this.Search.members.get(userName);
			if (!member) continue;
			if (!member.roles.has(role.id)) return this.Output.onError('User ' + userName + ' already has that role ' + roleName + '!');
			member.removeRole(role)
				.then(() => this.Output.generic('Successfully removed role **' + role.name + '** from user **' + member.user.tag + '**'))
				.catch(this.Output.onError);
			return;
		}
		this.Output.onError('Couldn\'t find matching role and user');
	}

	/*eslint-disable no-unused-vars*/
	get(group) {
		let server = this.server;
		if (!server.sars) server.sars = [];
		if (!server.tars) server.tars = [true];
		let embed = new Embed().setTitle('Self-assignable roles on ' + this.guild.name);			
		//	.setTitle('Self-assignable roles on ' + this.guild.name + (group !== undefined ? ', for Group ' + group : ''));
		//if (group !== undefined) server.sars = server.sars.map((r, i) => i === group ? r : []);
		for (let i = 0; i < server.sars.length; i++) {
			let key = '', value = '';
			if (server.tars[i] === undefined || server.tars[i] === null) server.tars[i] = false;
			for (let id of server.sars[i]) {
				let role = this.Search.roles.byID(id);
				if (!role) role = id;
				value += role.color === 3553598 ? '@' + role.name + '\n' : role + '\n';
				if (!key) key = 'Group ' + i + (server.tars[i] ? ' [Non-exclusive]' : '');
			}
			if (key) embed.addField(key, value, true);
		}
		if (embed.fields.length === 0) embed.setDescription('No self-assignable roles in this server');
		else embed.setFooter('Use \'' + this.prefix + 'role\' to assign yourself one of the above roles');
		this.Output.sender(embed);
	}

	async asar(group = Number(this.args[0]), argument = this.argument) {
		try {
			let server = this.server;
			if (!server.sars) server.sars = [];
			if (!server.tars) server.tars = [true];

			//Parse the values
			if (isNaN(group)) group = 0;
			else argument = argument.slice(group.toString().length).trim();
			if (group < 0 || group > Math.max(server.sars.length, 1)) throw new RangeError('Group must be within 0 to ' + Math.max(server.sars.length, 1) + ' range');
			if (!argument) argument = await this.Output.response({
				description: 'Please specify a valid role',
				filter: r => this.Search.roles.get(r)
			});
			let [roles, checksum] = argument.split(/\s+/).reduce((acc, curr) => {
				let [list, stored] = acc;
				let tmp = (stored + ' ' + curr).trim();
				let role = this.Search.roles.get(tmp);
				if (role) {
					list.push(role);
					return [list, ''];
				} else return [list, tmp];
			}, [[], '']);
			if (checksum) throw 'Couldn\'t find role ' + checksum;

			//Set the values
			for (let i = 0; i <= group; i++) {
				if (!server.sars[i]) server.sars[i] = [];
				if (server.tars[i] === undefined || server.tars[i] === null) server.tars[i] = false;
			}
			for (let role of roles) {
				if (server.sars.find(group => group.find(r => r === role.id))) throw 'Role ' + role.name + ' is already self-assignable';
				server.sars[group].push(role.id);
			}
			this.server = server;
			this.get(group);
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	async rsar(argument = this.argument) {
		try {
			let server = this.server;
			if (!server.sars) server.sars = [];
			if (!server.tars) server.tars = [true];
			if (!argument) argument = await this.Output.response({
				description: 'Please specify a valid role or group number',
				filter: (r) => {
					let role = this.Search.roles.get(r);
					if (!role) return false;
					if (server.sars[r]) return true;
					if (server.sars.find(group => group.find(r => r === role.id))) return true;
					return false;
				}
			});
			if (!isNaN(Number(argument)) && Number(argument) < server.sars.length + 5) {
				if (!server.sars[argument]) throw new RangeError('Group number must be from 0 to '  + (server.sars.length - 1));
				server.sars[argument] = [];
				server.tars[argument] = argument === 0;
				this.server = server;			
				this.get();
			} else {
				let [roles, checksum] = argument.split(/\s+/).reduce((acc, curr) => {
					let [list, stored] = acc;
					let tmp = (stored + ' ' + curr).trim();
					let role = this.Search.roles.get(tmp);
					if (role) {
						list.push(role);
						return [list, ''];
					} else return [list, tmp];
				}, [[], '']);
				if (checksum) try {
					let id = /[0-9]{18}/.test(checksum);
					if (!id) throw '';
					let group = server.sars.findIndex((group) => group.indexOf(checksum.match(/[0-9]{18}/)[0]) !== -1);
					if (group === -1) throw '';
					let index =  server.sars[group].indexOf(checksum);
					server.sars[group].splice(index, 1);					
				} catch (e) {
					throw 'Couldn\'t find role ' + checksum;
				}
				for (let role of roles) try {
					if (!role) throw 'Not a role ' + role;
					let group = server.sars.findIndex((group) => group.indexOf(role.id) !== -1);
					if (group === -1) throw 'No such self-assignable role';
					let index =  server.sars[group].indexOf(role.id);
					if (index === -1) throw new Error(server.sars[group]);
					server.sars[group].splice(index, 1);
				} catch (e) {
					if (e) this.Output.onError(e);
				}
				this.server = server;			
				this.get();
			}
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	async tesar(argument = this.argument) {
		try {
			let server = this.server;
			if (!server.sars) server.sars = [];
			if (!server.tars) server.tars = [true];
			if (!argument) argument = await this.Output.response({
				description: 'Please specify a valid role or group number',
				number: true,
				filter: (r) => server.tars[r] !== undefined
			});
			if (isNaN(Number(argument)) || server.sars[argument] === undefined) throw new RangeError('Group number must be from 0 to '  + (server.sars.length - 1));
			server.tars[argument] = !server.tars[argument];
			this.Output.generic('Roles in group **' + argument + '** are ' + (server.tars[argument] ? 'now' : 'no longer') + ' non-exclusive');
			this.server = server;
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	async assign (argument = this.argument) {
		try {
			let server = this.server;
			if (!server.sars) server.sars = [];
			if (!server.tars) server.tars = [true];

			//Argument can be a group number or a specific role
			if (isNaN(Number(argument))) {
				//Parse the role
				let role = this.Search.roles.get(argument);
				if (!role) throw 'No such role!';

				//Assigns the role
				for (let group = 0; group < server.sars.length; group++) {
					if (server.tars[group] === undefined || server.tars[group] === null) server.tars[group] = false;
					if (server.sars[group].includes(role.id)) {
						if (this.member.roles.has(role.id)) {
							if (this.command === 'iam') throw 'You already have role ' + role.name;
							this.member.removeRole(role).catch(() => {});
							this.Output.generic('You no longer have **' + role.name + '** role');
						} else {
							if (this.command === 'iamn') throw 'You do not have role ' + role.name;
							this.Output.generic('You now have **' + role.name + '** role');
							if (!server.tars[group]) this.member.removeRoles(server.sars[group].filter(id => {
								return id !== role.id && this.member.roles.has(id);
							})).catch(() => {});
							this.member.addRole(role).catch(() => {});
						}
						return;
					}
				}
				throw 'Role ' + role.name + ' is not self-assignable';
			} else {
				let group = argument;
				if (group < 0 || group > Math.max(server.sars.length, 1)) throw new RangeError('Group must be within 0 to ' + Math.max(server.sars.length, 1) + ' range');
				let add = (() => {
					if (this.command === 'iam') return true;
					if (this.command === 'iamn') return false;
					return !server.sars[group].every(id => this.member.roles.has(id));
				})();
				if (add && !server.tars[group]) throw 'Can\'t assign roles by group-number for an exclusive group';
				let list = server.sars[group].filter(id => add ? !this.member.roles.has(id) : this.member.roles.has(id));
				if (add) this.member.addRoles(list);
				else this.member.removeRoles(list);
				let names = list.map((id) => {
					let role = this.Search.roles.byID(id);
					if (!role) return id;
					return role.name;
				});
				if (list.length) this.Output.sender(new Embed()
					.setTitle((add ? 'Added' : 'Removed') + ' the following roles:')
					.setDescription(names.join('\n'))
				);
				else this.Output.onError(`You ${add ? 'already' : 'don\'t'} have ${add ? 'all' : 'any of'} the roles in group ${group}`);
			}
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}
}
module.exports = Roles;