class Vote extends Parse {

  constructor(message) {
    super(message);
  }

  setData() {
    this.error()
      .then((args) => {
        let ascendingArray = [];
        let duplicateArray = [];
        for (let i = 0; i < args.length; i++) {
          let vote = args[i].match(/(?:\[([1-9]?)\]\s([a-zA-Z0-9_\s]+#(?:[0-9]{4})|Write-In|Blank Vote))/);
          if (vote[1]) {
            vote[1] = parseInt(vote[1]);
            let user = vote[2] === "Blank Vote" ? {
              "id": "blank"
            } : this.Search.users.get(vote[2]);
            if (user) {
              this.votingData[this.id][0] = Date.now();
              this.votingData[this.id][vote[1]] = user.id;
            };
            ascendingArray[vote[1]] = true;
            if (duplicateArray[vote[1]]) throw (`Invalid voting order! You must fill up your ballot from descending order.`);
            duplicateArray[vote[1]] = true;
          }
        };
        for (let i = 1; i < ascendingArray.length; i++) {
          if (!ascendingArray[i]) throw (`Invalid voting order! You may not use the same number twice.`);
        };
        return this.votingData;
      })
      .then((votingData) => {
        this.server.election[this.variant].voters = votingData;
        DataManager.setServer(this.server);
        this.Output.generic(`Accepted valid vote for **${this.author.tag}** for channel **${this.variant}** mod position.`);
        console.log(`Accepted valid vote for **${this.author.tag}** for channel **${this.variant}** mod position.`);
      })
      .catch(error => {
        if (error) this.Output.onError(this.author.tag + ": " + error)
      });
  }

  error() {
    return new Promise((resolve, reject) => {
      if (!this.server.states.election) return reject();
      if (!this.matches) return reject("Invalid Ballot! No vote counted.");
      if (!this.id) return reject("Invalid Ballot! No vote counted.");
      if (this.id !== this.author.id) return reject("Invalid Ballot! No vote counted.");
      if (!this.variant) return reject("Invalid Ballot! No vote counted.");
      if (!this.args || !this.args.join("\n").match(/(?:\[([1-9]?)\]\s([a-zA-Z0-9_\s]+#(?:[0-9]{4})|Write-In|Blank Vote))/g)) {
        this.votingData[this.id] = [Date.now(), null]
        return reject("You have successfully submitted a spoiled ballot.\nIf this was your intention, you do not need to reply.\nIf this was not your intention, you may try to resubmit your ballot for the next 30 minutes.");
      }
      if (!this.register) return reject("You are ineligible to vote."); //not validated
      if (!this.register.includes(this.variant)) return reject("You cannot vote for that channel."); //not validated for that channel
      if (this.votingData[this.id][0] && Date.now() - this.votingData[this.id][0] > 1800000) return reject("You have already voted for that channel."); //half an hour timer to change vote
      else resolve(this.args);
    })
  }

  get args() {
    return this.message.content.split("\n").slice(2)
  }

  get matches() {
    let matches = this.message.content.match(/VoterID: ((?:[0-9]{18}))\n#Channel: ([a-z0-9\-]+)/);
    return matches;
  }

  get id() {
    return this.matches[1];
  }

  get variant() {
    return this.matches[2];
  }

  get votingData() {
    return this.server.election[this.variant].voters;
  }

  set votingData(object) {
    this.server.election[this.variant].voters = object;;
  }

  get register() {
    return this.server.election.voters[this.id];
  }

  set register(object) {
    this.server.election.voters[this.id] = object;
  }

}

class Votes extends Parse {
  constructor(message) {
    super(message);
  }

  parseResults(resultsData) {
    for (let channel in resultsData) { //for each channel
      this.server.election[channel].results = [];
      for (let i = 0; i < resultsData[channel].length; i++) { //for each placing in that channel [ '2', '1', '3', '456' ]
        console.log(resultsData[channel])
        let placing = {
          "title": "House Server #" + channel + " Mod Elections",
          "description": ""
        };
        for (let j = 0; j < resultsData[channel][i].length; j++) { //for each number in that result
          for (let candidate in this.server.election[channel].candidates) { //for all the candidates
            if (this.server.election[channel].candidates[candidate].toString() === resultsData[channel][i][j].toString()) {
              if (!candidate) continue;
              let user = this.Search.users.byID(candidate);
              if (candidate === "blank") user = {
                "tag": "A blank vote entry"
              };
              if (!user) continue;
              placing.description += user.tag + " has finished in place **" + (i + 1) + "**.\n";
            }
          }
        };
        console.log(placing);
        this.server.election[channel].results.push(placing);
      };
      this.server.election[channel].results.reverse();
    };
    DataManager.setServer(this.server);
  }

  gen(args) { //for simulations: used for generating an array of votes
    return new Promise((resolve, reject) => {
      let array = Votes.genMockRange(args[0], args[1]); //[[4, 2, 3], [1, 2, 4], [1, 2], [1, 3, 4, 2]]
      let array2 = Votes.stringifyVotes(array); //[423, 124, 12, 1342]
      this.Output.generic(JSON.stringify(array2, null, 4));
      resolve(array2);
    })
  }

  clean() { //removes null values from the db. idk how they got there
    return new Promise((resolve, reject) => {
      this.forEachVote((voter, votes) => {
        for (let i = 0; i < votes.length; i++) {
          if (!votes[i]) {
            votes.remove(i);
            i--;
            console.log("Removed null values for " + voter + ".");
          }
        }
      })
      DataManager.setServer(this.server);
      resolve("Successfully removed null values in the voting database.");
    })
  }

  consolidate() { //tak
    return new Promise((resolve, reject) => {
      for (let channel in this.server.election) {
        if (channel === "voters") continue;
        let array = [];
        this.server.election[channel].candidates = {};
        this.forEachVoteinChannel(channel, (voter, _votes) => {
          let votes = Array.from(_votes);
          if (votes[0] && votes[1]) { //if they voted (produced a date) and they voted for someone
            votes.remove(0);
            if (votes[0]) {
              for (let i = 0; i < votes.length; i++) {
                if (!array.inArray(votes[i])) {
                  let user = this.Search.users.byID(votes[i]);
                  let member = this.Search.members.get(user);
                  if (votes[i] === "blank") user = {
                    "tag": "blanktag",
                    "id": "blank"
                  };
                  if (!user || this.Check.role(member, this.server.roles.admin)) continue;
                  array.push(votes[i])
                  this.server.election[channel].candidates[votes[i]] = array.indexOf(votes[i]) + 1;
                  //this.Output.generic("Registered candidate " + user.tag + " for channel " + channel + ".", this.Search.channels.get(this.server.channels.mod));
                  console.log("Registered candidate " + user.tag + " for channel " + channel + ".");
                }
              };
            }
          }
        })
      };
      DataManager.setServer(this.server);
      resolve("Registered candidates in database.");
    })
  }

  parse() {
    let votingData = {};
    for (let channel in this.server.election) {
      let array = [];
      let index = 0;
      this.forEachVoteinChannel(channel, (voter, votes) => {
        if (votes[0] && votes[1]) {
          votes.remove(0);
          for (let i = 0; i < votes.length; i++) {
            votes[i] = this.server.election[channel].candidates[votes[i]];
          };
          votes.clean();
          array[index] = votes;
          index++;
        }
      });
      let voteString = Votes.stringifyVotes(array);
      votingData[channel] = voteString;
    };
    return votingData;
  }

  forEachVoteinChannel(channel, voterFunction) {
    for (let voter in this.server.election[channel].voters) {
      voterFunction(voter, this.server.election[channel].voters[voter]);
    }
  }

  forEachVote(voterFunction) {
    for (let channel in this.server.election) {
      this.forEachVoteinChannel(channel, voterFunction);
    }
  }

  static genMockRange(candidatelimit, voterlimit) {
    let range = [];
    for (let i = 0; i < voterlimit; i++) {
      //let newRange = Math.genRange(candidatelimit).shuffle()
      //range.push(newRange.splice(0, Math.randBetween(0, newRange.length))); //[4, 2, 3]
      range.push(Math.genRandomList(candidatelimit, true)); //alternative method
    };
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

class AV extends Parse {

  static rank(votes, candidates) { //votes = [423, 124, 12, 1342], candidates = [1, 2, 3, 4, 5, 6]
    let data = {
        "count": candidates.length,
        "candidates": candidates,
        "eliminated": [],
        "finished": false,
        "votes": votes,
      },
      order = "";
    let i = 0;
    while (!data.finished) {
      console.log('Cycle ' + i);
      data.cycle = i;
      data = AV.cycle(data);
      i++;
    };
    order = data.eliminated.reverse();
    console.log(order);
    return order;
  }

  static cycle(data) {
    let resultsMap = AV.getMap(data.votes, data.candidates); //create a new map from votes and candidates
    console.log(resultsMap);
    let toRemoveList = AV.findElims(resultsMap);
    for (let i = 0; i < toRemoveList.length; i++) { //for everyone that needs to be removed
      let toRemove = toRemoveList[i]; //take the single person who needs to be removed
      data.votes = AV.iterate(toRemove, data.votes);
      let index = -1;
      for (let j = 0; j < data.candidates.length; j++) {
        if (data.candidates[j].toString() === toRemove.toString()) index = j;
      };
      data.candidates.splice(index, 1);
    };
    resultsMap = AV.getMap(data.votes, data.candidates); //create a new map from votes and candidates
    console.log(resultsMap);
    data.eliminated[data.cycle] = toRemoveList.join("");
    if (data.eliminated.join("").length === data.count) data.finished = true;
    return data;
  }

  static getMap(votes, candidates) { //returns a map based on first preference votes
    let range = new Map(); //creates an map []
    for (let i = 0; i < candidates.length; i++) {
      range.set(candidates[i].toString(), 0); //sets array index(candidate) value(0), ex: [1: 0, 2: 0]
    };
    for (let i = 0; i < votes.length; i++) {
      let initVote = votes[i].charAt(0); //first preference vote
      if (initVote !== '') {
        let mapGet = range.get(initVote);
        if (mapGet === undefined) range.set(initVote, 1);
        else range.set(initVote, mapGet + 1);
      }
    }
    return range; //ex: [1: 4, 2: 7...] etc.
  }

  static iterate(toRemove, votes) {
    for (let i = 0; i < votes.length; i++) {
      votes[i] = votes[i].replace(toRemove, "");
    };
    return votes;
  }

  static findElims(map) {
    let elims = [];
    if (!elims[0]) elims = AV.findZeroes(map);
    if (!elims[0]) elims = AV.findLowest(map);
    return elims;
  }

  static findZeroes(map) { //
    let zeroes = [];
    map.forEach((value, key) => {
      if (value === 0) zeroes.push(key);
    });
    return zeroes;
  }

  static findLowest(map) { //edited so that they return arrays now, not single instances
    let lowest = [];
    let lowestValue = Infinity;
    map.forEach((value, key) => {
      if (value < lowestValue) lowestValue = value;
    });
    map.forEach((value, key) => {
      if (value === lowestValue) lowest.push(key);
    });
    return lowest;
  }

  static findHighest(map) { //
    let highest = [];
    let highestValue = 0;
    map.forEach((value, key) => {
      if (value < highestValue) {
        lowest.push([key]);
        highestValue = value;
      }
    });
    return highest;
  }

  static mapConcat(map) {
    let range = true;
    map.forEach(function (value, key) {
      range += value;
    });
    return range;
  }

}

class Election extends Parse {

  constructor(message) {
    super(message);
    this.voters = new Voters(message);
    this.candidates = new Candidates(message);
    this.ballot = new Ballot(message);
    this.vote = new Vote(message);
    this.votes = new Votes(message);
    this.AV = AV;
  }

  postResults() {
    for (let i = 0; i < this.server.election[this.channel.name].results; i++) {
      this.channel.send(this.server.election[this.channel.name].results[i])
    };
    this.message.delete();
  }

  count() {
    if (!this.Check.owner(this.member)) return this.Output.onError("Insufficient permissions to run this command!");
    this.Output.generic("Initiated vote count.");
    this.Output.generic("Created Voting Data object to be counted... done.")
    let data = {
      "votingData": this.votes.parse(),
      "results": {}
    };
    this.Output.generic("Counting up the votes... done.")
    for (let channel in data.votingData) {
      if (channel === "voters") continue;
      let candidates = this.server.election[channel].candidates;
      data.results[channel] = this.AV.rank(data.votingData[channel], Object.values(candidates));
    };
    this.Output.generic("Outputting the result...")
    this.votes.parseResults(data.results);
    this.Output.generic("React to this message with your variant channel's emoji.\nIf this message receives 5 reactions from eligible voters of a channel's eligible members it will post the results.")
      .then(msg => {
        for (let channel in this.server.election) {
          if (channel === "voters") continue;
          let emoji = this.Search.emojis.get(channel.replace("-", ""));
          msg.react(emoji);
        };
      })
  }

  init() {
    if (!this.Check.owner(this.member)) return this.Output.onError("Insufficient permissions to run this command!");
    Election.toggleState(true);
    this.ballot.sendAll() //initiate sending of ballots
      .then(success => this.Output.generic(success))
      .catch(e => console.log(e));
  }

  end() {
    if (!this.Check.owner(this.member)) return this.Output.onError("Insufficient permissions to run this command!");
    this.toggleState(false);
    this.Output.generic("Closed voting functions on server " + this.guild.name + ". Please do not try to vote. Begin counting process with `!beginCount`");
  }

  clean() {
    if (!this.Check.owner(this.member)) return this.Output.onError("Insufficient permissions to run this command!");
    this.votes.clean()
      .then(success => this.Output.generic(success))
      .catch(e => console.log(e));
  }

  consol() {
    if (!this.Check.owner(this.member)) return this.Output.onError("Insufficient permissions to run this command!");
    this.votes.consolidate()
      .then(success => this.Output.generic(success))
      .catch(e => console.log(e));
  }

  res(args) {
    if (!this.Check.owner(this.member)) return this.Output.onError("Insufficient permissions to run this command!");
    this.server.states.election = true; //set state to accept votes
    DataManager.setServer(this.server);
    let user = this.Search.users.get(args[0]);
    this.ballot.sendOne(user) //sends one ballot to one person
      .then(success => this.Output.generic(success))
      .catch(e => console.log(e));
  }

  config() {
    let voters = {};
    for (let channel in this.server.election) {
      for (let voter in this.server.election[channel].voters) {
        if (!voters[voter]) voters[voter] = [channel];
        else voters[voter].push(channel);
      };
      console.log("Completed transfer of data for channel " + channel + ".")
    }
    this.server.election.voters = voters;
    DataManager.setServer(this.server);
  }

  countnow() {
    let string = "";;
    for (let channel in this.server.election) {
      if (channel === "voters") continue;
      let count = 0;
      for (let voter in this.server.election[channel].voters) {
        if (this.server.election[channel].voters[voter][0]) count++;
      };
      string += "Registered **" + count + "** votes in **" + channel + "** channel.\n"
    };
    this.Output.generic(string.trim());
  }

  toggleState(set) {
    this.server.states.election = set ? set : !this.server.states.election; //set state to accept votes
    DataManager.setServer(this.server);
  }

}

module.exports = Election;