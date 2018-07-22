const Parse = require("../util/parse.js");
const Embed = require("../util/embed.js");

class Ban extends Parse {

  constructor(message) {
    super(message)
  }

  fake (args) { //fakebanning, some features are just for fun yes
    this.generate(args)
    .then(member => {
      member.addRole(this.Search.getRole(server.roles.muted))
      .catch(e => console.log(e));
    })
    .catch(e => this.Output.onError(e));
  }

  real (args) {
    this.generate(args)
    .then(member => {
      member.ban({
        "days": !isNaN(args[1]) ? Number(args[1]) : 0, //if second argument is a number, delete that many messages
        "reason": args.slice(!isNaN(args[1]) ? 2 : 1).trim().join(" ") //anything else said is given as the reason
      })
      .catch(e => console.log(e));
    })
    .catch(e => this.Output.onError(e));
  }

  generate (args) {
    return new Promise ((resolve, reject) => {
      if(!args[0] || !this.Check.owner(this.member)) return reject("Insufficient permissions for this action!"); //temp permissions
      let member = this.Search.getMember(args[0], true);
      if(!member) return reject("No member found!");
      let embed = {
        "title": "⛔️ User Banned"
      };
      embed.fields = Embed.fielder(embed.fields, "Username", member.user.tag, true);
      embed.fields = Embed.fielder(embed.fields, "ID", member.user.id, true);
      this.Output.sender(embed);
      resolve(member);
    })
  }

}

module.exports = Ban;