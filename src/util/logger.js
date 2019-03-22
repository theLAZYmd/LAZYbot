const winston = require("winston");
const logger = winston.createLogger({
	"level": "info",
	"format": winston.format.json(),
	"transports": [
		new winston.transports.Console(),
		new winston.transports.File({   "filename": "combined.log"  })
	]
})

class Logger {
    
    static async command(argsInfo, cmdInfo) {
        try {
            let time = Date.getISOtime(Date.now()).slice(0, 24);
            let author = argsInfo.author.tag;
            let Constructor = cmdInfo.file.toProperCase();
            let command = (cmdInfo.command ? argsInfo.server.prefixes[cmdInfo.prefix] : cmdInfo.prefix) + argsInfo.command;
            let args = argsInfo.args;
            //logger.log({
            //	"level": "info",
            //	"message": time + " | " + author + " | " + Constructor + " | " + command + " | [" + args + "]"
            //});
            Logger.output(time + " | " + author + " | " + Constructor + " | " + command + " | [" + args + "]");
            return "";
        } catch (e) {
            Logger.error(e);
        }
    }

    static async log(s) {
        if (typeof s === "string" || typeof s === "number") return Logger.output(s);
        if (Array.isArray(s)) return Logger.output([Date.getISOtime(Date.now()).slice(0, 24), ...s].join(" | "));
        if (typeof s === "object") return Logger.output([Date.getISOtime(Date.now()).slice(0, 24), ...Object.entries(s).map(([k, v]) => k + ": " + v)].join(" | "));
        if (typeof s === "function") return Logger.output(s.toString());
        Logger.output(s);
    }

    static async load(startTime, list, source) {
        let arr = [
            Date.getISOtime(Date.now()).slice(0, 24),
            "loaded"
        ];
        if (typeof startTime === "number") arr.push((Date.now() - startTime) + "ms");
        if (source) arr.push(source);
        Logger.output(arr.join(" | ") + "\n" + list.map(([s, k]) => ["    " + k, s]).toPairs());
    }

    static async output(s) {
        console.log(s);
    }

    static async error(e) {
        console.error(e);
    }
}

module.exports = Logger;