const Parse = require('../../../util/parse');
const DataManager = require('../../../util/datamanager');
const config = require('../../config.json');
const Ballot = require('./ballot');
const Logger = require('../../../util/logger');

//Got to account for all the 'edge cases' a user might possibly be able to do to the ballot

const Errors = {
	stolen: 'This ballot does not match your registered voter ID.\nPlease do not make any unauthorised modifications to your ballot.',
	noGuild: 'Couldn\'t find server to submit vote for.\nPlease do not make any unauthorised modifications to your ballot.',
	state: 'Voting period for elections on this server. This ballot is invalid.',
	noElection: 'Couldn\'t find election matching name listed on your ballot.\nPlease do not make any unauthorised modifications to your ballot.',
	ineligible: 'You are ineligible to vote for that channel.', //not validated
	timeout: 'You have already voted for that channel.', //half an hour timer to change vote
	badOrder: 'Invalid voting order! Fill up your ballot in ascending order, beginning with `[1]`',
	badWriteIn: 'Invalid `Write-In`. Change the `Write-In` field to a `DiscordTag#1024` to write in a user.',
	zeroes: 'You may not vote for a user with a position zero `[0]`.',
	duplicates: 'Your ballot contains duplicate votes. Only assign a position number to an option once.',
	missingUsers: 'Couldn\'t find one or more users listed in the ballot.\nPlease check and the spelling of any written-in users and verify that any and all have not withdrawn by trying to `@mention` them or by using the `!candidates` command in the server.'
};

class Vote extends Parse { //this module parses voting data

	constructor(message) {
		super(message);
	}

	async resolve(output, author, channel) {
		let Successes = {
			spoiled: `Accepted **spoiled** ballot from **${author.tag}** for election #**${channel}.**\nIf this was your intention, you do not need to reply, otherwise you may resubmit your ballot during the next 30 minutes.`,
			'spoiled revote': `Accepted **spoiled revote** ballot from **${author.tag}** for election #**${channel}.**`,
			revote: `Accepted valid **revote** ballot from **${author.tag}** for election #**${channel}.**`,
			vote: `Accepted valid ballot from **${author.tag}** for elecion #**${channel}.**`
		};
		if (output) this.Output.generic(Successes.hasOwnProperty(output) ? Successes[output] : output);
	}

	get election() {
		if (this._election) return this._election;
		return this.guild ? DataManager.getServer(this.guild.id, './src/data/votes.json') : null;
	}

	set election(election) {
		this._election = election;
		DataManager.setServer(election, './src/data/votes.json');
	}

	get matches() {
		if (!this._matches) this._matches = this.message.content.match(/^#VoterID: (?:[0-9]{18})$\n^#ServerID: (?:[0-9]{18})$\n^#Channel: (?:[\w-]+)$\n(?:^(?:\[(?:[0-9]*)\]\s(?:[\w\s]{2,32}#(?:[0-9]{4})|Write-In|Blank Vote)$\n?)+)/gm);
		return this._matches;
	}

	async receive() {
		try {
			let successfulchannels = [];
			for (let match of this.matches) try {
				let ballot = new Ballot(match);
				if (ballot.voter !== this.author.id) throw 'stolen'; //changed voterID (perhaps to another user)
				this.message._guild = this.client.guilds.get(ballot.server);
				if (!this.guild) throw 'noGuild'; //changed serverID to other 18 digit code (for whatever reason)
				let election = this.election;
				if (!this.server.states.election.voting) throw 'state'; //voting period has closed
				if (!election.type) throw 'state';
				if (!election.elections[ballot.channel]) throw 'noElection'; //changed channel (election) name to something invalid
				if (!election.elections[ballot.channel].voters[ballot.voter]) throw 'ineligible'; //changed channel name to other election not eligible for
				if (ballot.zeroes) throw 'zeroes'; //added a zero [0] option
				if (ballot.writeIn) throw 'badWriteIn'; //added a number [1] to 'Wrote-In'
				if (ballot.duplicates) throw 'duplicates'; //wrote the same number next to more than one
				if (!ballot.ascending) throw 'badOrder'; //added a zero [0] option
				let votes = ballot.votes
					.filter(vote => !vote || vote === 'blank' || this.Search.users.byTag(vote)) //so the ballot.votes[0] = false gets filtered to stay in
					.map(vote => typeof vote === 'string' ? (vote === 'blank' ? 'blank' : this.Search.users.byTag(vote).id) : Date.now()); //here's where the date is added
				if (votes.length !== ballot.votes.length) throw 'missingUsers';
				if (election.elections[ballot.channel].voters[ballot.voter][0]) { //revote
					if (Date.now() - election.elections[ballot.channel].voters[ballot.voter][0] > 1800000) throw 'timeout'; //trying to revote out of time (more than half a hour later)
					else {
						for (let candidate of vote) {
							if (!election.elections[ballot.channel].candidates[candidate]) {
								election.elections[ballot.channel].candidates[candidate] = [];
								Logger.command([user.tag, 'Election/vote', 'candidate register' , candidate]);
							}
						}
						if (ballot.spoiled) this.resolve('spoiled revote', this.author, ballot.channel);
						else this.resolve('revote', this.author, ballot.channel);
					}
				} else {
					for (let candidate of vote) {
						if (!election.elections[ballot.channel].candidates[candidate]) {
							election.elections[ballot.channel].candidates[candidate] = [];
							Logger.command([user.tag, 'Election/vote', 'candidate register' , candidate]);
						}
					}
					if (ballot.spoiled) this.resolve('spoiled', this.author, ballot.channel);
					else this.resolve('vote', this.author, ballot.channel);
				}
				election.elections[ballot.channel].voters[ballot.voter] = votes;
				successfulchannels.push(ballot.channel);
				this.election = election;
			} catch (e) {
				if (Errors[e]) {
					let embed = {
						color: config.colors.error,
						description: Errors[e],
						fields: []
					};
					if (this.matches.length >= 2) embed.fields.push({
						name: 'Invalid Ballot:',
						value: '```css\n' + match + ' '.repeat(20) + '\n\u200b' + '```',
						inline: false
					});
					`[Vote, ${this.author.tag}, ${Errors[e]}]`;
					this.Output.sender(embed);
				} else
				if (typeof e === 'string') {
					this.error(e);
					this.Output.sender({
						color: config.colors.error,
						description: e
					});
				} else throw e;

			}
			Logger.command([user.tag, 'Election/vote', 'vote', '[' + successfulchannelchannels.join(', ') + ']']);
			if (this.guild) this.Output.sender({
				title: 'New vote from ' + this.author.tag,
				description: '```css\n#' + successfulchannels.join('\n#') + '\n```'
			}, this.Search.channels.get(this.server.channels.mod));
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

}

module.exports = Vote;