const Parse = require("../util/parse.js");
const DataManager = require("../util/datamanager.js");
const DBuser = require("../util/dbuser.js");
const Embed = require("../util/embed.js");

class AV extends Parse {

  constructor(message) {
    super(message);

  }

  static stringifyVotes(votes) { //votes input is a double array
    let r = [];
    for(let i = 0; i < votes.length; i++) {
      let r_ = '';
      for(let j = 0; j < votes[i].length; j++) {
        r_ += votes[i][j];
      }
      r.push(r_);
    }
    return r;
  }

  static initialResults(votes, Cs) {
    let r = new Map();
    for(let i = 0; i < Cs.length; i++) {
      r.set(Cs[i], 0);
    }
    for(let i = 0; i < votes.length; i++) {
      let initVote = votes[i].charAt(0);
      if(initVote !== '') {
        let mapGet = r.get(initVote);
        if(mapGet === undefined) r.set(initVote, 1);
        else r.set(initVote, mapGet+1);
      }
    }
    return r;
  }

  static getNextTransfers(vs, Rs) {
    let transfers = [];
    for(let i = 0; i < vs.length; i++) { 
      let next = vs[i].match(new RegExp('[^'+Rs+']['+Rs+']*[^'+Rs+']'));
      if(next !== null) transfers.push(next[0]);
    }
    return transfers;
  }

  static findLowestInMap(map) {
    let lowest = [];
    map.forEach(function (v, k) {
      if(lowest[1] === undefined || v < lowest[1]) lowest = [k, v];
    });
    return lowest[0];
  }

  static findHighestInMap(map) {
    let highest = [];
    map.forEach(function (v, k) {
      if(highest[1] === undefined || v > highest[1]) highest = [k, v];
    });
    return highest[0];
  }

  static allInMapBool(map, eq) {
    let r = true;
    map.forEach(function (v, k) {
      if(v !== eq || r === false) r = false;
    });
    return r;
  }

  static mapConcat(map) {
    let r = true;
    map.forEach(function (v, k) {
      r += v;
    });
    return r;
  }

  static iterate(lowest, results, votes, removed) {
    let transfers = AV.getNextTransfers(votes, removed);
    console.log(transfers);
    for(let i = 0; i < transfers.length; i++) {
      if(transfers[i].charAt(0) === lowest) {
        let to = transfers[i].charAt(transfers[i].length-1);
        let mapGet = results.get(to);
        if(mapGet === undefined) results.set(to, 1);
        else results.set(to, mapGet+1);
      }
    }
    results.delete(lowest);
    //console.log(results, removed);
    return lowest;
  }

  static result(votes_, Cs, Es = '') {
    const votes = AV.stringifyVotes(votes_);
    console.log(votes);
    let count = votes.length;
    let removed = '';
    let results = AV.initialResults(votes, Cs);
    
    console.log(results);
    for(let i = 0; i < Es.length; i++) {
      let lowest = Es[i];
      AV.iterate(lowest, results, votes, removed);
      removed = lowest + removed;
      console.log(results, removed);
    } 
    
    if(AV.allInMapBool(results, 0)) return {finished:true, r:results};
    results.forEach((value, key) => {
      if(value === 0) {
        removed = key + removed;
        results.delete(key);
      }
    });

    console.log(results, removed);
    for(let i = 0; i < count && results.get(AV.findHighestInMap(results)) < Math.floor(count/2) && results.size > 1; i++ ) {
      let lowest = AV.findLowestInMap(results);
      AV.iterate(lowest, results, votes, removed);
      removed = lowest + removed;
      console.log(results, removed);
    } 
  return {finished: false, r: AV.findHighestInMap(results)};
  }

  static rank(votes, Cs) {
    let order = '';
    let finished = false;
    for(let i = 0; i < Cs.length && !finished; i++) {
      console.log('Cycle ' + i);
      let next = AV.result(votes, Cs, order);
      finished = next.finished;
      if(finished) order += AV.mapConcat(next.r);
      else order += next.r;
    }
    return order;
  }

