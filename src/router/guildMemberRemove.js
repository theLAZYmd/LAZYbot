const Logger = require("../util/logger");
<<<<<<< HEAD
const TrackerConstructor = require("../modules/Tracker/main");
=======
const DBuser = require("../util/dbuser");
const DataManager = require("../util/datamanager");
const Parse = require("../util/parse");
const Embed = require('../util/embed');

class GuildMemberRemove extends Parse {

    constructor(data) {
        super(data);
    }

    async output() {
        let channel = this.Search.channels.get(this.server.channels.leave);
        let emoji = this.Search.emojis.get('F');
        let dbuser = DBuser.getUser(this.member.user);
        let message = await this.Output.sender(new Embed()
            .setTitle('❌ User left')
            .setDescription(this.member.user.tag)
            .setColor(this.server.colors.error)
            .setThumbnail(this.member.user.displayAvatarURL === this.member.user.defaultAvatarURL ? null : this.member.user.displayAvatarURL)
            .addField('ID', this.member.id, true)
            .addField('Messages', dbuser.messages.count.toLocaleString(), true)
            .addField('Last Message', dbuser.messages.last.format(), false)
        , channel);
        if (message) message.react(emoji).catch(() => {});
    }

}
>>>>>>> 1.8.0

module.exports = async (client, member) => {
    let tracker = new TrackerConstructor(client);
    tracker.remove(member.guild.id, member.id, true);
}
