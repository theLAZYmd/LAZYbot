const Parse = require("../util/parse.js");
const DBuser = require("../util/dbuser.js");
const Embed = require("../util/embed.js");
const Permissions = require("../util/permissions.js");

class Finger extends Parse {

  constructor(message) {
    super(message);
  }

  run(args, argument, user) { //all from the same command, so the arguments parse starts here
    try {
      let dbuser = DBuser.getUser(user);
      if (!args[0] || !argument) return this.get(dbuser); //so if there's no arguments left, just view the profile.
      if (args[0] === "clear") {
        if (args.length > 2) throw "Incorrect number of paramters to clear finger message.";
        if (args[1]) {
          if (!Permissions.role("admin", this)) throw Permissions.output(role);
          user = this.Search.users.get(args[0]);
          dbuser = DBuser.getUser(user);
        }
	      return this.clear(dbuser);
      }
	    if (args.length === 1) {
        user = this.Search.users.get(args[0], true);
        if (user) return this.get(DBuser.getUser(user));
      }
	    this.update(dbuser, argument);
    } catch (e) {
      if (e) this.Output.onError(e);
    }
  }

  get(dbuser, title) {
    this.Output.sender(new Embed()
      .setTitle((title ? title : "Current") + " finger message for " + dbuser.username + ":")
      .setDescription("\`\`\`" + (dbuser.finger || " ") + "\`\`\`") //if no finger, send empty message so it's clear for the user
      .setFooter(dbuser.id === this.author.id ? "\"!finger clear\" to remove your finger message." : "")
    ) //just parse the information and send it
  }

  clear(dbuser) {
    try {
      delete dbuser.finger;
      DBuser.setData(dbuser);
      this.get(dbuser, "Cleared") //send the view message with first word changed to "cleared"
    } catch (e) {
      if (e) this.Output.onError(e);
    }
  }

  update(dbuser, argument) {
    try {
      if (argument.length > 500) throw `Finger must be within **500** characters. Text submitted is **${argument.length - 499}** characters too long!`;
      if (dbuser.finger === argument) throw `Finger was already that!`;
      dbuser.finger = argument;
      DBuser.setData(dbuser);
      this.get(dbuser, "Updated");
    } catch (e) {
      if (e) this.Output.onError(e);
    }
  }

}

module.exports = Finger;