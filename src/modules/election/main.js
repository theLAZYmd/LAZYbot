const Parse = require("../../util/parse.js");
const DataManager = require("../../util/datamanager.js");
const Embed = require("../../util/embed.js");
const config = require("../../config.json");

class Config extends Parse { //not a real constructor - because of the awaits, I need to call async methods
  constructor(message) {
    super(message);
  }

  get date() {
    if (this._date) return this._date;
    return this._date = (() => {
      Date.getMonth(Date.now())
    })();
  }

  get type() {
    if (this._type) return this._type;
    return this._type = (async () => {
      return await this.Output.response({
        "description": "Please define the scope of the election (`server`|`channel`)",
        "filter": msg => /server|channel/.test(msg.content)
      })
    })()
  }

  get elections() {
    if (this._elections) return this._elections;
    return this._elections = (async () => {
      if (await this.type === "server") return this._elections = ["server"];
      if (await this.type === "channel") {
        let error = true;
        while (error) {
          if (typeof error === "string") (await this.Output.onError(error)).delete(30000);
          try {
            let description = "Please list the channels or categories containing the channels to hold elections, separated by spaces.";
            let _channels = (await this.Output.response({description}))
              .split(/\s /g)
            let channels = _channels.map(channel => this.Search.channels.get(channel));
            for (let i = 0; i < channels.length; i++) { //error handling
              let channel = channels[i];
              if (!channel) throw "Couldn't find channel **" + _channels[i] + "**.";
              if (channel.children) { //deal with channel categories
                let collection = Array.from(channel.children.values()); //get the array of category
                //console.log(46, collection);
                channels.splice(i, 1, ...collection); //exchange the channel in the array with the arrays from the category
                //console.log(49, channels);
              };
            };
            //console.log(channels);
            channels = channels.map(channel => channel.name);
            if (channels.length === 0) throw "No applicable channels given.";
            if (channels.length > 25) throw "Maximum number of elections that can be held at once is 25.";
            error = false;
            return this._elections = channels;
          } catch (e) {
            if (typeof e === "string") error = e;
            else this.Output.onError(e);
          }
        }
      }
    })()
  }

  get criteria() {
    if (this._criteria) return this._criteria;
    return this._criteria = (async () => {
      let type = "method of obtaining list of eligible voters.", criteria = ["Everyone in the server", "role", "From all who can see channel " + this.channel]
      let options = [
        "All server members can vote in this election.",
        this.type === "channel" ? "There is a role corresponding to the list of eligible voters." : "There are roles corresponding to each channel.",
        "Everyone who can see the current channel can vote in it."
      ];
      let index = await this.Output.choose({options, type});
      if (this.type === "server" || index !== 1) return this._criteria = criteria[index];
      let roleindex = await this.Output.choose({
        "options": [
          "The role names are identical to the channel names.",
          "Let me choose them each time."
        ],
        "description": "How do these roles correspond to the channels?"
      })
      return ["role-identical", "role-choose"][roleindex];
    })()
  }

  get inactives() {
    if (this._inactives) return this._inactives;
    return this._inactives = (async () => {
      await this.Output.confirm({
        "description": "Allow inactive server members to vote?"
      }, true);
    })()
  }

  get dupes() {
    if (this._dupes) return this._dupes;
    if (!this.server.roles.dupe) return this._dupes = true;
    return this._dupes = (async () => {
      await this.Output.confirm({
        "description": "Allow dupe accounts to vote?"
      }, true);
    })()
  }

  get messages() {
    if (this._messages) return this._messages;
    return this._messages = (async () => {
      await this.Output.response({
        "description": "Minimum threshold of messages sent in server to vote (return `0` for any):",
        "number": true
      })
    })()
  }

  get sponsors() {
    if (this._sponsors) return this._sponsors;
    return this._sponsors = (async () => {
      await this.Output.response({
        "description": "Minimum threshold of sponsors for a candidate to be listed on the ballot\n(return `0` for any; max `20`):",
        "number": true,
        "filter": m => Number(m.content) <= 20
      })
    })()
  }

