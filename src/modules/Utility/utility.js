const Parse = require("../../util/parse");
const Embed = require("../../util/embed");
const DataManager = require("../../util/datamanager");
const DBuser = require('../../util/dbuser');

class Utility extends Parse { //fairly miscelanneous functions

    async members() {
        let tally = DataManager.getData();
        this.Output.generic(`There are **${tally.length}** unique users registered to the database.`);
    }

    async ping() {
        this.Output.generic(`** ${this.author.tag}** :ping_pong: ${parseInt(this.client.ping)}ms`);
    }

    async uptime() {
        let time = Date.getTime(Date.now() - this.client.readyTimestamp);
        return this.Output.generic(`**${time.days}** days, **${time.hours}** hours, **${time.minutes}** minutes, and **${time.seconds}** seconds since ${Math.random() > 0.5 ? "**bleep bloop! It's showtime**" : "last reboot"}.`);
    }

    async markdownify() {
        try {
            let msg = await this.find(this.args);
            if (!msg.content) throw "No embeds found to JSONify!";
            this.Output.data(msg.content, this.channel, "md");
        } catch (e) {
            if (e) this.Output.onError(e);
        }
    }

    async jsonify() {
        try {
            let msg = await this.find(this.args);
            if (!msg.embed) throw "No embeds found to JSONify!";
            this.Output.data(msg.embed);
        } catch (e) {
            if (e) this.Output.onError(e);
        }
    }

    async fetch() {
        try {
            let msg = await this.find(this.args);
            let embed = new Embed(msg.embed || {});
            let denoter = "Fetched Message for " + this.author.tag;
            let timestamp = "\On " + Date.getISOtime(msg.createdTimestamp || Date.now()) + ", user **" + msg.author.tag + "** said:";
            if (msg.content) {
                if (!/^On [a-zA-Z]{3} [a-zA-Z]{3} [0-9][0-9]? [0-9]{4} [0-9][0-9]:[0-9][0-9]:[0-9][0-9] GMT\+[0-9][0-9], user \*\*[\S \t^@#:`]{2,32}#\d{4}\*\* said:/.test(msg.content)) {
                    embed.setContent(timestamp).setTitle(denoter).setDescription(msg.content.format());
                } else embed.setContent(timestamp)
            }
            else if (embed.title || embed.description || embed.fields && embed.fields.length > 1) {
                embed.setContent(timestamp);
            }
            this.Output.sender(embed);
        } catch (e) {
            if (e) this.Output.onError(e)
        }
    }

    async find(args) { //function needs a channel input
        try {
            let [id, channel] = args;
            if (channel) {
                channel = this.Search.channels.get(channel);
                if (!channel) throw "No such channel!"
            } else channel = this.channel;
            let msg = await channel.fetchMessage(id)
            msg.embed = msg.embeds && msg.embeds[0] ? Embed.receiver(msg.embeds[0]) : null;
            return msg;
        } catch (e) {
            if (!e) return null;
            if (typeof e === "string") throw e;
            switch (e.message) {
                case "Unknown Message":
                    throw "**Fetch Error:** Couldn't find message, check ID and channel is correct."
                case "Missing Access":
                    throw "**Fetch Error:** Bot doesn't have access to channel."
            }
        }
    }

    /**
     * Outputs the information collected on a given user 
     * @param {UserResolvable} argument 
     * @param {*} user 
     */
    async dbuser(argument = this.argument, user = this.user) {
        try {
            if (argument) {
                if (!this.Permissions.role('admin', this)) throw this.Permissions.output('role');
                user = this.Search.users.get(argument);
                if (!user) throw new Error("Couldn't find user **" + argument + "** in this server");
            }
            let dbuser = DBuser.getUser(user);
            this.Output.data(dbuser, this.channel, 'json');
        } catch (e) {
            if (e) this.Output.onError(e);
        }
    }

}

module.exports = Utility;