  static genRange(n) {
    let r = [];
    for(let i = 0; i < n; i++) {
      r.push(i);
    }
    return r;
  }

  static genOneList(n, lMax) {
    let range = AV.genRange(n);
    let r = [];
    let l = (lMax === false?Math.floor(Math.random()*(n+1)):n);
    for(let i = 0; i < l; i++) {
      r.push(range.splice(Math.floor(Math.random()*range.length),1)[0]);
    }
    return r;
  }

  static genAVVotes(c, n, lMax) {
    let r = [];
    for(let i = 0; i < c; i++) {
      r.push(AV.genOneList(n, lMax));
    }
    return r;
  }

}

class Voters extends Parse {

  constructor(message) {
    super(message)
  }

  add (args) {
    if(!this.Check.role(this.member, this.server.roles.admin)) return this.Output.onError("Insufficient permissions to do this!");
    if(args.length !==1) return this.Output.onError("Incorrect format.");
    let channel = this.Search.getChannel(args[0]);
    if(!channel) return this.Output.onError("Couldn't find matching channel!");
    let role = this.Search.getRole(channel.name);
    let voters = "", votercount = 0;
    if(!this.server.election[channel.name].voters) this.server.election[channel.name].voters = {};
    console.log(channel.name, role.name);
    for(let [key, member] of role.members) {
      let dbuser = DBuser.getfromuser(member.user);
      if(dbuser && dbuser.messages && dbuser.messages > 50) {
        console.log(`Acknowledging voting rights for ${member.user.tag}.`)
        voters += member.user.tag + "\n";
        this.server.election[channel.name].voters[key] = true;
        votercount++;
      }
    };
    DataManager.setServer(this.server);
    this.Output.sender({
      "title": `Eligble voters for ${channel.name}`,
      "description": voters,
      "footer": Embed.footer(`Generated ${votercount} voters.`)
    })
  }

  get (argument) {
    if(this.channel.name !== this.server.channels.bot) return this.Output.onError("Please use the #spam channel.");
    let channel = this.Search.getChannel(argument);
    let voters = "", votercount = 0;
    for(let voter in this.server.election[channel.name].voters) {
      let user = this.Search.get(voter);
      voters += user.tag + "\n";
      votercount++;
    };
    this.Output.sender({
      "title": `Eligble voters for ${channel.name}`,
      "description": voters,
      "footer": Embed.footer(`There are eligible ${votercount} voters.`)
    })
  }

  disqualify (args) {
    if(!this.Check.role(this.member, this.server.roles.admin)) return this.Output.onError("Insufficient permissions to do this!");
    let channel = this.Search.getChannel(args[0]);
    if(!channel) return this.Output.onError("Couldn't find matching channel!");
    args = args.slice(1);
    for(let i = 0; i < args.length; i++) {
      let user = this.Search.get(args[1]);
      if(!user) {
        this.Output.onError("Couldn't find matching user or channel!");
        continue;
      };
      if(this.server.election[channel.name].voters[user.id]) {
        delete this.server.election[channel.name].voters[user.id];
        this.Output.generic(`Successfully removed **${user.tag}** from the ballot.`)
      }
    };
    DataManager.setServer(this.server);
  }

  eligible(argument) {
    let channel = this.Search.getChannel(argument);
    if(!channel) return this.Output.onError("Couldn't find matching channel!");
    else return this.Output.generic(this.server.election[channel.name].voters[this.member.id] ? "Eligble to vote." : "Not eligible to vote.")
  }
  
}

class Candidates extends Parse {
  constructor(message) {
    super(message)
  }

