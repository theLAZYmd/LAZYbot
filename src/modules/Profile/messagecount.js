const Parse = require("../../util/parse.js");
const DBuser = require("../../util/dbuser.js");

class MessageCount extends Parse {

    constructor(message) {
        super(message);
    }

    async log(author, dbuser) { //section for message logging
        try {
            if (!author || !dbuser) console.log(this);
            if (!isNaN(dbuser.messages.count)) dbuser.messages.count++;
            else {
                dbuser.messages.count = 0;
                throw "Your message count data has been lost. Please alert a bot owner immediately.";
            }
            if (Object.values(this.server.prefixes).includes(this.prefix)) throw "";
            dbuser.messages.last = this.message.content.length > 500 ? this.message.content.slice(0, 500).replace("`", "") + "..." : this.message.content.replace(/\`/g, "");
            dbuser.messages.lastSeen = this.message.createdTimestamp;
            if (dbuser.username !== author.tag) dbuser.username = author.tag;
            DBuser.setData(dbuser);
        } catch (e) {
            if (e) this.Output.onError(e);
        }
    }

    async update(user) {
        try {
            let newcount = Number(args.find(a => !isNaN(Number(a))));
            let testuser = args.find(a => this.Search.users.get(a));
            if (testuser) user = this.Search.users.get(testuser);
            if (!newcount) throw "No new MessageCount specified!";
            let dbuser = DBuser.getUser(user);
            dbuser.messages.count = newcount;
            DBuser.setData(dbuser);
            this.Output.generic(`Message count for **${user.tag}** is now **${dbuser.messages.count.toLocaleString()}** messages.`);
        } catch (e) {
            if (e) this.Output.onError(e);
        }
    }

    async get(args, user) {
        try {
            if (args.length === 1) { //!messages titsinablender
                user = this.Search.users.get(args[0]);
                if (!user) return this.Output.onError(`Couldn't find user!`);
            }
            let dbuser = DBuser.getUser(user);
            this.Output.generic(`**${user.tag}** has sent **${dbuser.messages.count.toLocaleString()}** messages.`)
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