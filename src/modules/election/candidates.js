const Parse = require("../../util/parse.js");
const DataManager = require("../../util/datamanager.js");
const Ballot = require("./ballot.js");

class Candidates extends Parse {

  constructor(message) {
    super(message);
    this.election = this.guild ? DataManager.getServer(this.guild.id, "./src/data/votes.json") : "";
  }

  async setData(election) {
    DataManager.setServer(election, "./src/data/votes.json");
  }

  async run(args) {
    try {
      let command = args.shift().toLowerCase();
      if (typeof this[command] === "function") this[command](args); //looks for, this.register(), this.get(), this.disqualify()
      else throw "Invalid second parameter given **" + command + "**.";
    } catch (e) {
      if (e) this.Output.onError(e);
    }
  }

  async register(args) {
    try {
      if (!await this.Permissions.state("election.registering", this)) {
        if (!await this.Permissions.state("election.voting", this)) throw "Registering for candidates has not yet begun on server " + this.guild.name + ".";
        else throw "Registering for candidates has closed on server " + this.guild.name + ".";
      };
      let election = args[0];
      let channel = this.Search.channels.get(args[0]), user = this.author;
      if (channel) election = channel.name; 
      if (args[1]) {
        if (!this.Permissions.role("owner", this)) throw "Insufficient server permissions to use this command.";
        user = this.Search.users.get(args[1]);
        if (!user) throw "Couldn't find user **" + args[1] + "**!";
      };
      if (!this.election[election]) throw "Couldn't find election **" + election + "**! Please use command `${generic}voters` to view list of elections.";
      if (!this.election[channel.name].candidates) this.election[channel.name].candidates = [];
      if (this.election[channel.name].candidates.includes(user.tag)) throw `Already registered candidate **${user.tag}** for channel **${channel.name}**.`;
      let channels = Ballot.validate(this.election, user, "candidates");
      if (channels.length >= (this.election._limit || 2)) throw `Already registered candidate **${user.tag}** for channels **${channels.join(", ")}**!\nCannot run for more than ${this.election._limit} channels.`;
      this.election[channel.name].candidates.push(user.tag);
      this.setData(this.election);
      this.Output.generic(`Registered candidate **${user.tag}** for channel **${channel.name}**.`)
    } catch (e) {
      if (e) this.Output.onError(e);
    }
  }

  async open() {
    this.server.states.election.registering = true;
    DataManager.setServer(this.server);
  }

  async close() {
    this.server.states.election.registering = false;
    DataManager.setServer(this.server);
  }

}

module.exports = Candidates;