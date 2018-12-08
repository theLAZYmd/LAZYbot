const Parse = require("../util/parse.js");
const DataManager = require("../util/datamanager.js");

class Notifications extends Parse {

    constructor(message) {
        super(message);
    }

    run(args, argument) {
        if (!this.Check.role(this.member, "Bronze") || !args[0]) return; //temporary permissions, but this command really needs it
        let notify = this.server.notify || {};
        if (notify[this.author.id] && Date.now() - notify[this.author.id] < 3600000) return this.Output.onError(`You're using that command too frequently.\nPlease wait **${Math.ceil((3600000 - (Date.now() - notify[this.author.id]))/60000)}** minutes.`);
        let link = args[0];
        let ETA = argument.slice(link.length).trim();
        if (link.match(/(lichess.org\/tournament\/)|(chess\.com)|(bughousetest\.com\/tournament\/)/g)) {
            this.Output.sender({
                "content": "@here",
                "title": "Tournament Starting!",
                "description": `Greeetings ${this.channel}. You have been invited to join a tournament by **${this.author.tag}**.${ETA ? ` Tournament starting... ${ETA}!` : " Join now!"}\n${link}`
            });
            this.log(`${this.author.tag} has sent out a ping for ${link}.`);
            notify[this.author.id] = Date.now();
            this.server.notify = notify;
            DataManager.setServer(this.server);
        }
    }

}

module.exports = Notifications;