const DataManager = new require("../util/datamanager.js")();
const Embed = require("../util/embed.js");

class DB {

    static async _backup(degree) {
        try {
            let tally = DataManager.data;
            DataManager.setFile(tally, `./dbbackup${degree}.json`);
            this.log(`Database backed up to dbbackup${degree} at ${getISOtime(Date.now())}.`);
            config.backupdb[degree - 1] = getISOtime(Date.now());
            DataManager.setFile(config, "./config.json");
        } catch (e) {
            if (e) this.Output.onError(e);
        }
    }

    static backup(args) {
        degree = args[0] ? args[0] : "1";
        if (!degree.match(/[1-3]/)) degree = 1;
        let interval = args[1];
        if (interval) setInterval(() => {
            DB._backup()
                .then(Output.generic(`Database backed up to **dbbackup${degree}** at ${getISOtime (Date.now())}.`))
                .catch(e => Output.onError(`Failed to backup database. ` + e));
        }, interval);
        else DB._backup()
            .then(Output.generic(`Database backed up to **dbbackup${degree}** at ${getISOtime (Date.now())}.`))
            .catch(e => Output.onError(`Failed to backup database. ` + e));
    }

    static restore(args) {
        degree = args[0] ? args[0] : "1";
        if (!degree.match(/[1-3]/)) degree = 1;
        DataManager.data = DataManager.getFile(`./dbbackup${degree}.json`);
        this.log(`Database restored from dbbackup${degree}.json at ${gettime (Date.now())}.`);
        Output.generic(`Database was restored from **dbbackup${degree}** at ${getISOtime (Date.now())}.`);
    }

    static status(message) {
        let embedoutput = {};
        embedoutput.title = "Backup Databases Last Updated:";
        embedoutput.fields = Embed.fielder(embedoutput.fields, "dbbackup1.json", config.backupdb[0], true);
        embedoutput.fields = Embed.fielder(embedoutput.fields, "dbbackup2.json", config.backupdb[1], true);
        embedoutput.fields = Embed.fielder(embedoutput.fields, "dbbackup3.json", config.backupdb[2], true);
        Embed.sender(embedoutput, message.channel);
    }

}

module.exports = DB;

function gettime(ms) {
    let time = new Date(ms);
    time.hours = time.getUTCHours();
    time.minutes = time.getUTCMinutes();
    time.seconds = time.getUTCSeconds();
    time.milliseconds = time.getUTCMilliseconds();
    time.days = Math.floor(time.hours / 24);
    time.hours = time.hours - (24 * time.days);
    return time;
}

function getISOtime(ms) {
    return gettime(ms).toString().slice(0, 31);

}