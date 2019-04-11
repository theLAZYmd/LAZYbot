const Parse = require('../../util/parse.js');
const Embed = require('../../util/embed.js');
const Permissions = require('../../util/permissions.js');

class Finger extends Parse {

	constructor(message) {
		super(message);
	}

	run(args = this.args, argument, user) { //all from the same command, so the arguments parse starts here
		try {
			let dbuser = this.Search.dbusers.getUser(user);
			switch (args.length) {
				case (0):
					return this.get(dbuser);
				case (1):
					if (args[0] === 'clear') {
						if (args.length > 2) throw 'Incorrect number of paramters to clear finger message.';
						if (args[1]) {
							if (!Permissions.role('admin', this)) throw Permissions.output('role');
							user = this.Search.users.get(args[0]);
							dbuser = this.Search.dbusers.getUser(user);
						}
						return this.clear(dbuser);
					}
					user = this.Search.users.get(args[0], true);
					if (user) return this.get(this.Search.dbusers.getUser(user));
					break;
				default:
					this.update(dbuser, argument);
			}
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	get(dbuser, title) {
		this.Output.sender(new Embed()
			.setTitle((title ? title : 'Current') + ' finger message for ' + dbuser.username + ':')
			.setDescription((dbuser.finger || '').format()) //if no finger, send empty message so it's clear for the user
			.setFooter(dbuser.id === this.author.id ? '"!finger clear" to remove your finger message.' : '')
		); //just parse the information and send it
	}

	clear(dbuser) {
		try {
			delete dbuser.finger;
			dbuser.setData();
			this.get(dbuser, 'Cleared'); //send the view message with first word changed to "cleared"
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	update(dbuser, argument) {
		try {
			if (argument.length > 500) throw `Finger must be within **500** characters. Text submitted is **${argument.length - 499}** characters too long!`;
			if (dbuser.finger === argument) throw 'Finger was already that!';
			dbuser.finger = argument;
			dbuser.setData();
			this.get(dbuser, 'Updated');
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

}

module.exports = Finger;