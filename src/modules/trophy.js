const Parse = require ("../util/parse.js");
const DBuser = require("../util/dbuser.js");
const Embed = require("../util/embed.js");

class Trophy extends Parse {
  constructor(message) {
    super(message);
  }

  run (args) {
    try {
      let command = args.shift();
      if (!this[command]) return this.Output.onError("Invalid function on trophy command.");
      let username = args.shift();
      if (!username) return this.Output.onError("No user found!");
      let user = this.Search.users.get(username);
      let dbuser = DBuser.getUser(user);
      if (!dbuser.trophy) dbuser.trophy = [];
      this[command](dbuser);
    } catch(e) {
      if (e) return this.Output.onError(e);
    }
  }

  async add (dbuser) {
    let trophy = await this.Output.response({
      "description": "Please specify name of trophy."
    });
    if (!trophy) throw "";
    if (dbuser.trophy.includes(trophy)) return this.Output.onError("**" + user.tag + "** already had trophy **" + trophy + "**.");
    dbuser.trophy.push(trophy);
    this.Output.generic(`Awarded :trophy: **${trophy}** to **${dbuser.username}**!\n**${dbuser.username}** now has **${dbuser.trophy.length}** trophies.`);
    DBuser.setData(dbuser);
  }

  async update (dbuser) {
    try {
      if (dbuser.trophy.length === 0) throw dbuser.username + " has no trophies yet.";
      let index = await this.Output.choose({
        "title": dbuser.username + " has the following trophies. Please specify which to update.",
        "options": dbuser.trophy
      });
      if (index === undefined) throw "";
      let oldTrophy = dbuser.trophy[index];
      let newTrophy = await this.Output.response({
        "description": "Please specify name of trophy."
      });
      if (oldTrophy === undefined || !newTrophy === undefined) throw "";
      dbuser.trophy.splice(index, 1, newTrophy);
      this.Output.generic(`Updated :trophy: **${oldTrophy}** to :trophy: **${newTrophy}** for **${dbuser.username}**.\n**${dbuser.username}** now has **${dbuser.trophy.length}** trophies.`);
      DBuser.setData(dbuser);
    } catch (e) {
      if (e) this.Output.onError(e)
    }
  }

  async remove (dbuser) {
    try {
      if (dbuser.trophy.length === 0) throw dbuser.username + " has no trophies yet.";
      let index = dbuser.trophy.length === 1 ? 0 : await this.Output.choose({
        "title": dbuser.username + " has the following trophies. Please specify which to remove.",
        "options": dbuser.trophy
      });
      if (!index === undefined) throw "";
      let trophy = dbuser.trophy[index];  
      if (index === dbuser.trophy.length - 1) dbuser.trophy.length--;
      this.Output.generic(`Removed :trophy: **${trophy}** from **${dbuser.username}**.\n**${dbuser.username}** now has **${dbuser.trophy.length}** trophies.`);
      DBuser.setData(dbuser);
    } catch (e) {
      if (e) this.Output.onError(e);
    }
  }

}

module.exports = Trophy;