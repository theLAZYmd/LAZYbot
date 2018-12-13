const Parse = require("../../util/parse.js");
const Embed = require("../../util/embed.js");
const config = require("../config.json");
const DataManager = require("../../util/datamanager.js");
const Logger = require("../../util/logger.js");

class Backup extends Parse {

  constructor(message) {
    super(message);
  }
  async force(args) {
    try {
      let degree;
      if (!args[0]) degree = "1";
      if (args[0]) {
        if (/^[1-3]/.test(args[0])) degree = args[0];
        else throw "Invalid backup degree!";
      }
	    await Backup[this.command](degree);
      this.Output.generic(`Database ${this.command} successful to **dbbackup${degree}** at ${Date.getISOtime(Date.now())}.`)
    } catch (e) {
      if (!e) return;
      if (this.command) this.Output.onError(e);
      else Logger.error(e);
    }
  }
  
  async status () {
    let embed = {
      "title": "Backup Databases Last Updated:",
      "fields": []
    };
    Embed.fielder(embed.fields, "dbbackup1.json", config.backupdb[0], true);
    Embed.fielder(embed.fields, "dbbackup2.json", config.backupdb[1], true);
    Embed.fielder(embed.fields, "dbbackup3.json", config.backupdb[2], true);
    this.Output.sender(embed);
  }

  static async backup(degree) {
    try {
      let tally = DataManager.getData();
      DataManager.setFile(tally, `./src/data/dbbackup${degree}.json`);
      config.backupdb[parseInt(degree) - 1] = Date.getISOtime(Date.now());
      DataManager.setFile(config, "./src/config.json");
      if (!this.command) Backup.log("backup", degree);
    } catch (e) {
      if (e) throw e;
    }
  }
  
  static async restore(degree) {
    try {
      let tally = DataManager.getFile(`./src/data/dbbackup${degree}.json`);
      DataManager.setData(tally);
      if (!this.command) Backup.log("restore", degree);
    } catch (e) {
      if (e) throw e;
    }
  }

  static async log(command, degree) {
    Logger.command({
      "author": {
        "tag": "auto"
      },
      "args": [`./src/data/dbbackup${degree}.json`],
      "command": command
    }, {
      "file": "Backup",
      "prefix": ""
    })
  }


}

module.exports = Backup;