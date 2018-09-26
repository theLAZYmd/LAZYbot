const Main = require("./main.js");
const DataManager = require("../../util/datamanager.js");

class Votes extends Main {

  constructor(message) {
    super(message);
  }

  async open() {
    if (!this.server.states.register) return this.Output.onError("Cannot initiate voting without voter registration.");
    if (this.server.states.candidates) return this.Output.onError("Cannot initiate voting while candidate registration is still open.");
    this.server.states.election.voting = true;
    DataManager.setServer(this.server);
    this.Output.generic("Opened voting on server **" + this.guild.name + "**.");
  }

  async close() {
    this.server.states.election.voting = false;
    DataManager.setServer(this.server);
    this.Output.generic("Closed voting on server **" + this.guild.name + "**.");
  }

  async count() {
    try {
      if (!this.server.states.register || this.server.states.candidates) throw "Cannot begin voter count before voting has begun.";
      if (this.server.states.voting) throw "Cannot initiate voting while voting is still open.";
      let election = this.election;
      let msg = await this.Output.generic("Initialised final vote count for " + Object.keys(election).filter(property => !property.startsWith("_")).length + " elections...");
      let system = config.electorals[election.system];
      if (!system) throw "Couldn't find valid electoral system by which to count up votes.";
      let Count = require("./electorals/" + system.file + ".js");
      if (!Count || typeof Count.rank !== "function") throw "Couldn't find valid process by which to count up votes.";
      await this.Output.editor("Counting up the votes...", msg)
      for (let [channel, data] of Object.entries(election.elections)) {  //I say it's 'channel' but really it's any validated election
        if (!election.hasOwnProperty(channel)) continue;
        await this.Output.editor("Counting up the votes for election... **" + channel + "**", msg);
        let candidates = await this.parseCandidates(data.candidates);
        //create a map for the candidates
        //exclude candidates that couldn't be found
        let votes = await this.parseVotes(data.voters);
        let raw = await require("./" + election.system.toLowerCase() + "./main.js").rank(candidates, votes);  
        election.elections[channel].results = await this.parseResults(raw); //need to use 'in' iterator for setters
      };
      await this.Output.editor("Setting the result...");
      this.election = election;
      await this.Output.editor(`Ready for output from command \`${this.server.prefixes.generic}output\``);
    } catch (e) {
      if (e) this.Output.onError(e);
    }
  }
  
  static async parseResults(resultsData) { //this method is currently the outputter. Really we just need the reverse of this.parseCandidates()
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

  static async parseCandidates(candidates) {
    let array = [];
    for (let i = 0; i < candidates.length; i++) {
      array[i] = i;
    };
    return array;
  }

  static async parseVotes(votingData) { //tak
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
              }
            }
          }
        })
      };
      DataManager.setServer(this.server);
      resolve("Registered candidates in database.");
    })
  }

  parse() { //not sure what this was for
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

class Mock {

  static gen(args = [4, 10]) { //for simulations: used for generating an array of votes
    let array = Mock.genMockRange(args[0], args[1]); //[[4, 2, 3], [1, 2, 4], [1, 2], [1, 3, 4, 2]]
    let array2 = Votes.stringifyVotes(array); //[423, 124, 12, 1342]
    return array2;
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

}

module.exports = Votes;