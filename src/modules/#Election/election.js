const Election = require('election-js').default;
const Parse = require('../../util/parse');
const Embed = require('../../util/embed');
const fs = require('fs');
const path = require('path');

function space(str) {
	if (str) return str + ' ';
	return '';
}

module.exports = class ElectionConstructor extends Parse {
	
	static get sub () {
		return true;
	}

	/* Election interfaces */

	async initiate() {
		await this.Output.confirm();
		this.election = new Election(this.guild.id)
			.setVoterProperties([
				'messages',
				'active',
				'roles'
			]);
		this.config();
	}

	async status() {
		this.Output.sender(this.generateStatus());
	}

	async config() {
		let verified = false;
		while (!verified) {
			for (let [key, setting] of Object.entries(this.election.settings)) {
				let value = await this.Output.response({
					description: 'Please enter value for setting \'' + setting.name + '\'\nCurrent: ' + setting.value.toString(),
					oneword: true
				});
				if (setting.type === 'number') value = Number(value);
				this.election.editSetting(key, Object.assign(setting, {value}));
			}
			verified = await this.Output.confirm({
				embed: this.generateStatus().setFooter('Verify and set these values?'),
				autodelete: false
			});
		}
		let msg = this.guild.me.lastMessage;
		this.Output.editor(this.generateStatus().setURL(msg.url), msg);
	}

	async clear() {
		await this.Output.confirm();
		delete this.election;
		this.Output.generic('Cleared voting data for server **' + (this.guild.name) + '**.');
	}

	generateStatus() {
		let emoji = this.Search.emojis.get(this.server.emoji);
		let embed = new Embed()
			.setTitle(`${space(emoji)}Information for upcoming ${space(this.election.settings.type)}election on ${this.guild.name}`);
		embed.fields = this.election.settingsFields.map(f => Object.assign(f, {inline: true}));
		return embed;
	}

	/* Voters */

	async voters([channelString] = this.args) {
		if (channelString) {
			let channel = this.Search.channels.get(channelString);
			if (!channel) throw 'Bad channel search';
			let race = this.election.getRace(channel.id);
			if (!race) throw 'No such channel race';
			this.Output.sender(new Embed()
				.setTitle(`Voters for upcoming election on ${this.guild.name}`)
				.setDescription('#' + race.name, race.eligibleVoters.map(v => v.name).join('\n'))
			);
		} else {
			let embed = new Embed()
				.setTitle(`Voters for upcoming election on ${this.guild.name}`);
			for (let race of Object.values(this.election.races)) {
				embed.addField('#' + race.name, race.eligibleVoters.map(v => v.name).join('\n'));
			}
			if (!embed.fields.length) embed.setDescription('No upcoming races found.');
			this.Output.sender(embed);
		}
	}

	async addRace(channel = this.channel) {
		this.election.addRace(channel);
	}

	async register() {
		let voters = Array.from(this.guild.members.values())
			.map(member => {
				return {
					id: member.id,
					name: member.user.tag,
					messages: member.messages.size,
					active: Date.now() - member.lastMessage.createdAt < 1000 * 60 * 60 * 24 * 365,
					roles: member.roles.map(r => r.name)
				};
			});
		for (let v of voters) this.election.addVoter(v);
		this.election.registerEligible();
	}

	run() {
		
		let election = new Election(this.guild.id)
			.setVoterProperties([
				'messages',
				'active',
				'roles'
			])
			.addVoterThreshold('messages', {
				value: '100',
				title: 'Required messages',
				validate: (voter) => voter.messages >= 100
			})
			.addVoterThreshold('role', {
				value: 'voting',
				title: 'Corresponding role for voters',
				validate: (voter, race) => voter.roles.some(r => r.toLowerCase() === race.name.toLowerCase())
			})	
			.addVoterThreshold('duplicates', {
				value: 'true',
				title: 'Exclude duplicate accounts?',
				validate: (voter) => !voter.roles.some(r => r.toLowerCase() === 'bank')
			});
		
		/* Registering voters */
		
		let channelPossibilities = [];
		for (let i = 1; i <= races.length; i++) channelPossibilities.push(...combine(races.map(c => c.name), i));
		for (let i = 0; i <= 3; i++) channelPossibilities.push(...combine(races.map(c => c.name), 3));
		
		for (let i = 0; i < ids.length; i++) election.addVoter({
			id: ids[i],
			name: firstNames[i] + lastNames[i] + '#' + Math.random().toString().slice(2, 6),
			messages: randBetween(80, 180),
			active: Math.random() > 0.2,
			roles: channelPossibilities[randBetween(0, channelPossibilities.length - 1)]
		});
		
		election.registerEligible();
		
		/* Registering candidates */
		
		election.openNominations();
		
		for (let r of races) {
			r.race = election.getRace(r.id);
			let candidates = Object.keys(r.race.candidates);
			let count = Math.min(r.candidateNumber, r.race.eligibleVoters.length - candidates.length);
			for (let i = 0; i < count; i++) {
				let selected = null;
				while (!selected) {
					selected = r.race.getRandomVoter(candidates);
					if (selected.id in r.race.candidates) selected = null;
				}
				r.race.upgradeToCandidate(selected);
			}
		}
		
		election.closeNominations();
		
		/* Voting */
		
		let ballots = election.generateAllBallots(true);
		
		for (let r of races) {
			r.votePossibilities = [];
			for (let i = 0; i <= r.race.candidatesLength; i++)
				r.votePossibilities.push(...combine(Object.keys(r.race.candidates), i));
		}
		
		for (let r of races) {
			let voters = r.race.eligibleVoters;
			for (let v of voters) {
				let votes = [Date.now(), ...shuffle(randomElement(r.votePossibilities))];
				election.addVote(v, {
					race: r.race.id,
					voter: v.id,
					votes
				});
			}
		}
		
		election.closeVoting();
		
		election.countVotes();
		
		fs.writeFileSync(path.join(__dirname, 'data', 'ballots.json'), JSON.stringify(ballots, null, 4));
		fs.writeFileSync(path.join(__dirname, 'data', 'election.json'), JSON.stringify(election, null, 4));
	}

};