  get limit() {
    if (this._limit) return this._limit;
    return this._limit = (async () => {
      let elections = await this.elections;
      if (elections.length === 1) return 1;
      let limit = await this.Output.response({
        "description": "Maximum number of elections permitted to run for\n(return '0' for any; max `" + elections.length + "`):",
        "number": true,
        "filter": m => Number(m.content) <= elections.length && 0 <= Number(m.content)
      });
      if (limit === 0) limit = elections.length;
      return limit;
    })()
  }

}

class Election extends Parse {

  constructor(message) {
    super(message);
    this.election = this.guild ? DataManager.getServer(this.guild.id, "./src/data/votes.json") : "";
    this.properties = [   //default settings
      ["date", Date.getMonth(Date.now()), "Date"],
      ["type", "server", "Type of election"],
      ["criteria", "Everyone in the server", "Electorate list"],
      ["inactives", true, "Inactive members voting"],
      ["dupes", true, "Dupe members voting"],
      ["messages", 100, "Required messages"],
      ["sponsors", 3, "Required sponsors"],
      ["limit", 1, "Running limit"],
    ]
  }

  async setData(election) {
    DataManager.setServer(election, "./src/data/votes.json");
  }

  async run(args) {
    try {
      let command = args.shift();
      if (command && !this.Permissions.role("owner", this)) throw this.Permissions.output("role");
      command = (command || "generate").toLowerCase();
      if (typeof this[command] === "function") this[command](); //looks for, this.register(), this.get(), this.disqualify()
      else throw "Invalid second parameter given **" + command + "**.";
    } catch (e) {
      if (e) this.Output.onError(e);
    }
  }

  async generate(init) {
    try {
      let emoji = this.Search.emojis.get(this.server.emoji);
      let embed = {
        "title": (emoji ? emoji + " " : "") + "Information for upcoming " + this.election._type + " election" + (this.election._type !== "server" ? "s" : "") +" on " + this.guild.name,
        "fields": []
      };
      for (let [property, def, name] of this.properties.slice(0)) {
        if (property !== "type" && this.election["_" + property]) embed.fields.push({name,
          "value": this.election["_" + property].toString(),
          "inline": true
        });
      };
      if (init) { //if this method was called from this.initiate() or this.config()
        embed.footer = Embed.footer("Verify and set these values?");
        return !(await this.Output.confirm({embed,
          "editor": typeof init === "object" ? init : "",
          "autodelete": false
        }, true))
      } else {
        if (embed.fields.length === 0) embed.description = "No upcoming election data found!";
        this.Output.sender(embed);
        return false;
      }
    } catch (e) {
      if (e) this.Output.onError(e);
    }
  }


  async initiate() {
    try {
      this.server.states.election.registering = true;
      DataManager.setServer(this.server);
      for (let [property, value] of this.properties.slice(0))
        this.election["_" + property] = value;
      this.setData(this.election);
      let msg = await this.generate(true);
      if (msg) this.config(msg);
    } catch (e) {
      if (e) this.Output.onError(e);
    }
  }

  async config(msg = true) {
    try {
      let args = this.args;
      do {
        let election = Object.assign({}, this.election);
        let econfig = new Config(this.message);
        for (let [property] of this.properties.slice(0)) {
          if (args.length > 0 && !args.inArray(property)) continue;
          election["_" + property] = await econfig[property];
        };
        args = [];
        let elections = await econfig.elections;
        for (let name of elections) {
          if (typeof name === "string") election[name] = {
            "voters": {},
            "candidates": {},
          }
        };
        console.log(election);
        this.election = Object.assign(this.election, election);
        await this.setData(this.election);
        msg = await this.generate(msg);
      } while (msg);
    } catch (e) {
      if (e) this.Output.onError(e);
    }
  }

}

module.exports = Election;