  add (args) {
    if(!this.Check.role(this.member, this.server.roles.admin)) return this.Output.onError("Insufficient permissions to do this!");
    if(args.length !== 2) return this.Output.onError("Incorrect format.");
    let user = this.Search.get(args[0]);
    let channel = this.Search.getChannel(args[1]);
    if(!user || !channel) return this.Output.onError("Couldn't find matching user or channel!")
    let election = this.server.election || {};
    let candidates = election[channel.name] || {};
    candidates[user.tag] = 0;
    election[channel.name] = candidates;
    this.server.election = election;
    DataManager.setServer(this.server);
    this.message.delete();
    this.Output.generic(`Added **${user.tag}** to list of eligble candidates for channel **${channel.name}**.`)
  }
}

class Ballot extends Parse {

  constructor(message) {
    super(message);
  }

  run (args) {
    this.Output.sender(this.generateBallot(this.user, this.Search.getChannel(args[0])));
  }

  sendAll () {
    return new Promise ((resolve, reject) => {
      let ballotCount = 0, voterCount = 0;
      let modChannel = this.Search.getChannel(this.server.channels.mod);
      //(let voter in this.server.election.voters) {
        //let channels = this.server.election.voters[voter]
        let [voter, channels] = ["185412969130229760", this.server.election.voters["185412969130229760"]] //test-run
          let user = this.Search.get(voter);
          if(!user) return;
          this.sendBallots(user, channels) //this is the real deal. In the for(let loop, these will go out to every single user.
          .then(success => {
            console.log(success);
            this.Output.generic(success, modChannel);
          })
          .catch(e => console.log(e));
          ballotCount += channels.length;
          voterCount++;
      //};
      console.log(ballotCount, voterCount); //598, 109
      resolve(`Initiatialised OMEGA TEST of Election. Sending **${ballotCount}** ballots to **${voterCount}** voters.`);
    })

  }

  runMobile (user) { //hybrid command between the two, instead of sending as field, sends 
    if(!this.server.states.election) return;
    let ballotCount = 0, voterCount = 0;
    let modChannel = this.Search.getChannel(this.server.channels.mod);
    let [voter, channels] = [user.id, this.server.election.voters[user.id]]
    if(!voter) return;
    this.sendMobileBallot(user, channels) //this is the real deal. In the for(let loop, these will go out to every single user.
    .then(success => {
      console.log(success);
      this.Output.generic(success, modChannel);
    })
    .catch(e => console.log(e));
    ballotCount == channels.length;
    voterCount++;
    console.log(ballotCount, voterCount); //598, 109
  }

  sendMobileBallot (user, channels) {
    return new Promise ((resolve, reject) => {
      for(let i = 0; i < channels.length; i++) { //create a loop
        let channel = channels[i];
        let candidates = this.getCandidates(channel);
        let votingString = Ballot.parseCandidatestoVotingString(candidates);
        let ballot = `#VoterID: ${user.id}\n#Channel: ${channel}\n${votingString}[] Write-In\n[] Blank Vote\n\u200b`; //add a string to its test
        /*if(testballot.length > 2000) { //if exceeded length
          if(ballot) user.send(ballot); //send off the ballot
          ballot = "", testballot = ""; //and reset it
          continue;
        } else {
          ballot = testballot; //otherwise add the new addition to the string to the ballot
        }*/
        setTimeout(() => {
          user.send(ballot)
        }, 2000 * i);
      };
      resolve("Completed sending mobile ballots for " + user + ".");;
    })
  }

