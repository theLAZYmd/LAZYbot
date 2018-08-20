const commands = require("../data/commands.json");
const config = require("../config.json");
const request = require('request');
const DataManager = require("../util/datamanager.js");

class onStartup {

  constructor(client) {
    this.client = client;
  }

  get reboot() {
    return this.client.readyTimestamp;
  }

  get commands() {
    let commandlist = {};
    for(let i = 0; i < commands.length; i++) {
      for(let j = 0; j < commands[i].aliases.length; j++) {
        commandlist[commands[i].aliases[j].toLowerCase()] = true;

      }
    };
    return commandlist;
  }

  get sources() {
    let sources = {};
    for(let i = 0; i < config.sources.length; i++) {
      request.get(config.sources[i][2], (error, response, body) => {
        if(error) {
          console.log(error);
          console.log(`data.${config.sources[i][1]}: ` + sources[config.sources[i][1]]);
        } else {
          sources[config.sources[i][1]] = true;
          console.log(`Set data.${config.sources[i][1]}: ` + sources[config.sources[i][1]])
        };
      });
    };
    return sources;
  }

  get bouncerbot() {
    return this.client.users.get(config.ids.bouncer) || "";
  }

  get nadekobot() {
    return this.client.users.get(config.ids.nadeko) || "";
  }

  get harmonbot() {
    return this.client.users.get(config.ids.harmon) || "";
  }

  get owners() {
    return config.ids.owner.map(owner => this.client.users.get(owner)) || "";
  }

  get modmail () {
    let Search = new (require("../util/search.js"))({
      "client": this.client
    });
    let array = [];
    let servers = DataManager.getFile("./src/data/server.json")
    for(let id in servers) {
      this.server = servers[id];
      Search.channels.get(this.server.channels.modmail)
      .fetchMessages({
        "limit": 80
      })
      .then(messages => array.concat(Array.from(messages)))
      .catch(e => console.log(e));
      Search.channels.get(this.server.channels.welcome)
      .fetchMessages({
        "limit": 20
      })
      .then(messages => array.concat(Array.from(messages)))
      .catch(e => console.log(e));
    }
  }

}

module.exports = onStartup;