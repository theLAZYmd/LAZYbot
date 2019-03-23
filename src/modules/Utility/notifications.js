const Parse = require("../../util/parse.js");
const DataManager = require("../../util/datamanager.js");

class Notifications extends Parse {

    constructor(message) {
        super(message);
    }

    async run(argument) {
        try {
            if (!this.member.roles.some(role => role.name.toLowerCase() === "bronze")) throw this.Permissions.output('role');
            let server = this.server;
            let notify = server.notify || {};
            if (!/https?:\/\/(lichess\.org|chess\.com|bughousetest\.com)(?:\/tournament\/)?[\S\.]*\.*\w+\/?\s?/.test(link)) return;
            if (notify[this.author.id] && Date.now() - notify[this.author.id] < 3600000) throw `You're using that command too frequently.\nPlease wait **${Math.ceil((3600000 - (Date.now() - notify[this.author.id]))/60000)}** minutes.`;
            let [link, site] = argument.match(/https?:\/\/(lichess\.org|chess\.com|bughousetest\.com)(?:\/tournament\/)?[\S\.]*\.*\w+\/?\s?/);
            argument = argument.replace(link, "").trim();
            let [hours, minutes, seconds] = argument.parseTime();
            argument = argument.replace(hours, "").replace(minutes, "").replace(seconds, "").replace(/\s\s/g, " ").trim();
            let embed = new Embed()
                .setContent("@here")
                .setTitle("Notification for a tournament!")
                .setDescription(`Greetings ${this.channel}. You have been invited to join a tournament. [Join now!](${link})`, true)
                .addField("Author", this.author.tag, true);
            if (hours || minutes || seconds) embed.addField("ETA", (hours || "0") + "h " + (minutes || "0") + "m " + (seconds || "0") + "s ");
            notify[this.author.id] = Date.now();
            server.notify = notify;
            DataManager.setServer(server);
        } catch (e) {
            if (e) this.Output.onError(e);
        }
    }

}

module.exports = Notifications;