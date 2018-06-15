const fs = require("fs");
const config = require("./config.json");

function DataManager(dbfilepath, serverfilepath) {
  this.filepath = dbfilepath;
  this.serverfilepath = serverfilepath;
};

DataManager.prototype.getData = function(newfilepath) {
	return JSON.parse(fs.readFileSync(newfilepath ? newfilepath : this.filepath, "utf8"));
};

DataManager.prototype.setData = function(data, newfilepath) {
	fs.writeFileSync(newfilepath ? newfilepath : this.filepath, JSON.stringify(data, null, 4));
};

DataManager.prototype.getGuildData = function(serverid) {
  serverid = serverid.id ? serverid.id : serverid;
  let server = JSON.parse(fs.readFileSync(this.serverfilepath, "utf8"))[serverid];
  if(!server) {
    console.log("No server found, creating one...");
    let newserver = config.servertemplate;
    newserver.id = serverid;
    this.setGuildData(newserver);
    console.log("Server " + serverid + " has been logged in the database!");
    server = JSON.parse(fs.readFileSync(this.serverfilepath, "utf8"))[serverid];
  };
  return server;
};

DataManager.prototype.setGuildData = function(serverdata) {
  let guildconfig = this.getData("./guildconfig.json");
  guildconfig[serverdata.id] = serverdata;
  fs.writeFileSync(this.serverfilepath, JSON.stringify(guildconfig, null, 4));
};

module.exports = DataManager;