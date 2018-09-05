const Main = require("./main.js");
const Ballot = require("./ballots.js");
const DataManager = require("../../util/datamanager.js");
const Embed = require("../../util/embed.js");

class Candidates extends Main {

  constructor(message) {
    super(message);
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
    try {
      let election = this.election;
      let embed = new Embed()
        .setDescription(`Use \`${this.server.prefixes.generic}candidates sponsor\` to sponsor a candidate for an election, mentioning both channel and candidate.`)
        .setFooter("A candidate requires " + election.sponsors + " sponsors to be included on the ballot.");
      let registeringBegun = await this.Permissions.state("election.registering", this);
      for (let [name, data] of Object.entries(election.elections)) {
        let string = "";
        for (let [candidate, sponsors] of Object.entries(data.candidates || {})) { //["candidate#1024", [Array: List of Sponsors]]
          string += candidate + (registeringBegun ? " (" + sponsors.length + ")\n" : "\n");
        };
        embed.addField((election.type === "channel" ? "#" : "") + name, string || "None.", true);
      };
      embed.setTitle(`Candidates for upcoming ${election.type ? election.type + " " : ""}election${embed.fields.length > 1 ? "s" : ""} on ${this.guild.name}`)
        .setDescription(embed.fields.length === 0 ? "No upcoming elections found." : "");
      this.Output.sender(embed);
    } catch (e) {
      if (e) this.Output.onError(e);
    }
  }

  async register(args) {
    try {
      let election = this.election;
      if (!await this.Permissions.state("election.registering", this)) {
        if (!await this.Permissions.state("election.voting", this)) throw "Registering for candidates has not yet begun on server " + this.guild.name + ".";
        else throw "Registering for candidates has closed on server " + this.guild.name + ".";
      };
      let type = args[0];
      let channel = this.Search.channels.get(args[0]), user = this.author;
      if (channel) type = channel.name; 
      if (args[1]) {
        if (!this.Permissions.role("owner", this)) throw "Insufficient server permissions to use this command.";
        user = this.Search.users.get(args[1]);
        if (!user) throw "Couldn't find user **" + args[1] + "**!";
      };
      if (!election.elections[type]) throw "Couldn't find election **" + election + "**! Please use command `${generic}voters` to view list of elections.";
      if (!election.elections[type].candidates) election.elections[type].candidates = {};
      if (election.elections[type].candidates[user.tag]) throw `Already registered candidate **${user.tag}** for channel **${channel.name}**.`;
      let channels = Main.validate(election, user, "candidates");
      if (channels.length >= (election.limit || 2)) throw `Already registered candidate **${user.tag}** for channels **${channels.join(", ")}**!\nCannot run for more than ${election.limit} channels.`;
      election.elections[type].candidates[user.tag] = []; //register it as an empty array ready to add sponsors
      this.election = election;
      this.Output.generic(`Registered candidate **${user.tag}** for channel **${channel.name}**.`)
    } catch (e) {
      if (e) this.Output.onError(e);
    }
  }

  async withdraw(args) {
    try {
      let election = this.elections;
      let type = args[0];
      let channel = this.Search.channels.get(args[0]), user = this.author;
      if (channel) election = channel.name; 
      if (args[1]) {
        if (!this.Permissions.role("owner", this)) throw "Insufficient server permissions to use this command.";
        user = this.Search.users.get(args[1]);
        if (!user) throw "Couldn't find user **" + args[1] + "**!";
      };
      if (!election.elections[type]) throw "Couldn't find election **" + election + "**! Please use command `${generic}voters` to view list of elections.";
      if (!election.elections[type].candidates) election.elections[type].candidates = [];
      let index = election.elections[type].candidates.indexOf(user.tag);
      if (index === -1) throw `Couldn't find **${user.tag}** as a candidate for channel **${channel.name}**.`; //if can't find it, throw
      election.elections[type].candidates.splice(index); //if can, then find it
      this.election = election;
      this.Output.generic(`Withdrew candidate **${user.tag}** from ballot for channel **${channel.name}**.`)
    } catch (e) {
      if (e) this.Output.onError(e);
    }
  }

  async open() {
    this.server.states.election.candidates = true;
    DataManager.setServer(this.server);
    this.Output.generic("Opened candidate registration on server **" + this.guild.name + "**.");
  }

  async close() {
    this.server.states.election.candidates = false;
    DataManager.setServer(this.server);
    this.Output.generic("Closed candidate registration on server **" + this.guild.name + "**.");
  }

}

module.exports = Candidates;