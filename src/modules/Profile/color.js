const Parse = require("../../util/parse");
const Logger = require("../../util/logger");
const Maths = require("../Calculation/maths");
const Embed = require('../../util/embed');

class Color extends Parse {

    constructor(message) {
        super(message)
    }

    async run(member) {
        try {
            let args = this.args;
            let argument = this.argument;
            let modboolean = false;
            if (args[0] && this.Search.users.get(args[0], true)) { //if the first word summons a user then we do something different
                member = this.Search.members.get(args[0]); //the user we use becomes the args[0] (instead of message.author);
                args = args.slice(1);
                argument = args.join(" ").replace(/[^a-zA-Z0-9\.!\?',;:"£\$%~\+=()\s\u200B-\u200D\uFEFF-]+/g, "");
                modboolean = true; //need permissions to change somebody else's colour.
            }
            if (!args[0] || !argument) return this.get(member); //if there's no arguments left, view
            if (modboolean && !await this.Permissions.role('admin', this)) throw this.Permissions.output('role');
            return this.set(member, argument);
        } catch (e) {
            if (e) this.Output.onError(e);
        }
    }

    async get(member, action) {
        this.Output.sender(new Embed()
            .setColor(member.displayColor)
            .setDescription((action ? action : "Current") + ` colour for **${member.user.tag}**: **${this.member.displayColor}**.`)
        )
    }

    async set(member, argument) {
        try {
            let color = argument.replace(/[^a-zA-Z0-9,]/g, "").toUpperCase();
            let hex = color.match(/([0-9]{1,3})\s?,([0-9]{1,3})\s?,([0-9]{1,3})/);
            if (hex) {
                color = hex.slice(1);
                for (let i = 0; i < color.length; i++) {
                    color[i] = Number(color[i]);
                }
            }
            if (!member.roles.some(role => role.name.toLowerCase() === "choosecolor")) throw this.Permissions.output('role');
            let role = this.Search.roles.get(member.user.username + "CustomColor");
            if (role) {
                role.setColor(color);
                this.get(member, "Set");
            }
        } catch (e) {
            if (e) this.Output.onError(e);
        }
    }

    async add(member) {
        try {
            member.addRole(this.Search.roles.get("ChooseColor"));
            let role = await this.guild.createRole({
                "name": username + "CustomColor",
                "position": 70
            });
            member.addRole(role);
            Logger.log(["Color", "process", "createRole", "[" + [role.name, member.user.tag].join(",") + "]"]);
        } catch (e) {
            if (e) this.Output.onError(e);
        }
    }

    static randDecimal() {
        return Maths.randbetween(1, 16777215);
    }

    static randHex() {
        let letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++)
            color += letters[Maths.randBetween(0, 17)];
        return color;
    }

}

module.exports = Color;