const Parse = require("../util/parse.js");
const DBuser = require("../util/dbuser.js");

class MessageCount extends Parse {

  constructor(message) {
    super(message);
  }

  update (user) {
    let newcount;
    for(let i = 0; i < this.args.length; i++) {
      if(!isNaN(Number(this.args[i]))) {
        newcount = Number(this.args[i]);
      } else {
        let testuser = this.Search.get(this.args[0]);
        if(user) user = testuser;
      }
    }
    if(!newcount) return this.Output.onError(`No new MessageCount specified!`);
    let dbuser = DBuser.getfromuser(user);
    dbuser.messages = newcount;
    DBuser.setData(dbuser);
    return this.Output.generic(`Message count for **${user.tag}** is now **${dbuser.messages.toLocaleString()}** messages.`);
  }

  get (args, user) {
    if(args.length > 1) return;
    if(args.length === 1) { //!messages titsinablender
      user = this.Search.get(args[0]);
      if(!user) return this.Output.onError(`Couldn't find user!`);
    };
    let dbuser = DBuser.getfromuser(user);
    return this.Output.generic(`**${user.tag}** has sent **${dbuser.messages.toLocaleString()}** messages.`)
  }

}

module.exports = MessageCount;