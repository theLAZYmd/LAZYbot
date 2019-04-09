const Parse = require("../../util/parse.js");
const Embed = require("../../util/embed.js");

class Ban extends Parse {

    constructor(message) {
        super(message);
    }

    async fake(args) { //fakebanning, some features are just for fun yes
        try {
            let member = await this.generate(args);
            member.addRole(this.Search.roles.get(server.roles.muted))
        } catch (e) {
            if (e) this.Output.onError(e);
        }
    }

    async real(args) {
        try {
            let member = await this.generate(args);
            member.ban({
                "days": !isNaN(args[1]) ? Number(args[1]) : 0, //if second argument is a number, delete that many messages
                "reason": (args.slice(!isNaN(args[1]) ? 2 : 1) || []).join(" ").trim() //anything else said is given as the reason
            });
        } catch (e) {
            if (e) this.Output.onError(e);
        }
    }

    async generate(args) {
        if (!args[0] || !await this.Permissions.role('owner', this)) throw this.Permissions.output('role');
        let member = this.Search.members.get(args[0], true);
        if (!member) throw "No member found!";
        this.Output.sender(new Embed()
            .setTitle("⛔️ User Banned")
            .addField("Username", member.user.tag, true)
            .addField("ID", member.user.id, true)
        );
        return member;
    }

}

module.exports = Ban;