  sendBallots (user, channels) {
    return new Promise ((resolve, reject) => {
      let ballots = [
        {
          "author": {
            "name": "House Discord Server Mod Elections: 22/07/2018",
            "icon_url": "https://i.imgur.com/VId4nJT.png",
            "url": "https://discordapp.com/channels/314155682033041408/390264166843154433/468221167162097664"
          },
          "title": "This constitutes your voting ballot for this election.",
          "description": "The following field constitutes your voting ballot for this election.\nPlease copy and paste it below and fill in the checkboxes on the left with numbers, indicating your order of preference.\nYou do not have to fill every checkbox.\nYou must give numbers in ascending preference, for instance you may not vote `[1]`, `[2]`, and [`4`].\nIf you do not wish to vote, please write a `1` in the option for `Blank Vote` and do not make any other modifications. If you wish to vote for a candidate not listed, please replace the `Write-in` option with the user tag (username followed by 4-digit personal code) and assign the intended number.\nYou may resubmit a ballot for up to half an hour after voting. Simply copy and paste the updated ballot into your message field.",
          "fields": [],
          "footer": {
            "text": "Please do not make any other modifications to the ballot or your vote will be registered invalid."
          },
          "color": 15844367
        },
        {
          "fields": [],
          "footer": {
            "text": "Please do not make any other modifications to the ballot or your vote will be registered invalid."
          },
          "color": 15844367
        },
        {
          "fields": [],
          "footer": {
            "text": "Please do not make any other modifications to the ballot or your vote will be registered invalid."
          },
          "color": 15844367
        },
      ];
      let channelindex = 0;
      for(let i = 0; i < ballots.length; i++) {
        if(channelindex < channels.length) {
          setTimeout(() => {
            channelindex = this.sendBallot(user, ballots[i], channelindex, channels);
          }, 2000 * (i + 1))
        }
      };
      if(channelindex >= channels.length - 1) resolve("Completed sending ballots for " + user + ".");
    })
  }

  sendBallot(user, ballot, channelindex, channels) {
    while (channelindex < channels.length) {
      let channel = channels[channelindex];
      let candidates = this.getCandidates(channel);
      let votingString = Ballot.parseCandidatestoVotingString(candidates);
      let testballot = Object.assign({}, ballot);
      testballot.fields = Embed.fielder(testballot.fields,
        `#${channel} Ballot:`,
        `\`\`\`css\n#VoterID: ${user.id}\n#Channel: ${channel}\n${votingString}[] Write-In\n[] Blank Vote\`\`\``,
        false
      );
      let testmessage = JSON.stringify(testballot);
      channelindex++;
      if(testmessage.length < 2000) {
        ballot.fields = testballot.fields;
      } else break;
    };
    if(ballot.fields[0]) this.Output.sender(ballot, user);
    return channelindex;
  }

  generateRest (user, channel) {
    let candidates = this.getCandidates(channel);
    let votingString = Ballot.parseCandidatestoVotingString(candidates)
    let ballot = {
      "fields": [
        {
          "name": `#${channel} Ballot:`,
          "value": `\`\`\`css\n#VoterID: ${user.id}\n#Channel: ${channel}\n${votingString}[] Write-In\n[] Blank Vote\`\`\``,
          "inline": false
        }
      ],
      "color": 15844367
    };
    return ballot;
  }

  getCandidates(channel) {
    if(!channel) return this.Output.onError("Couldn't find matching channel!");
    return this.server.election[typeof channel === "string" ? channel : channel.name].candidates;
  }

  static parseCandidatestoVotingString(candidates) {
    let candidatesArray = [], string = "";
    for(let candidate in candidates) {
      if(!candidatesArray[0]) candidatesArray[0] = candidate;
      else candidatesArray.push(candidate);
    };
    candidatesArray.shuffle();
    for(let i = 0; i < candidatesArray.length; i++) {
      string += "[] " + candidatesArray[i] + "\n"
    };
    return string;
  }

}

class Vote extends Parse {
  
  constructor(message) {
    super(message);
  }

