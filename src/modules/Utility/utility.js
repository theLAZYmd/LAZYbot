const Parse = require("../../util/parse");
const Embed = require("../../util/embed");
const DataManager = require("../../util/datamanager")

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
            if (!msg.content) embed.setContent(timestamp).setTitle(denoter).setDescription(msg.content.format());
            else if (embed.title && !/^On [a-zA-Z]{3} [a-zA-Z]{3} [0-9][0-9]? [0-9]{4} [0-9][0-9]:[0-9][0-9]:[0-9][0-9] GMT\+[0-9][0-9], user \*\*[\S \t^@#:`]{2,32}#\d{4}\*\* said:/.test(msg.content)) {
                embed.content = timestamp + "\n" + msg.content;
            }
            this.Output.sender(embed);
            this.message.delete();
        } catch (e) {
            if (e) this.Output.onError(e)
        }
    }

    async find(args) { //function needs a channel input
        let [id, channel] = args;
        let id = args[0];
        if (channel) {
            channel = this.Search.channels.get(args[1]);
            if (!channel) throw "No such channel!"
        } else channel = this.channel;
        let msg = await channel.fetchMessage(id)
        msg.embed = msg.embeds && msg.embeds[0] ? Embed.receiver(msg.embeds[0]) : null;
        return msg;
    }

}

module.exports = Utility;