const Parse = require("../util/parse.js");
const DataManager = require("../util/datamanager.js");
const config = require("../config.json");

class States extends Parse {

    constructor(message) {
        super(message);
    }

    au() {
        this.server.states.automaticupdates = !this.server.states.automaticupdates;
        DataManager.setServer(this.server);
    }

    tm(args) {
        if (this.client.user.id === config.ids.bot) return;
        if (!args || args.length !== 2) args = [true, true]; //default for selectivity not specified
        let [LAZYbot, bouncer] = [args[0] !== "false", args[1] !== "false"]; //.tm true false, evaltes to [true, false]
        this.server.states.tm = !this.server.states.tm; //invert testingmode state 
        let channels = [
            this.Search.channels.get(this.server.channels.bot),
            this.Search.channels.get(this.server.channels.bot2)
        ];
        for (let i = 0; i < channels.length; i++) { //selective toggle is only possible when enabling
            if (LAZYbot || !this.server.states.tm) channels[i].overwritePermissions(config.ids.bot, {
                'READ_MESSAGES': this.server.states.tm ? false : null, //each set to the opposite
                'SEND_MESSAGES': this.server.states.tm ? false : null //so if testing mode is enabled, permissions are denied
            });
            if (bouncer || !this.server.states.tm) channels[i].overwritePermissions(config.ids.bouncer, {
                'READ_MESSAGES': this.server.states.tm ? false : null, //if testing mode is disabled, permissions are allowed
                'SEND_MESSAGES': this.server.states.tm ? false : null
            });
        }
        DataManager.setServer(this.server);
        this.Output.sender({
            "description": `**Testing mode ${this.server.states.tm ? "enabled" : "disabled"}.**`,
            "color": this.server.states.tm ? config.colors.generic : config.colors.error
        });
    }

    bcp(forced) {
        try {
            let channel = this.channel ? this.channel : this.Search.channels.get(this.server.channels.bot);
            let members = [
                this.Search.members.get(config.ids.bouncer), //bouncer member
                this.Search.members.get(config.ids.nadeko) //nadeko member
            ];
            let role = this.Search.roles.get(this.server.roles.bot);
            let activeboolean = forced || this.Check.role(members[1], this.server.roles.bot); //does nadeko already have the role?
            members[activeboolean ? 0 : 1].addRole(role); //if 0, added to bouncer
            members[activeboolean ? 1 : 0].removeRole(role); //and remove from nadeko
            this.Output.generic(`**Bot Contingency Plan ${activeboolean ? "disabled" : "enabled"}.**`, channel)
        } catch (e) {
            if (e) this.log(e);
        }
    } //if so, then give it to bouncer and take it from nadeko, if not give to nadeko, take from bouncer

}

module.exports = States;