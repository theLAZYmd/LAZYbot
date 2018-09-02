const Parse = require("../util/parse.js");

class DM extends Parse {

  constructor(message) {
    super(message);
  }

 static async setGuild(argsInfo, title) { //handles the input for dms
    try {
      let guilds = [];
      for (let guild of Array.from(argsInfo.client.guilds.values()))
        if (guild.members.has(argsInfo.author.id))
          guilds.push(guild); //and fill it with all guilds the bot has access to that the user is a member of.
      let index = guilds.length === 1 ? 0 : await argsInfo.Output.choose({title,
        "type": "server",
        "options": guilds.map(guild => guild.name)
      });
      return guilds[index]; //and if valid input, send of modmail for that guild
    } catch (e) {
      if (e) argsInfo.Output.onError("incoming" + e);
    }
  }

}

module.exports = DM;