  setData () {
    this.error()
    .then((args) => {
      let ascendingArray = [];
      let duplicateArray = [];
      for(let i = 0; i < args.length; i++) {
        let vote = args[i].match(/(?:\[([1-9]?)\]\s([a-zA-Z0-9_\s]+#(?:[0-9]{4})|Write-In|Blank Vote))/);
        if(vote[1]) {
          vote[1] = parseInt(vote[1]);
          let user = this.Search.get(vote[2]);
          if(user) {
            this.votingData[this.id][0] = Date.now();
            this.votingData[this.id][vote[1]] = user.id;
          };
          ascendingArray[vote[1]] = true;
          if(duplicateArray[vote[1]]) throw (`Invalid voting order! You must fill up your ballot from descending order.`);
          duplicateArray[vote[1]] = true;
        }
      };
      for(let i = 1; i < ascendingArray.length; i++) {
        if(!ascendingArray[i]) throw (`Invalid voting order! You may not use the same number twice.`);
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
      if(error) this.Output.onError(this.author.tag + ": " + error)
    });
  }

  error () {
    return new Promise((resolve, reject) => {
      console.log(this.votingData[this.id][0], Date.now() - this.votingData[this.id][0]> 1800000)
      if(!this.server.states.election) reject();
      else if(!this.matches) reject("Invalid Ballot! No vote counted.");
      else if(!this.id) reject("Invalid Ballot! No vote counted.");
      else if(this.id !== this.author.id) reject("Invalid Ballot! No vote counted.");
      else if(!this.variant) reject("Invalid Ballot! No vote counted.");
      else if(!this.args || !this.args.join("\n").match(/(?:\[([1-9]?)\]\s([a-zA-Z0-9_\s]+#(?:[0-9]{4})|Write-In|Blank Vote))/g)) {
        this.votingData[this.id] = [Date.now(), null]
        reject("You have successfully submitted a spoiled ballot.\nIf this was your intention, you do not need to reply.\nIf this was not your intention, you may try to resubmit your ballot for the next 30 minutes.");
      }
      else if(!this.register) reject("You are ineligible to vote."); //not validated
      else if(!this.register.includes(this.variant)) reject("You cannot vote for that channel."); //not validated for that channel
      else if(this.votingData[this.id][0] && Date.now() - this.votingData[this.id][0] > 1800000) reject("You have already voted for that channel."); //half an hour timer to change vote
      else resolve(this.args);
    })
  }

  get args () {
    return this.content.split("\n").slice(2)
  }

  get matches () {
    let matches = this.content.match(/VoterID: ((?:[0-9]{18}))\n#Channel: ([a-z0-9\-]+)/);
    return matches;
  }

  get id () {
    return this.matches[1];
  }

  get variant () {
    return this.matches[2];
  }

  get votingData () {
    return this.server.election[this.variant].voters;
  }

  set votingData (object) {
    this.server.election[this.variant].voters = object;;
  }

  get register () {
    return this.server.election.voters[this.id];
  }

  set register (object) {
    this.server.election.voters[this.id] = object;
  }

}

class Election extends Parse {

  constructor(message) {
    super(message);
    this.voters = new Voters(message);
    this.candidates = new Candidates(message);
    this.ballot = new Ballot(message);
    this.vote = new Vote(message);
  }

  init () {
    if(!this.Check.owner(this.member)) return this.Output.onError("Insufficient permissions to run this command!");
    this.server.states.election = true; //set state to accept votes
    DataManager.setServer(this.server);
    this.ballot.sendAll() //initiate sending of ballots
    .then(success => this.Output.generic(success))
    .catch(e => console.log(e));
  }

  config () {
    let voters = {};
    for(let channel in this.server.election) {
      for(let voter in this.server.election[channel].voters) {
        if(!voters[voter]) voters[voter] = [channel];
        else voters[voter].push(channel);
      };
      console.log("Completed transfer of data for channel " + channel + ".")
    }
    this.server.election.voters = voters;
    DataManager.setServer(this.server);
  }

}

module.exports = Election;

Math.randBetween = function(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}

Array.prototype.shuffle = function () {
  let currentIndex = this.length, temporaryValue, randomIndex;
  while (0 !== currentIndex) { // while there remain elements to shuffle...
    randomIndex = Math.randBetween(0, currentIndex); // pick a remaining element...
    currentIndex--;
    temporaryValue = this[currentIndex]; // and swap it with the current element.
    this[currentIndex] = this[randomIndex];
    this[randomIndex] = temporaryValue;
  }
  return this;
}