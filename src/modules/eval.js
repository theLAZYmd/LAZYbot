const Parse = require("../util/parse.js");
const DBuser = require("../util/dbuser.js");
const DataManager = require("../util/datamanager.js");
const Embed = require("../util/embed.js");
const DebuggingConstructor = require("../util/debugging.js");
const Logger = require("../util/logger.js");
const request = require("request");
const rp = require("request-promise");
const fs = require("fs");

class Eval extends Parse {

    constructor(message) {
        super(message);
        this.Debugging = new DebuggingConstructor(this.client);
    }

    async call(argument) {
        try {
            if (!this.Check.owner(this.author)) throw "That command is bot owner only.\nIf you are not an active developer on the bot, you cannot use this command."; //extra protection, in case 
            if (!/^([\w]+).([\w]+)\(([\w\s\,]*)\)/i.test(argument)) throw "Incorrect formatting to call a function.";
            let [, Constructor, method, a] = argument.match(/^([\w]+).([\w]+)\(([\w\s\,]*)\)/i);
            let argsInfo = this;
            fs.readdir("./src/modules/", async function (err, files) {
                try {
                    for (let f of files.filter(f => (new RegExp(Constructor.toLowerCase()).test(f.toLowerCase())))) try {
                        let Instance = require("./" + f);
                        let I = new Instance(argsInfo.message);
                        if (typeof I[method] !== "function") throw "Couldn't find method " + method + " on " + Constructor + ".";
                        let data = await I[method](eval(a));
                        if (/string|number/.test(typeof data)) argsInfo.Output.generic(data);
                        else if (typeof data === "object") argsInfo.Output.data(data);
                        else argsInfo.log(data);
                        return data;
                    } catch (e) {
                        if (e) argsInfo.Output.onError(e);
                        return;
                    };
                    throw "Couldn't find matching module for " + Constructor + ".";
                } catch (e) {
                    if (e) argsInfo.Output.onError(e);
                }
            })
        } catch (e) {
            if (e) this.Output.onError(e);
        }
    }

    async run(args, argument) {
        try {
            if (!this.Check.owner(this.author)) throw "That command is bot owner only.\nIf you are not an active developer on the bot, you cannot use this command."; //extra protection, in case permission.js fails
            if (argument.startsWith("```") && argument.endsWith("```")) argument = argument.slice(args[0].length, -3).trim();
            else throw "Incorrect formatting! Use a code block!";
            eval(argument);
        } catch (e) {
            if (e) this.Output.onError(e);
        }
    }
}

module.exports = Eval;