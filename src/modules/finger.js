const Parse = require("../util/parse.js");
const DBuser = require("../util/dbuser.js");
const Embed = require("../util/embed.js");

class Finger extends Parse {

  constructor(message) {
    super(message);
  }

  run (args, argument, user) { //all from the same command, so the arguments parse starts here
    let modboolean = false;
    if(args[0] && this.Search.users.get(args[0])) { //if the first word summons a user then we do something different
      user = this.Search.users.get(args[0]); //the user we use becomes the args[0] (instead of message.author);
      args = args.slice(1); //and of course that word summonging the user is removed from the arguments we take into account
      argument = args.join(" ").replace(/[^a-zA-Z0-9\.!\?',;:"£\$%~\+=()\s\u200B-\u200D\uFEFF-]+/g, "");
      modboolean = true; //user summoning is a mod action. It's find for just viewing profiles but for changing we need permissions.
    };
    let dbuser = DBuser.getUser(user);
    if(!args[0] || !argument) return this.get(dbuser); //so if there's no arguments left, just view the profile.
    if(modboolean && !this.Check.role(this.member, this.server.roles.admin)) return; //to change or clear, need mod permissions.
    if(args[0] === "clear") return this.clear(dbuser);
    return this.update(dbuser, argument);
  }

  get (dbuser, title) {
    this.Output.sender({
      "title": (title ? title : "Current") + " finger message for " + dbuser.username + ":",
      "description": "\`\`\`" + (dbuser.finger || " ") + "\`\`\`", //if no finger, send empty message so it's clear for the user
      "footer": Embed.footer("\"!finger clear\" to remove your finger message.")
    }) //just parse the information and send it
  }

  clear (dbuser) {
    delete dbuser.finger; //delete the entry, easy as that
    DBuser.setData(dbuser);
    this.get(dbuser, "Cleared") //send the view message with first word changed to "cleared"
  }

  update (dbuser, argument) {
    if(argument.length > 500) return this.Output.onError(`Finger must be within **500** characters. Text submitted is **${argument.length - 499}** characters too long!`);
    if(dbuser.finger === argument) return this.Output.onError(`Finger was already that!`);
    dbuser.finger = argument;
    DBuser.setData(dbuser);    
    this.get(dbuser, "Updated"); //all self explanatory
  }

}

module.exports = Finger;