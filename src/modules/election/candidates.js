const Parse = require("../../util/parse.js");
const DataManager = require("../../util/datamanager.js");
const Ballot = require("./ballots.js");
const Embed = require("../../util/embed.js");

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
      let command = (args.shift() || "generate").toLowerCase();
      if (typeof this[command] === "function") this[command](args); //looks for, this.register(), this.get(), this.disqualify()
      else throw "Invalid second parameter given **" + command + "**.";
    } catch (e) {
      if (e) this.Output.onError(e);
    }
  }

  async sponsor(args) {
    try {
      if (!await this.Permissions.state("election.registering", this)) {
        if (!await this.Permissions.state("election.voting", this)) throw "Registering for candidates has not yet begun on server " + this.guild.name + ".";
        else throw "Registering for candidates has closed on server " + this.guild.name + ".";
      };
    } catch (e) {
      if (e) this.Output.onError(e);
    }
  }

  async generate() {
    let embed = {
      "fields": [],
      "description": `Use \`${this.server.prefixes.generic}candidates sponsor\` to sponsor a candidate for an election, mentioning both channel and candidate.`,
      "footer": Embed.footer("A candidate requires " + this.election._sponsors + " sponsors to be included on the ballot.")
    };
    let registeringBegun = await this.Permissions.state("election.registering", this);
    for (let [name, data] of Object.entries(this.election)) {
      if (name.startsWith("_")) continue;
      let string = "";
      for (let [candidate, sponsors] of Object.entries(data.candidates || {})) { //["candidate#1024", [Array: List of Sponsors]]
        string += candidate + (registeringBegun ? " (" + sponsors.length + ")\n" : "\n");
      };
      Embed.fielder(embed.fields, (this.election._type === "channel" ? "#" : "") + name, string || "None.", true);
    };
    embed.title = `Candidates for upcoming ${this.election._type ? this.election._type + " " : ""}election${embed.fields.length > 1 ? "s" : ""} on ${this.guild.name}`
    if (embed.fields.length === 0) embed.description = "No upcoming elections found.";
    this.Output.sender(embed);
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
      if (!this.election[channel.name].candidates) this.election[channel.name].candidates = {};
      if (this.election[channel.name].candidates[user.tag]) throw `Already registered candidate **${user.tag}** for channel **${channel.name}**.`;
      let channels = Ballot.validate(this.election, user, "candidates");
      if (channels.length >= (this.election._limit || 2)) throw `Already registered candidate **${user.tag}** for channels **${channels.join(", ")}**!\nCannot run for more than ${this.election._limit} channels.`;
      this.election[channel.name].candidates[user.tag] = []; //register it as an empty array ready to add sponsors
      this.setData(this.election);
      this.Output.generic(`Registered candidate **${user.tag}** for channel **${channel.name}**.`)
    } catch (e) {
      if (e) this.Output.onError(e);
    }
  }

  async withdraw(args) {
    try {
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
      let index = this.election[channel.name].candidates.indexOf(user.tag);
      if (index === -1) throw `Couldn't find **${user.tag}** as a candidate for channel **${channel.name}**.`; //if can't find it, throw
      this.election[channel.name].candidates.splice(index); //if can, then find it
      this.setData(this.election);
      this.Output.generic(`Withdrew candidate **${user.tag}** from ballot for channel **${channel.name}**.`)
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