const Parse = require('../../util/parse.js');

class ASL extends Parse {

	constructor(message) {
		super(message);
	}

	async run(args, dbuser) {
		try {
			let clear = await this.Output.choose({
				'type': 'action to perform',
				options: ['set ASL values', 'clear ASL values']
			});
			if (clear) { //clear asl values
				if (dbuser.age) delete dbuser.age;
				if (dbuser.sex) delete dbuser.sex;
				if (dbuser.location) delete dbuser.location;
				if (dbuser.modverified) delete dbuser.modverified; //delete mod given tick
				dbuser.setData();
				return this.Output.generic(`Data on **age**, **sex**, and **location** cleared for **${this.user.tag}**.`);
			}
			let options = ['male', 'female', 'non-binary'];
			dbuser.age = await this.Output.response({
				'description': 'Please specify your age in years',
				number: true
			});
			dbuser.sex = options[await this.Output.choose({
				type: 'gender with which you identify',
				options: options
			})];
			dbuser.location = await this.Output.response({
				description: 'Please specify the city where you live'
			});
			if (dbuser.modverified) delete dbuser.modverified;
			dbuser.setData();
			this.output(dbuser);
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	async output(dbuser) {
		try {
			let arr = [
				dbuser.age ? `**${dbuser.age}** years old` : '',
				dbuser.sex ? `**${dbuser.sex}**` : '',
				dbuser.location ? `from **${dbuser.location}**` : ''
			];
			let asl = arr.list();
			if (asl) this.Output.generic(`Hello **${this.author.username}**, I see you're ${asl}.`);
		} catch (e) {
			this.Output.onError(e);
		}
	}

}

module.exports = ASL;