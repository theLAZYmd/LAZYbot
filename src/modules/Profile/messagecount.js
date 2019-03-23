const Parse = require('../../util/parse');
const DBuser = require('../../util/dbuser');
const Embed = require('../../util/embed');

class MessageCount extends Parse {

    constructor(message) {
        super(message);
    }

    async count() { //section for message logging
        try {
            let dbuser = this.dbuser;
            dbuser.messages.count++;
            DBuser.setData(dbuser);
        } catch (e) {
            if (e) this.Output.onError(e);
        }
    }

    async log() {
        try {
            let dbuser = this.dbuser;
            dbuser.messages.last = this.content.length > 500 ? this.content.slice(0, 500).replace("`", "") + "..." : this.content.replace(/\`/g, "");
            dbuser.messages.lastSeen = this.message.createdTimestamp;
            if (dbuser.username !== this.author.tag) dbuser.username = this.author.tag;
            DBuser.setData(dbuser);
        } catch (e) {
            if (e) this.Output.onError(e);
        }
    }

    async update(user = this.author) {
        try {
            let number;
            for (let a of args) {
                if (typeof a === "number") number = a;
                else {
                    let _user = this.Search.users.get(a);
                    if (_user) user = _user;
                    else throw this.Permissions.output('args');
                }
            }
            let dbuser = DBuser.getUser(user);
            dbuser.messages.count = number;
            DBuser.setData(dbuser);
            this.Output.generic(`Message count for **${user.tag}** is now **${dbuser.messages.count.toLocaleString()}** messages.`);
        } catch (e) {
            if (e) this.Output.onError(e);
        }
    }

    async get(args, user) {
        try {
            if (args.length > 1) throw this.Permissions.output('args');
            if (args.length === 1) { //!messages titsinablender
                user = this.Search.users.get(args[0]);
                if (!user) throw "Couldn't find user!";
            }
            let dbuser = DBuser.getUser(user);
            this.Output.generic(`**${user.tag}** has sent **${dbuser.messages.count.toLocaleString()}** messages.`);
        } catch (e) {
            if (e) this.Output.onError(e);
        }
    }

    async last(argument) {
        try {
            let user = this.author;
            if (argument) user = this.Search.users.get(argument);
            if (!user) throw "Couldn't find user **" + argument + "**!";
            let dbuser = DBuser.getUser(user);
            if (!dbuser.messages.last) throw "Last message was not logged for user **" + user.tag + "**.";
            this.Output.sender(new Embed()
                .setTitle("Last Message of " + user.tag + "\n")
                .setDescription(dbuser.messages.last.format())
            );
        } catch (e) {
            if (e) this.Output.onError(e)
        }
    }

}

module.exports = MessageCount;