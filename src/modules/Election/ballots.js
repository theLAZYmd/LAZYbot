const Main = require('./main');
const DataManager = require('../../util/datamanager');
const Logger = require('../../util/logger');
const Embed = require('../../util/embed');
const Permissions = require('../../util/permissions');

class Ballots extends Main {

	constructor(message) {
		super(message);
	}

	async gen() {
		try {
			if (!Permissions.state('election/register', this)) throw 'Cannot send ballots before voters have been registered.';
			if (!Permissions.state('voting', this) && this.command === 'mobile') throw 'Cannot send ballots before voting has opened.';
			let user = this.author, argument = this.args.slice(1).join(' ');
			if (argument) {
				if (!this.Permissions.role('owner', this)) throw this.Permissions.output('owner', this);
				let _user = this.Search.users.get(argument);
				if (_user) user = _user;
				else throw 'Couldn\'t find user **' + argument + '**.'; //identify a user if argument given
			}
			let all = Main.validate(this.election, user);
			let channels = (await this.Output.response({
				description: 'Please list the channels you wish to be shown on the ballot from the list of valid ones below. Write `all` for all.\n' + '**' + all.join('**\t|\t**') + '**'
			})).split(/\s| /);
			if (!/^all$/.test(channels[0].trim()))
				for (let channel of channels)
					if (!all.inArray(channel))
						throw 'Invalid channel given **' + channel + '**.';
			this.send([user], 0, [[user, /^all$/.test(channels[0].trim()) ? all : channels]]); //and send an array of length 1 to the all functions
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	async one() { //sends one ballot. Purpose is to test the all function
		try {
			if (!Permissions.state('voting', this) && this.command === 'mobile') throw 'Cannot send ballots before voting has opened.';
			let user = this.author, argument = this.args.slice(1).join(' ');
			if (argument) {
				if (!this.Permissions.role('owner', this)) throw this.Permissions.output('owner', this);
				let _user = this.Search.users.get(argument);
				if (_user) user = _user;
				else throw 'Couldn\'t find user **' + argument + '**.'; //identify a user if argument given
			}
			this.send([user], this.message.content.includes('mobile')); //and send an array of length 1 to the all functions
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	async all(argument = this.argument) {
		try {
			let real = argument === '--real' || argument === '-r';
			if (real) {
				if (Permissions.state('voting', this)) throw 'This command cannot be used once voting has begun!'; //set to true at the end
				await this.Output.confirm();
			}
			let object = {};
			if (this.election.elections) for (let [type, data] of Object.entries(this.election.elections)) { //for each election
				if (type.startsWith('_')) continue;
				for (let id in data.voters) {
					if (!data.voters.hasOwnProperty(id)) continue;
					if (!object[id]) object[id] = true; //if the id isn't a property of the object, make it so
				}
			}
			let array = Object.keys(object).map(id => this.Search.users.byID(id)); //then take the keys, and turn each id into a user object
			if (this.real) {
				this.server.states.election.voting = true; //so this command cannot be used more than once
				DataManager.setServer(this.server);
			}
			this.send(array, undefined, undefined, real);
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	async send(users = [], mobile, voterChannels, real = false) {
		try {
			let voterCount = users.length, ballotCount = 0;
			let msg = await this.Output.sender(new Embed()
				.setDescription(`Initiating sending ${mobile ? 'mobile ' : ''}ballots...`)
				.setFooter(`Sending 0 / 0 ballots to 0 / ${voterCount} voters.`)
			);
			if (!voterChannels) voterChannels = users.map(user => [user, Main.validate(this.election, user)]); //Actually generate all the channels that need to be sent first!
			for (let [, channels] of voterChannels) {//validate returns an array of channels (as ids) that the user is eligible to vote for
				ballotCount += channels.length; //count them (for the beginning message)
			}
			await this.Output.editor(new Embed()
				.setDescription(`Initiating sending ${mobile ? 'mobile ' : ''}ballots...`)
				.setFooter(`Sending 0 / ${ballotCount} ballots to 0 / ${voterCount} voters.`)
			, msg);
			let voterRunning = 0, ballotRunning = 0, string = '';
			for (let i = 0; i < voterChannels.length; i++) {
				let [user, channels] = voterChannels[i]; //for each user
				setTimeout(() => {
					try {
						if (!mobile) {
							let ballot = Ballots.gen(this.election, user, channels);  //generate the full ballot for desktop users
							if (this.real) this.Output.sender(ballot, mobile === 0 ? this.channel : user);
						} else {
							let ballots = Ballots.fields(this.election, user, channels);  //otherwise just generate the fields
							for (let j = 0; j < ballots.length; j++) {
								setTimeout(() => {
									let ballot = ballots[j].value.slice(6, -3).trim();  //and send them individually
									if (this.real) user.send(ballot);
									if (this.real) setTimeout(() => {
										this.Output.generic('', user);  //with an empty embed to separate them
									}, 1000);
								}, 2000 * j);
							}
						}
						this.Output.editor(new Embed()  //on the aesthetic log message, edit it to 'sending' plus the user plus basic details
							.setDescription(`Sending ${channels.length} ${mobile ? 'mobile ' : ''}ballots to **${user.tag}**`)
							.setFooter(`Sent ${ballotRunning} / ${ballotCount} ballots to ${voterRunning} / ${voterCount} voters.`)
						, msg);
						Logger.command([user.tag, 'Election/ballots', 'command-request', '[' + channels.join(', ') + ']']);  //log it. Add to text string
						string += `#${user.tag}: [${channels.join(', ')}]\n`;
						ballotRunning += channels.length; //up the running totals to edit our aesthetic footer message
						voterRunning++;
					} catch (e) {
						if (e) {
							this.Output.onError('**' + user.tag + '**');
							this.Output.onError(e);
						}
					}
					if (i === voterChannels.length - 1) setTimeout(() => {  //required twice, so define it this way
						let embed = new Embed()
							.setDescription(`Finished sending ${ballotRunning} ballots.`)
							.setFooter(`Sent ${ballotRunning} / ${ballotCount} ballots to ${voterRunning} / ${voterCount} voters.`);
						this.Output.editor(embed, msg);
						if (real && mobile) this.Output.sender(embed, user);
						else this.Output.data(string, this.Search.channels.get(this.server.channels.mod), 'css');
					}, 30000);
				}, 1000 * i * (mobile ? channels.length * 2 : 1));
			}
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	static gen(election, user, channels) {
		try {
			let ballot = {
				author: {
					name: 'House Discord Server Mod Elections: ' + election.date,
					icon_url: election.icon,
					url: election._url || '',
				},
				title: 'This constitutes your voting ballot for this election.',
				//"description": "- Please copy and paste the dark boxes below and fill in the checkboxes on the left with numbers, indicating your order of preference.\n- You do not have to fill every checkbox.\n- You must give numbers in ascending preference, for instance, filling in checkboxes with `[1]`, `[2]`, and [`4`] would be invalid.\n- If you wish to vote for an unlisted candidate not listed, please replace the `Write-in` option with a user tag (`Discord#2048`) and assign it your intended number, otherwise you may not write a number in the `Write-in` checkbox.\n- If you do not wish to vote for any candidate, write a `1` in the option for `Blank Vote` and do not make any other modifications.\n- If you neither wish to vote for a candidate, nor submit a `Blank Vote`, you may spoil your ballot by sending an empty ballot (no numbers).\n- Do not make any other modifications or your vote will constitute a spoiled ballot.\n- You may resubmit a ballot for up to half an hour after voting. Simply copy and paste the updated ballot into your message field.",
				description: '- ' + require('./' + election.system.toLowerCase() + '/data.json').description.join('\n- '),
				fields: Ballots.fields(election, user, channels),
				footer: {
					text: 'Type \'!mobile\' to receive mobile-friendly versions of your ballots.'
				},
				color: 15844367
			};
			return ballot;
		} catch (e) {
			if (e) throw e;
		}
	}

	static fields(election, user, channels) {
		let fields = [];
		for (let channel of channels) {
			let candidates = Object.keys(election.elections[channel].candidates || {}).filter(candidate => election.elections[channel].candidates[candidate].length >= 2) || [];
			let votingString = Ballots.candidates(candidates);
			fields.push({
				name: `#${channel} Ballot:`,
				value: '```css\n' +
					`#VoterID: ${user.id}\n` +
					`#ServerID: ${election._id}\n` +
					`#Channel: ${channel}\n` +
					`${votingString}` +
					'[] Write-In\n' +
					'[] Blank Vote```',
				inline: false
			});
		}
		return fields;
	}

	static candidates(candidates) {
		let string = '';
		candidates.shuffle();
		for (let candidate of candidates)
			string += '[] ' + candidate + '\n';
		return string;
	}

}

module.exports = Ballots;