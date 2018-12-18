const config = require("../config.json");
const Permissions = require("./permissions.js");

module.exports = async (content, channel, args, argsInfo) => { //this function finds input parameters and returns an embed. Needs source, variant, and active.
    try {
        let defsources = Object.values(config.sources);
        let source = Object.values(config.sources).find((s) => {
            for (let a of args) {
                if (a.replace(/[^a-z]/gi, "").toLowerCase() === s.key.toLowerCase()) return true;
            }
        });
        let variant, active = /-a|--active/gi.test(content); //active is just if the message contains the word
        if (await Permissions.channels("trivia", argsInfo)) variant = { //check if it's a trivia channel first
            "name": "Trivia",
            "api": "trivia",
            "key": "trivia"
        };
        while (!variant) {
            if (source) {
                let found = {};
                for (let v of Object.values(config.variants[source.key])) {
                    if (content.includes(v.key)) found.args = v, variant = v; //if in args, match it.
                    if (channel.topic && channel.topic.includes(v.key)) found.channel = v, variant = v; //if in topic match it.
                    if (channel.name.includes(v.key)) found.channel = v, variant = v; //if in channel name, match it.
                    if (found.channel) break;
                }
                if (found.args && found.channel && found.channel !== found.args) throw "Wrong channel to summon this leaderboard!"; //if no possibilities or match conflict, return.
            } else if (defsources.length === 0) throw "Couldn't find matching variant";   //if none found, return.
            if (!variant) source = defsources.shift();
        }
        return {variant, source, active, argsInfo}; //data object for generating leaderboard
    } catch (e) {
        if (e) throw e;
    }
}