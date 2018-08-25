const commands = require("../data/commands.json");
const config = require("../config.json");
const request = require('request');
const DataManager = require("../util/datamanager.js");
const TrackerConstructor = require("../modules/tracker.js");

class onStartup {

  constructor(client) {
    this.client = client;
    this.Tracker = new TrackerConstructor()
  }

  get reboot() {
    return this.client.readyTimestamp;
  }

  get commands() {
    let commandlist = {};
    for(let cmdInfo of commands) {
      for(let alias of cmdInfo.aliases) {
        commandlist[alias.toLowerCase()] = true;
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

  get autoupdates () {
    this.Tracker.initUpdateCycle();
    return true;
  }

}

module.exports = onStartup;