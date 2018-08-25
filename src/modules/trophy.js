const Parse = require ("../util/parse.js");
const Embed = require("../util/embed.js");

class Trophy extends Parse {
  constructor(message) {
    super(message);
  }

  run (args) {
    let command = args.shift();
    if (!this[command]) return this.Output.onError("Invalid function on trophy command.");
    this.user = args.shift();
    if (!this.user) return this.Output.onError("No user found!");
    if(!dbuser.trophy) dbuser.trophy = [];
    this[command]()
    .catch((e) => {
      if (e) return this.Output.onError(e);
    })
  }

  async add () {
    let trophy = (await this.Output.response({
      "description": "Please specify name of trophy."
    })).content;
    let dbuser = this.dbuser;
    if (dbuser.trophy.includes(trophy)) return this.Output.onError("**" + user.tag + "** already had trophy **" + trophy + "**.");
    dbuser.trophy.push(trophy);
    this.Output.generic(`Awarded :trophy: **${trophy}** to **${dbuser.username}**!\n**${dbuser.username}** now has **${dbuser.trophy.length}** trophies.`);
    DBuser.setData(dbuser);
  }

  async update () {
    let dbuser = this.dbuser
    let index = await this.Output.choose({
      "title": this.user + " has the following trophies. Please specify which to update.",
      "options": []
    });
    let trophy = dbuser.trophy[index];
    dbuser.trophy.splice(index, 1);
    this.Output.generic(`Removed :trophy: **${trophy}** from **${dbuser.username}**.\n**${dbuser.username}** now has **${dbuser.trophy.length}** trophies.`)
    DBuser.setData(dbuser);
  }

  async remove () {
    let dbuser = this.dbuser
    let index = await this.Output.choose({
      "title": this.user + " has the following trophies. Please specify which to remove.",
      "options": []
    });
    let trophy = dbuser.trophy[index];
    dbuser.trophy.splice(index, 1);
    this.Output.generic(`Removed :trophy: **${trophy}** from **${dbuser.username}**.\n**${dbuser.username}** now has **${dbuser.trophy.length}** trophies.`)
    DBuser.setData(dbuser);
  }

}