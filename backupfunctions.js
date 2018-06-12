//change your datamanager.js to have the appropriate lines replaced by this
DataManager.prototype.getData = function(newfilepath) {
	return JSON.parse(fs.readFileSync(newfilepath ? newfilepath : this.filepath, "utf8"));
};

DataManager.prototype.setData = function(data, newfilepath) {
	fs.writeFileSync(newfilepath ? newfilepath : this.filepath, JSON.stringify(data, null, 4));
};

//stick this at the top of your code
const DataManagerConstructor = require("./datamanager.js");
const DataManager = new DataManagerConstructor(settings.dataFile);

//stick this anywhere in your bot.js
backupdb("1", 3600000); //backupdb
backupdb("2", 7200000);
backupdb("3", 14400000);

//dump this at the bottom somewhere
function backupdb(degree, interval) {
  let tally = DataManager.getData();
  if(!tally) return;
  let time = gettime (interval)
  degree = degree ? degree : "1";
  if((degree !== "1") && (degree !== "2") && (degree !== "3")) {degree = "1"};
  if(interval) {
    setInterval(() => {
      DataManager.setData(tally, `./dbbackup${degree}.json`);
      console.log(`Database backed up to dbbackup${degree} at ${gettime (Date.now())}.`);
      settings.backupdb[degree - 1] = getISOtime(Date.now())
      DataManager.setData(config, "./settings.json");
    }, interval);
  } else if(!interval) {
      DataManager.setData(tally, `./dbbackup${degree}.json`);
      console.log(`Database backed up to dbbackup${degree} at ${getISOtime (Date.now())}.`);
      settings.backupdb[degree - 1] = getISOtime(Date.now())
      DataManager.setData(config, "./settings.json");
  }
  return true;
};

function restoredb(degree) {
  degree = degree ? degree : "1";
  let backup = DataManager.getData("./dbbackup1.json")
  DataManager.setData(backup);
  return true;
};

function gettime (ms) {
  let time = new Date(ms);
  time.hours = time.getUTCHours();
  time.minutes = time.getUTCMinutes();
  time.seconds = time.getUTCSeconds();
  time.milliseconds = time.getUTCMilliseconds();
  time.days = Math.floor(time.hours/24);
  time.hours = time.hours - (24 * time.days);
  return time;
};

function getISOtime (ms) {
  return gettime (ms).toString().slice(0, 31); 
};

//dump this in your client.on("message" => {}) if you want !backupdb and !restoredb to be commands
if(splitMsg[0] === "!backupdb") {
  degree = splitMsg[1] ? splitMsg[1] : "1";
  if((degree !== "1") && (degree !== "2") && (degree !== "3")) {degree = "1"};
  let success = backupdb (degree);
  message.channel.send(success ? `Database was restored from **dbbackup${degree}** at ${getISOtime (Date.now())}.` :`Failed to backup database. Please review js.`);
} else

if(splitMsg[0] === "!restoredb") {
  degree = splitMsg[1] ? splitMsg[1] : "1";
  if((degree !== "1") && (degree !== "2") && (degree !== "3")) {degree = "1"};
  let tally = DataManager.getData(`./dbbackup${degree}.json`);
  DataManager.setData(tally)
  console.log(`Database restored from dbbackup${degree}.json at ${gettime (Date.now())}.`);
  let success = true;
  message.channel.send(success ? `Database was restored from **dbbackup${degree}** at ${getISOtime (Date.now())}.` :`Failed to backup database. Please review js.`);
}