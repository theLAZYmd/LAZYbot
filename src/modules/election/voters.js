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
      if (/register|disqualify|clear/.test(command.toLowerCase()) && (this.guild.ownerID !== this.author.id && !config.ids.owner.includes(this.author.id))) throw "Insufficient server permissions to use this command.";
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
    let msg;
    try {
      let type = await this.Output.response({
        "description": "Please define the scope of the election (`server`|`channel`)",
        "filter": msg => typeof this["by" + msg.content.toProperCase()] === "function"
      });
      let data = await this["by" + type.toProperCase()](); //data: {type: 'collection of members'}
      data._type = type;
      msg = await this.Output.generic("Finding eligible voters... ");
      data = await this.filter(data, msg);
      await this.Output.editor({
        "description": "Compiling voters to database... "
      }, msg);
      this.election = await this.compile(data);
      this.election._id = this.guild.id;
      this.election._type = type;
      this.setData(this.election);
      this.server.states.election.registering = true;
      DataManager.setServer(this.server);
      this.generate(msg);
      this.message.delete();
    } catch (e) {
      if (e) this.Output.onError(e);
      if (msg) msg.delete();
    }
  }

  async byServer() {
    try {
      let data = {}; //data is what will replace this.election. It's {channelName: {"voters": {"memberID": []}}}
      let index = await this.Output.choose({
        "options": [
          "All server members can vote in this election.",
          "There is a role corresponding to the list of eligible voters.",
          "Everyone who can see the current channel can vote in it."
        ],
        "type": "method of obtaining list of eligible voters."
      });
      let collection;
      if (index === 0) collection = this.guild.members;
      else if (index === 1) {
        let name = await this.Output.response({
          "description": "Please write the name of the role for the list of eligible voters."
        })
        let role = this.Search.roles.get(name);
        if (!role) throw "Couldn't find role " + name + ".";
        collection = role.members;
      } else if (index === 2) collection = this.channel.members;
      data[this.guild.name] = Array.from(collection.keys());
      return data;
    } catch (e) {
      if (e) this.Output.onError(e);
    }
  }

  async byChannel() {
    try {
      let data = {}; //data: simple object with properties for each channel, and array of voters as value
      let channels = (await this.Output.response({
        "description": "Please list the channels or categories containing the channels to hold elections, separated by spaces."
      })).split(/\s+/g);
      for (let i = 0; i < channels.length; i++) { //error handling
        let name = channels[i];
        channels[i] = this.Search.channels.get(name);
        if (channels[i] && channels[i].children) {
          let collection = Array.from(channels[i].children.values());
          for (let j = 0; j < collection.length; j++)
            channels[i + j] = collection[j];
          i += collection.length - 1;
          let test = channels.map(channel => channel.name || "");
        };
        if (channels[i]) continue;
        channels.splice(i, 1);
        i--;
        this.Output.onError("Couldn't find channel **" + name + "**.");
      };
      if (channels.length === 0) throw "No applicable channels given.";
      let index = await this.Output.choose({
        "options": [
          "All server members can vote in every election.",
          "There are roles corresponding to each channel.",
          "Everyone who can see the channel can vote in it."
        ],
        "type": "method of obtaining list of eligible voters."
      }), one;
      if (index === 1) one = await this.Output.choose({
        "options": [
          "The role names are identical to the channel names.",
          "Let me choose them each time."
        ],
        "description": "How do these roles correspond to the channels?"
      });
      for (let channel of channels) {
        try {
          let collection;
          if (index === 0) collection = this.guild.members;
          else if (index === 1) {
            let roleName = channel.name;
            if (one) roleName = await this.Output.response({
              "description": "Please write the name of the role for channel " + channel + "."
            });
            let role = this.Search.roles.get(roleName);
            if (!role) throw "Couldn't find role for channel " + channel.name + ".";
            collection = role.members;
          } else if (index === 2) collection = channel.members;
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
      let active = !(await this.Output.confirm({
        "description": "Allow inactive server members to vote?"
      }, true));
      let banks = !(await this.Output.confirm({
        "description": "Allow dupe accounts to vote?"
      }, true));
      let count = await this.Output.response({
        "description": "Minimum threshold of messages sent in server to vote (return `0` for any):",
        "number": true
      });
      await this.Output.editor({
        "description": "Finding eligible voters for... "
      }, msg);
      for (let type in data) {
        if (type.startsWith("_")) continue;
        await this.Output.editor({
          "description": "Finding eligible voters for... **" + (data._type === "channel" ? this.Search.channels.get(type) : type) + "**"
        }, msg);
        data[type] = Array.from(data[type].filter((member) => {
          if (banks && member.roles.some(role => role.name === this.server.roles.bank)) return false;
          let dbuser = DBuser.getUser(member.user);
          if (active && (Date.now() - (dbuser.messages.lastSeen || 0) > 1210000000)) return false;
          if (dbuser.messages.count < count) return false;
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
        if (type.startsWith("_")) continue;
        election[type] = {
          "voters": data[type].reduce((acc, cur) => { //converts the array to an object with keys as items and values []
            acc[cur] = [];
            return acc
          }, {})
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
          if (type.startsWith("_")) continue;
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
        if (type.startsWith("_")) continue;
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

String.prototype.toProperCase = function () {
  let words = this.split(/ +/g);
  let newArray = [];
  for (let i = 0; i < words.length; i++) {
    newArray[i] = words[i][0].toUpperCase() + words[i].slice(1, words[i].length).toLowerCase();
  };
  let newString = newArray.join(" ");
  return newString;
}

Array.prototype.toProperCase = function () {
  for (let i = 0; i < this.length; i++)
    this[i] = this[i].toProperCase();
  return this;
}