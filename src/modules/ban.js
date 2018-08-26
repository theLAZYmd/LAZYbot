const Parse = require("../util/parse.js");
const Embed = require("../util/embed.js");

class Ban extends Parse {

  constructor(message) {
    super(message)
  }

  async fake (args) { //fakebanning, some features are just for fun yes
    try {
      let member = await this.generate(args);
      member.addRole(this.Search.roles.get(server.roles.muted))
    } catch (e) {
      if (e) this.Output.onError(e);
    }
  }

  async real (args) {
    try {
      let member = await this.generate(args)
      member.ban({
        "days": !isNaN(args[1]) ? Number(args[1]) : 0, //if second argument is a number, delete that many messages
        "reason": args.slice(!isNaN(args[1]) ? 2 : 1).trim().join(" ") //anything else said is given as the reason
      });
    } catch (e) {
      if (e) this.Output.onError(e);
    }
  }

  async generate (args) {
    if(!args[0] || !this.Check.owner(this.member)) throw "Insufficient permissions for this action!"; //extra level of security since these are serious commands
    let member = this.Search.members.get(args[0], true);
    if(!member) throw "No member found!";
    let embed = {
      "title": "⛔️ User Banned",
      "fields": []
    };
    embed.fields = Embed.fielder(embed.fields, "Username", member.user.tag, true);
    embed.fields = Embed.fielder(embed.fields, "ID", member.user.id, true);
    this.Output.sender(embed);
    return member;
  }

}

module.exports = Ban;