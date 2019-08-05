const Main = require("./main");

class Config {

    /*
    Private class called from main.js
    Generates new Configuration object to set to this.election
    */

    constructor(data = {}, argsInfo) {
        for (let property in data) {
            if (!data.hasOwnProperty(property)) continue;
            this["_" + property] = data[property];
        }
        for (let property in argsInfo) {
            if (!argsInfo.hasOwnProperty(property)) continue;
            this[property] = argsInfo[property];
        }
        this.server = argsInfo.server;
        this.Search = argsInfo.Search;
        this.Output = argsInfo.Output;
    }

    get date() {
        if (this._date) return this._date;
        return this._date = (async () => {
            return await this.Output.response({
                "description": "Please specify the date of the election."
            })
        })();
    }

    get system() {
        if (this._system) return this._system;
        return this._system = (async () => {
            return Object.keys(Main.Systems)[await this.Output.choose({
                "type": "electoral system",
                "options": Object.values(Main.Systems)
            })];
        })();
    }

    get type() {
        if (this._type) return this._type;
        return this._type = (async () => {
            let options = ["server", "channel"];
            return options[await this.Output.choose({
                options,
                "type": "election type"
            })]
        })()
    }

    get elections() {
        if (this._elections) return this._elections;
        return this._elections = (async () => {
            if (await this.type === "server") return this._elections = {
                "server": {
                    "voters": {},
                    "candidates": {}
                }
            };
            if (await this.type === "channel") {
                let error = true;
                while (error) {
                    if (typeof error === "string")(await this.Output.onError(error)).delete(30000);
                    try {
                        let description = "Please list the channels or categories containing the channels to hold elections, separated by spaces.";
                        let _channels = (await this.Output.response({
                                description
                            }))
                            .split(/\s| /g);
                        let channels = _channels.map(channel => this.Search.channels.get(channel));
                        for (let i = 0; i < channels.length; i++) { //error handling
                            let channel = channels[i];
                            if (!channel) throw "Couldn't find channel **" + _channels[i] + "**.";
                            if (channel.children) { //deal with channel categories
                                let collection = Array.from(channel.children.values()); //get the array of category
                                channels.splice(i, 1, ...collection); //exchange the channel in the array with the arrays from the category
                            }
                        }
                        channels = channels.map(channel => channel.name);
                        if (channels.length === 0) throw "No applicable channels given.";
                        if (channels.length > 25) throw "Maximum number of elections that can be held at once is 25.";
                        error = false;
                        return this._elections = channels.reduce((acc, curr) => {
                            if (typeof curr === "string") acc[curr] = {
                                "voters": {},
                                "candidates": {},
                            };
                            return acc;
                        }, {});
                    } catch (e) {
                        if (typeof e === "string") error = e;
                        else this.Output.onError(e);
                    }
                }
            }
        })()
    }

    get criteria() {
        if (this._criteria) return this._criteria;
        return this._criteria = (async () => {
            let type = "method of obtaining list of eligible voters.",
                criteria = ["Everyone in the server", "role", "From all who can see channel " + this.channel];
            let options = [
                "All server members can vote in this election.",
                this.type === "channel" ? "There is a role corresponding to the list of eligible voters." : "There are roles corresponding to each channel.",
                "Everyone who can see the current channel can vote in it."
            ];
            let index = await this.Output.choose({
                options,
                type
            });
            if (this.type === "server" || index !== 1) return this._criteria = criteria[index];
            let roleindex = await this.Output.choose({
                "options": [
                    "The role names are identical to the channel names.",
                    "Let me choose them each time."
                ],
                "description": "How do these roles correspond to the channels?"
            });
            return ["role-identical", "role-choose"][roleindex];
        })()
    }

    get inactives() {
        if (this._inactives) return this._inactives;
        return this._inactives = (async () => {
            return await this.Output.confirm({
                "description": "Allow inactive server members to vote?"
            }, true);
        })()
    }

    get dupes() {
        if (this._dupes) return this._dupes;
        if (!this.server.roles.dupe) return this._dupes = true;
        return this._dupes = (async () => {
            return await this.Output.confirm({
                "description": "Allow dupe accounts to vote?"
            }, true);
        })()
    }

    get messages() {
        if (this._messages) return this._messages;
        return this._messages = (async () => {
            return await this.Output.response({
                "description": "Minimum threshold of messages sent in server to vote (return `0` for any):",
                "number": true
            })
        })()
    }

    get sponsors() {
        if (this._sponsors) return this._sponsors;
        return this._sponsors = (async () => {
            return await this.Output.response({
                "description": "Minimum threshold of sponsors for a candidate to be listed on the ballot\n(return `0` for any; max `20`):",
                "number": true,
                "filter": m => Number(m.content) <= 20
            })
        })()
    }

    get limit() {
        if (this._limit) return this._limit;
        return this._limit = (async () => {
            let elections = Object.keys(await this.elections);
            if (elections.length === 1) return 1;
            let limit = await this.Output.response({
                "description": "Maximum number of elections permitted to run for\n(return '0' for any; max `" + elections.length + "`):",
                "number": true,
                "filter": m => Number(m.content) <= elections.length && 0 <= Number(m.content)
            });
            if (limit === 0) limit = elections.length;
            return limit;
        })()
    }

    get role() {
        if (this._role) return this._role;
        return this._role = (async () => {
            if (/^role(?:-choose)?$/.test(await this.criteria)) {
                let obj = {};
                for (let channel in await this.elections) {
                    if (!this.elections.hasOwnProperty(channel)) continue;
                    let response = await this.Output.response({
                        "description": await this.criteria === "role-choose" ? "Please write the name of the role for channel **" + channel + "**." : "Please write the name of the role for the list of eligible voters."
                    });
                    let role = this.Search.roles.get(response);
                    while (!role) {
                        this.Output.onError("Couldn't find role " + response + ".");
                        response = await this.Output.response({
                            "description": await this.criteria === "role-choose" ? "Please write the name of the role for channel **" + channel + "**." : "Please write the name of the role for the list of eligible voters."
                        });
                        role = this.Search.roles.get(response);
                    }
                    obj[channel] = response;
                }
                return obj;
            } else return undefined;
        })()
    }

}

module.exports = Config;