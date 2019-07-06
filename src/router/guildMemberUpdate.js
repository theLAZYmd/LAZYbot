const Logger = require('../util/logger');
const Modmail = require('../modules/modmail/output');

class gMU {

	constructor(client, oldMember, newMember) {
		this.old = oldMember;
		this.new = newMember;
		this.modmail = new Modmail({
			client: client,
			member: newMember
		});
	}

	async roleRemove() {
		let role = this.old.roles.find(r => !this.new.roles.has(r.id));
		this.modmail.roleUpdate(this.old, this.new);
	}

	async roleAdd() {
		let role = this.new.roles.find(r => !this.old.roles.has(r.id));        
		this.modmail.roleUpdate(this.old, this.new);
	}

	async nickChange() {
		let [oldNick, newNick] = [this.old.nickname, this.new.nickname];
	}
}

module.exports = async (client, oldMember, newMember) => {
	const Instance = new gMU(client, oldMember, newMember);
	if (oldMember.roles.size > newMember.roles.size) return Instance.roleRemove();
	if (oldMember.roles.size < newMember.roles.size) return Instance.roleAdd();
	if (oldMember.nickname !== newMember.nickname) return Instance.nickChange();
};
