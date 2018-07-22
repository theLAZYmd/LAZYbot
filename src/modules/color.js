const Parse = require("../util/parse.js");

class Color extends Parse {

  constructor(message) {
    super(message)
  }

  run (member) {
    let args = this.args;
    let argument = this.argument;
    let modboolean = false;
    if(args[0] && this.Search.get(args[0], true)) { //if the first word summons a user then we do something different
      member = this.Search.getMember(args[0]); //the user we use becomes the args[0] (instead of message.author);
      args = args.slice(1); 
      argument = args.join(" ").replace(/[^a-zA-Z0-9\.!\?',;:"£\$%~\+=()\s\u200B-\u200D\uFEFF-]+/g, "");
      modboolean = true; //need permissions to change somebody else's colour.
    };
    if(!args[0] || !argument) return this.get(member); //if there's no arguments left, view
    if(modboolean && !this.Check.role(this.member, this.server.roles.admin)) return; //to set need permissions.
    return this.set(member, argument);
  }

  get (member, action) {
    this.Output.sender({
      "color": member.displayColor,
      "description": (action ? action : "Current") + ` colour for **${member.user.tag}**: **${this.member.displayColor}**.`
    })
  }
  
  set (member, argument) {
    let color = argument.replace(/[^a-zA-Z0-9,]/g, "").toUpperCase();
    let hex = color.match(/([0-9]{1,3})\s?,([0-9]{1,3})\s?,([0-9]{1,3})/);
    if(hex) {
      color = hex.slice(1);
      for(let i = 0; i < color.length; i++) {
        color[i] = Number(color[i]);
      }
    };
    if(this.Check.role(member, "choosecolor")) {
      let role = this.Search.getRole(member.user.username + "CustomColor");
      if(role) {
        role.setColor(color)
        .then(role => this.get(member, "Set"))
        .catch(e => console.log(e));
      }
    }
  }

}

module.exports = Color;