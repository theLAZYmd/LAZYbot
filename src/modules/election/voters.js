const Parse = require("../../util/parse.js");
const DataManager = require("../../util/datamanager.js");
const DBuser = require("../../util/dbuser.js");
const Embed = require("../../util/embed.js");
const config = require("../../config.json");

class Voters extends Parse {

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
      if (/register|disqualify|clear/.test(command.toLowerCase()) && !this.Permissions.role("owner", this)) throw this.Permissions.output("role");
      if (typeof this[command] === "function") this[command](); //looks for, this.register(), this.get(), this.disqualify()
      else throw "Invalid second parameter given **" + command + "**.";
    } catch (e) {
      if (e) this.Output.onError(e);
    }
  }

  async generate(msg) {
    let embed = {
      "fields": [],
      "footer": Embed.footer("Use '!voters get' to view individual voters for an election. '!h !voters' for more info.")
    };
    let votingBegun = await this.Permissions.state("election.voting", this);
    for (let [name, data] of Object.entries(this.election)) {
      if (name.startsWith("_")) continue;
      let voters = Object.keys(data.voters);
      let voted = Object.values(data.voters).filter(array => array[0]);
      Embed.fielder(embed.fields, (this.election._type === "channel" ? "#" : "") + name, voters.length + " voters " + (votingBegun ? "(" + voted.length + " voted)" : ""), true);
    };
    embed.title = `Voters for upcoming ${this.election._type ? this.election._type + " " : ""}election${embed.fields.length > 1 ? "s" : ""} on ${this.guild.name}`
    if (embed.fields.length === 0) embed.description = "No upcoming elections found.";
    msg ? this.Output.editor(embed, msg) : this.Output.sender(embed);
  }

  async register() {
    let msg = await this.Output.generic("Finding eligible voters... ");
    try {
      let data = Object.assign({"_url": msg.url}, this.election);
      data = await this["by" + data._type.toProperCase()](data)
      if (!data) throw "Time out.";
      data = await this.filter(data, msg);
      if (!data) throw "Time out.";
      await this.Output.editor({
        "description": "Compiling voters to database... "
      }, msg);
      this.election = await this.compile(data);
      this.setData(this.election);
      this.generate(msg);
    } catch (e) {
      if (e) this.Output.onError(e);
      if (msg) msg.delete();
    }
  }

  async byServer(data) {
    try {
      let collection;
      if (data._criteria.includes("server")) collection = this.guild.members;
      else if (data._criteria.includes("role")) {
        let name = await this.Output.response({
          "description": "Please write the name of the role for the list of eligible voters."
        })
        let role = this.Search.roles.get(name);
        if (!role) throw "Couldn't find role " + name + ".";
        collection = role.members;
      } else
      if (data._criteria.includes("channel")) {
        let channel = this.Search.channels.byID(data._criteria);
        if (!channel) throw "Invalid criteria given!";
        collection = channel.members;
      }
      else throw "Invalid criteria given!";
      data[this.guild.name] = Array.from(collection.keys());
      return data;
    } catch (e) {
      if (e) this.Output.onError(e);
    }
  }

  async byChannel(data) {
    try {
      for (let channelName in data) {
        if (channelName.startsWith("_")) continue;
        let channel = this.Search.channels.get(channelName);
        try {
          let collection;
          if (data._criteria.includes("server")) collection = this.guild.members;
          else
          if (data._criteria.includes("role")) {
            let roleName;
            if (data._criteria === "role-identical") roleName = channel.name;
            else if (data._criteria === "role-choose") roleName = await this.Output.response({
              "description": "Please write the name of the role for channel " + channel + "."
            });
            else throw "Invalid criteria given!";
            let role = this.Search.roles.get(roleName);
            if (!role) throw "Couldn't find role for channel " + channel.name + ".";
            collection = role.members;
          } else
          if (data._criteria.includes("channel")) {
            let channel = this.Search.channels.byID(data._criteria);
            if (!channel) throw "Invalid criteria given!";
            collection = channel.members;
          } else throw "Invalid criteria given!";
          data[channel.name.toLowerCase()] = collection;
        } catch (e) {
          if (e) this.Output.onError(e);
          continue;
        }
      };
      return data;
    } catch (e) {
      if (e) this.Output.onError(e);
      throw "";
    }
  }

  async filter(data, msg) {
    try {
      for (let type in data) {
        if (type.startsWith("_") || !data.hasOwnProperty(type)) continue;
        await this.Output.editor({
          "description": "Finding eligible voters for... **" + (data._type === "channel" ? this.Search.channels.get(type) : type) + "**"
        }, msg);
        data[type] = Array.from(data[type].filter((member) => {
          if (!data._dupes && member.roles.some(role => role.name === this.server.roles.bank)) return false;
          let dbuser = DBuser.getUser(member.user);
          if (!data._inactives && (Date.now() - (dbuser.messages.lastSeen || 0) > 1210000000)) return false;
          if (dbuser.messages.count < data._messages) return false;
          console.log(`[Register, ${type}, ${member.user.tag}]`);
          return true;
        }).keys());
      };
      return data;
    } catch (e) {
      if (e) this.Output.onError(e);
      throw "";
    }
  }

  async compile(data) {
    try {
      let election = {};
      for (let type in data) {
        if (!data.hasOwnProperty(type)) continue;
        election[type] = (type.startsWith("_")) ? data[type] : { //if it's a non-native property, just add it
          "voters": data[type].reduce((acc, cur) => { //converts the array to an object with keys as items and values []
            acc[cur] = [];
            return acc
          }, {}),
          "candidates": []
        }
      };
      return election;
    } catch (e) {
      if (e) this.Output.onError(e);
      throw "";
    }
  }

  async clear() {
    try {
      if (this.args[1]) {
        let guild = this.Search.guilds.get(this.args[1]) || "";
        if (!guild) throw "Couldn't find guild";
        if (this.guild.id !== guild.id && !config.ids.owner.includes(this.author.id)) throw "Insufficient server permissions to use this command.";
        this.guild = guild;
      };
      let election = {
        "_id": this.guild.id
      };
      this.setData(election);
      this.server.states.election.registering = false;
      DataManager.setServer(this.server);
      this.Output.generic("Cleared voting data for server **" + (this.guild.name) + "**.");
    } catch (e) {
      console.log(e);
      if (e) this.Output.onError("**Couldn't clear voting data on server " + (this.guild.name) + "**: " + e);
    }
  }

  async get() {
    try {
      if (!(await this.Permissions.state("election.registering", this) || await this.Permissions.state("election.voting", this))) throw "Registering for voters has not yet begun on server " + this.guild.name + ".";
      if (this.channel.name !== this.server.channels.bot) throw "Wrong channel to use this command. Requires: #spam channel.";
      let instance;
      if (this.election._type === "channel") {
        let argument = await this.Output.response({
          "description": "Please state the channel for which you would like to view the voting list.",
          "oneword": true
        });
        instance = await this.findChannel(argument);
      } else instance = this.guild.name;
      let array = Object.keys(this.election[instance].voters);
      this.Output.sender({
        "title": `Eligble voters for election ${this.election._type === "channel" ? "#" : ""}${instance.toProperCase()}`,
        "description": array.map(id => this.Search.users.get(id).tag || "\u200B").join("\n"),
        "footer": Embed.footer(`Found ${array.length} eligible voters.`)
      });
    } catch (e) {
      if (e) this.Output.onError(e);
    }
  }

  async findChannel(argument) {
    try {
      if (argument.startsWith("_")) throw "";
      if (this.election[argument.toLowerCase()]) return argument.toLowerCase();
      let channel = this.Search.channels.get(argument);
      if (!channel) throw "";
      if (this.election[channel.name.toLowerCase()]) return channel.name.toLowerCase();
      throw "";
    } catch (e) {
      throw "Couldn't find channel **" + argument + "**.";
    }
  }

  async disqualify() {
    let embed = {"description": ""}, count = 0;
    let args = (await this.Output.response({
      "description": "Please list the users to disqualify, separated by spaces."
    })).split(/\s+/g);
    for (let arg of args) {
      try {
        let user;
        if (arg) {
          let _user = this.Search.users.get(arg);
          if (_user) user = _user;
          else throw "Couldn't find user **" + arg + ".";
        } else user = this.author;
        for (let type in this.election) {
          if (type.startsWith("_") || !this.election.hasOwnProperty(type)) continue;
          if (this.election[type].voters[user.id]) delete this.election[type].voters[user.id];
        };
        embed.description += user + "\n";
        count++;
      } catch (e) {
        if (e) this.Output.onError(e);
        continue;
      }
    };
    this.setData(this.election);
    embed.title = `Successfully removed the following user${count > 1 ? "s" : ""} from the ballot:`
    if (!embed.description) embed.description = "None.";
    this.Output.sender(embed);
  }

  async eligible(argument) {
    try {
      let user, count = 0, embed = {"description": ""};
      if (argument) {
        let _user = this.Search.users.get(argument);
        if (_user) user = _user;
        else throw "Couldn't find user **" + argument + ".";
      } else user = this.author;
      for (let type in this.election) {
        if (type.startsWith("_") || !this.election.hasOwnProperty(type)) continue;
        if (this.election[type].voters[user.id]) embed.description += this.election._type === "channel" ? this.Search.channels.get(type) + "\n" : type + "\n";
      };
      embed.title = user.tag + " is eligible to vote in election" + (count > 1 ? "s" : "") + ":";
      if (!embed.description) embed.description = "None.";
      this.Output.sender(embed);
    } catch (e) {
      if (e) this.Output.onError(e);
    }
  }

}

module.exports = Voters;