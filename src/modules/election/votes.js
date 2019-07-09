const Main = require('./main');
const Embed = require('../../util/embed');
const Logger = require('../../util/logger');
const DataManager = require('../../util/datamanager');
const Permissions = require('../../util/permissions');

class Votes extends Main {

	constructor(message) {
		super(message);
	}

	async open() {
		try {
			if (!Permissions.state('election.register', this)) throw 'Cannot initiate voting without voter registration.';
			if (Permissions.state('election.candidates', this)) throw 'Cannot initiate voting while candidate registration is still open.';
			this.server.states.election.voting = true;
			DataManager.setServer(this.server);
			this.Output.generic('Opened voting on server **' + this.guild.name + '**.');
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	async close() {
		this.server.states.election.voting = false;
		DataManager.setServer(this.server);
		this.Output.generic('Closed voting on server **' + this.guild.name + '**.');
	}

	async count() {
		try {
			if (Permissions.state('election.count', this)) throw 'Election results have already been counted.';
			await this.recount();
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	async recount() {
		try {
			if (!Permissions.state('election.register', this) || Permissions.state('election.candidates', this)) throw 'Cannot begin voter count before voting has begun.';
			if (Permissions.state('election.voting', this)) throw 'Cannot initiate count while voting is still open.';
			let election = this.election;
			let msg = await this.Output.generic('Initialised final vote count for ' + Object.keys(election.elections).length + ' elections...');
			if (!election.system) throw 'Couldn\'t find valid electoral system by which to count up votes.';
			let Count = require('./' + election.system + '/main');
			if (!Count || typeof Count.rank !== 'function') throw 'Couldn\'t find valid process by which to count up votes.';
			await this.Output.editor({
				description: 'Counting up the votes...'
			}, msg);
			for (let [channel, data] of Object.entries(election.elections)) {
				await this.Output.editor({  description: 'Counting up the votes for election... **' + channel + '**'  }, msg);
				Logger.verbose('Counting #' + channel);
				let candidates = await this.parseCandidates(data);
				let votes = await this.parseVotes(data.voters, candidates);
				let raw = await require('./' + election.system.toLowerCase() + '/main').rank(candidates.map(c => candidates.indexOf(c)), votes);
				election.elections[channel].results = await this.parseResults(raw, candidates); //need to use 'in' iterator for setters
				Logger.data(election.elections[channel].results);
			}
			await this.Output.editor({  description: 'Setting the result...'  }, msg);
			this.election = election;
			this.server.states.election.count = true;
			DataManager.setServer(this.server);
			await this.Output.editor({
				description: `Ready for output from command \`${this.server.prefixes.generic}votes output\``
			}, msg);
			this.output();
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	async parseCandidates(data) { //returns an array with userIDs ["133249411303211008", "333586342275710978", "340160754936184832"]
		let array = Object.keys(data.candidates)    //turn the original list of candidates into ids
			.filter(candidate => candidate === 'blank' || this.Search.members.get(candidate)) //excludes users who aren't part of the server anymore
			.map(candidate => candidate === 'blank' ? 'blank' : this.Search.users.get(candidate).id); //maps them all to their ids);
		for (let votes of Object.values(data.voters))   //for each vote, if someone voted for a candidate not on the list, include them
			for (let vote of Object.values(votes))
				if (!array.includes(vote))
					array.push(vote);
		return array.filter(candidate => candidate === 'blank' || this.Search.members.get(candidate)); //excludes users who aren't part of the server anymore
		//.map(candidate => candidate === "blank" ? "blank" : this.Search.users.get(candidate).id) //maps them all to their ids, should be superfluous
	}

	async parseVotes(voters, candidates) {
		let array = [];
		for (let votes of Object.values(voters)) //votes are hereon anonymous
			if (votes[0]) array.push(votes
				.filter(vote => candidates.includes(vote))
				.map(vote => candidates.indexOf(vote))
				.join('')
			);
		return array;
	}

	async parseResults(raw, candidates) { //returns an array with userIDs ["133249411303211008", "333586342275710978", "340160754936184832"]
		return raw.map(string => string.split('')
			.map(index => candidates.map(candidate => candidate === 'blank' ? 'blank' : this.Search.users.get(candidate).tag)[Number(index)])
		);
	}

	async output() {
		try {
			if (!Permissions.state('election.count', this)) throw 'Cannot output results before results have been counted.';
			let election = this.election;
			let embed = new Embed()
				.setTitle((this.server.emoji ? this.Search.emojis.get(this.server.emoji) + ' ' : '') + this.guild.name + ' ' + election.type.toProperCase() + ' Mod Elections')
				.setDescription('Election results modelled using ' + Main.Systems[election.system] + ' electoral system.\n' +
					'\'**----------**\' denotes a blank vote. No candidate placed underneath a blank vote, regardless of whether they reached the threshold for election may take up their position as elected mod.')
				.setFooter('A result is revealed when ' + election.reveal + ' members of a respective electorate react to this message.');
			let emojis = [], data = {};
			Object.keys(election.elections).forEach(async (channel) => {
				embed.addField((election.type === 'channel' ? '#' : '') + channel, '\u200b', true);
				data[channel] = 0;
				let emoji = this.Search.emojis.get(channel);
				if (emoji) return emojis.push(emoji);
				return emojis.push(this.Search.emojis.get(await this.Output.response({
					description: 'Please enter an emoji corresponding to the channel ' + channel + '.',
					filter: argument => this.Search.emojis.get(argument)
				})));
			});
			let msg = await this.Output.reactor(embed, this.channel, emojis);
			let reactionmessages = this.reactionmessages;
			if (!reactionmessages['election/votes']) reactionmessages['election/votes'] = {};
			reactionmessages['election/votes'][msg.id] = data;
			this.reactionmessages = reactionmessages;

		} catch (e) {
			if (e) throw new Error(e);
		}
	}

	async react(messageReaction, user, data) {  //reaction comes in
		try {
			let reactionmessages = this.reactionmessages;
			if (messageReaction.emoji.name === '❎' && this.author.id === '185412969130229760') {
				delete reactionmessages['election/votes'][messageReaction.message.id];
				this.reactionmessages = reactionmessages; //and set it
				messageReaction.message.delete();
				return;
			}
			let _channel = this.Search.channels.get(messageReaction.emoji.name);
			if (!_channel) return;
			let channel = _channel.name;   //channel name parsed from emoji name
			let election = this.election;
			if (!election.elections[channel].voters[user.id]) return messageReaction.remove(user);  //if not a member of the electorate, remove that emoji
			data[channel]++;    //increase the data count
			reactionmessages['election/votes'][messageReaction.message.id] = data;
			this.reactionmessages = reactionmessages; //and set it
			if (data[channel] < Number(election.reveal)) throw '';
			let embed = new Embed(messageReaction.message.embeds[0]);   //if we've reached the threshold, begin the editing process
			let d = embed.fields.map(({ name }) => name.slice(1).replace(/[^a-z]+/gi, ''));  //shallow-copy the fields array mapped by name
			let i = d.indexOf(channel.replace(/[^a-z]+/gi, ''));     //search for the channel name in that array
			if (i === -1) throw 'Couldn\'t find election \'' + channel + '\' for which to reveal results!';    //and if we can't find it, throw an error
			let j = 0;
			let r = election.elections[channel].results.map((s) => {    //   [["ProgramFOX#1012"],["hauptschule#7105"],["Andrew#5850"],["Raven#9079"],["ijh#0966"],["blank"]]
				for (let k in Object.keys(s))
					if (s[k] === 'blank') s[k] = '----------';
				s = s.join('; ');   //for ties, shouldn't really happen anymore
				if (j === 0) s = '**' + s + '** 🥇';
				else if (j === 1) s = '**' + s + '** 🥈';
				j++;
				return s;
			});
			embed.fields[i].value = r.toRank();
			this.Output.editor(embed, messageReaction.message);
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

}

class Mock {

	static gen(args = [4, 10]) { //for simulations: used for generating an array of votes
		let array = Mock.genMockRange(args[0], args[1]); //[[4, 2, 3], [1, 2, 4], [1, 2], [1, 3, 4, 2]]
		let array2 = Mock.stringifyVotes(array); //[423, 124, 12, 1342]
		return array2;
	}

	static genMockRange(candidatelimit, voterlimit) {
		let range = [];
		for (let i = 0; i < voterlimit; i++) {
			//let newRange = Math.genRange(candidatelimit).shuffle()
			//range.push(newRange.splice(0, Math.randBetween(0, newRange.length))); //[4, 2, 3]
			range.push(Math.genRandomList(candidatelimit, true)); //alternative method
		}
		return range; //[[4, 2, 3], [1, 2, 4], [1, 2], [1, 3, 4, 2]]
	}

	static stringifyVotes(votes) { //votes input is a double array
		let range = [];
		for (let i = 0; i < votes.length; i++) {
			let string = '';
			for (let j = 0; j < votes[i].length; j++) {
				string += votes[i][j];
			}
			range.push(string); //[423, 124, 12, 1342]
		}
		return range;
	}

}

module.exports = Votes;