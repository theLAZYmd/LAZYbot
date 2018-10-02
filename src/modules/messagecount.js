const Parse = require("../util/parse.js");
const DBuser = require("../util/dbuser.js");

class MessageCount extends Parse {

  constructor(message) {
    super(message);
  }

  log (author, dbuser) { //section for message logging
    if(!isNaN(dbuser.messages.count)) dbuser.messages.count++;
    else {
      dbuser.messages.count = 0;
      this.Output.onError("Your message count data has been lost. Please alert a bot owner immediately.")
    }
	  if (Object.values(this.server.prefixes).includes(this.prefix)) return;
    dbuser.messages.last = this.message.content.length > 500 ? this.message.content.slice(0, 500).replace("`", "") + "..." : this.message.content.replace(/\`/g,"");
    dbuser.messages.lastSeen = this.message.createdTimestamp;
    if(dbuser.username !== author.tag) dbuser.username = author.tag; 
    DBuser.setData(dbuser);
  }

  update (user) {
    let newcount;
    for(let i = 0; i < this.args.length; i++) {
      if(!isNaN(Number(this.args[i]))) {
        newcount = Number(this.args[i]);
      } else {
        let testuser = this.Search.users.get(this.args[0]);
        if(user) user = testuser;
      }
    }
    if(!newcount) return this.Output.onError(`No new MessageCount specified!`);
    let dbuser = DBuser.getUser(user);
    dbuser.messages.count = newcount;
    DBuser.setData(dbuser);
    return this.Output.generic(`Message count for **${user.tag}** is now **${dbuser.messages.count.toLocaleString()}** messages.`);
  }

  get (args, user) {
    if(args.length === 1) { //!messages titsinablender
      user = this.Search.users.get(args[0]);
      if(!user) return this.Output.onError(`Couldn't find user!`);
    }
	  let dbuser = DBuser.getUser(user);
    return this.Output.generic(`**${user.tag}** has sent **${dbuser.messages.count.toLocaleString()}** messages.`)
  }

  last (argument) {
    try {
      let user = this.author;
      if (argument) user = this.Search.users.get(argument);
      if (!user) throw "Couldn't find user **" + argument + "**!";
      let dbuser = DBuser.getUser(user);
      if (!dbuser.messages.last) throw "Last message was not logged for user **" + user.tag + "**.";
      this.Output.sender({
        "title": "Last Message of " + user.tag + "\n",
        "description": "```" + dbuser.messages.last + "```"
      });
    } catch(e) {
      if (e) this.Output.onError(e)
    }
  }

}

module.exports = MessageCount;