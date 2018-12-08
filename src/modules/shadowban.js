const Parse = require("../util/parse.js");
const Embed = require("../util/embed.js");

class Shadowban extends Parse {

    constructor(message) {
        super(message);
    }

    get shadowbanned () { //this is just a utility function, pls ignore
        if (this._shadowbanned) return this._shadowbanned;
        return this._shadowbanned = this.server.shadowbanned || {
            "usernames": [],
            "users": [],
            "newMessages": []
        }
    }

    set shadowbanned (shadowbanned) { //this is just a utility function, pls ignore
        let server = this.server;
        server.shadowbanned = shadowbanned;
        this._server = server;
        this.server = server;
    }

    async list() { //displays list of information for conditions for shadowbanning
        let shadowbanned = this.shadowbanned;
        this.Output.sender(new Embed()
            .setTitle("⛔️ List of shadowban conditions on " + this.guild.name)
            .addField("By Username", shadowbanned.usernames.join("\n") || "\u200b", false)            
            .addField("By User", shadowbanned.users.join("\n") || "\u200b", false)            
            .addField("By Message Content", shadowbanned.newMessages.join("\n") || "\u200b", false)
        )
    }

    static async sbusername({  user  }) { //if a new User's username matches a regex, BAN them
        try {
            for (let n of this.shadowbanned.usernames) {
                let array = n.split("/");
                let r = new RegExp(array.slice(0, -1).join("/"), array.pop());
                if (r.test(user.username)) await this.guild.ban(user, {
                    "days": 0
                })
            }
        } catch (e) {
            if (e) this.Output.onError(e);
        }
    }

    async sbuser(message) { //if a specific user specified, delete all their messages. Ban them if they ping someone.
        try {
            if (this.shadowbanned.users.find(id => id === this.message.author.id)) {
                message.delete();
                if (message.mentions.everyone || message.mentions.users.size > 0) {
                    this.guild.ban(message.author, {
                        "days": 0
                    })
                }
            }
        } catch (e) {
            if (e) this.Output.onError(e);
        }
    }

    async sbnm(message) { //for all new users (less than 50 messages), if their message matches the content, ban them. Otherwise if it's just a content match, alert mods.
        try {
            try {
                for (let n of this.shadowbanned.newMessages) {
                    let array = n.split("/");
                    let r = new RegExp(array.slice(0, -1).join("/"), array.pop());
                    if (r.test(message.content)) {
                        if (Date.now() - this.member.joinedTimestamp < 24 * 60 * 60 * 1000) {
                            if (this.dbuser.messages.count < 50) await this.guild.ban(message.author, {
                                "days": 0
                            });
                        }
                        else this.Output.sender(new Embed()
                            .setTitle("Automod filtered message")
                            .addField("Author", this.author.tag, true)
                            .addField("Channel", this.channel, true)
                            .addField("Time", message.editedAt || message.createdAt, true)
                            .addField("Content", message.content, false)
                        , this.Search.channels.get(this.server.channels.modmail));
                    }
                }
            } catch (e) {
                if (e) this.Output.onError(e);
            }
        } catch (e) {
            if (e) this.Output.onError(e);
        }
    }

    async adder(args) { //router
		try {
            let command = "add" + (/User|Username|NewMessage/i.test(args[0]) ? args.shift() : "User");
            for (let f of Object.getOwnPropertyNames(Shadowban.prototype)) {
                console.log(f, command, f.toLowerCase() === command.toLowerCase());
                if (f.toLowerCase() === command.toLowerCase() && typeof this[f] === "function") return this[f](args);
            };
			throw "Invalid second parameter given **" + this.args[0] + "**.";
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

    async addUser([_user]) { //if a user has a specific ID, DELETE all their messages
        try {
            let user = this.Search.users.get(_user, true);
            if (!user) throw "Couldn't find matching user to shadowban.";
            let shadowbanned = this.shadowbanned;
            shadowbanned.users.push(user.id);
            this.shadowbanned = shadowbanned;
            if (!member) throw "No member found!";
            this.Output.sender(new Embed()
                .setTitle("⛔️ User Shadowbanned")
                .addField("Username", user, true)
                .addField("ID", user.id, true)
            );
        } catch (e) {
            if (e) this.Output.onError(e);
        }
    }

    async addUsername([username]) { //if a user
        try {
            let array = username.split("/");
            let regex = new RegExp(array.slice(0, -1).join("/"), array.pop());
            if (!regex) throw "Invalid RegExp to validate new users!";
            let shadowbanned = this.shadowbanned;
            shadowbanned.users.push(username);
            this.shadowbanned = shadowbanned;
            this.Output.sender(new Embed()
                .setTitle("⛔️ Username Shadowbanned")
                .addField("Username", username, true)
                .addField("Channel", this.server.channels.join, true)
            );
        } catch (e) {
            if (e) this.Output.onError(e);
        }
    }

    async addNewMessage(args) {
        try {
            let msg = args.join(" ");
            let array = msg.split("/");
            let regex = new RegExp(array.slice(0, -1).join("/"), array.pop());
            if (!regex) throw "Invalid RegExp to validate messages from new users!";
            let shadowbanned = this.shadowbanned;
            shadowbanned.newMessages.push(msg);
            this.shadowbanned = shadowbanned;
            if (!member) throw "No member found!";
            this.Output.sender(new Embed()
                .setTitle("⛔️ Message Content Shadowbanned")
                .addField("Message Content", msg, true)
                .addField("Channel", this.server.channels.join, true)
            );
        } catch (e) {
            if (e) this.Output.onError(e);
        }
    }

    async remove() {
        try {
            let shadowbanned = this.shadowbanned;
            let key = await this.Output.choose({
                "options": Object.keys(shadowbanned),
                "type": "condition of shadowbanning to modify."
            });
            let type = Object.keys(shadowbanned)[key];
            let index = await this.Output.choose({
                "options": this.shadowbanned[type],
                "type": "data entry to remove."
            });
            shadowbanned[type] = shadowbanned[type].remove(index);
            this.shadowbanned = shadowbanned;
            this.list();
        } catch (e) {
            if (e) this.Output.onError(e);
        }
    }

}

module.exports = Shadowban;