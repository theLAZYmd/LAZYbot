const Parse = require("../../util/parse.js");

class LUTDU {
  getLUTDU(guildID) { //Least Up-to-Date User
		this._guild = this.Search.guilds.byID(guildID);
		let currentValue = Infinity;
		return DataManager.getData().find((dbuser) => {
			if (dbuser.left) return false; //if they're not in the server, stop updating them
			let sources = Object.values(config.sources).filter(source => dbuser[source.key]);
			if (sources.length === 0) return false; //if no linked accounts, ignore them
			let member = this.Search.members.byUser(dbuser);
			if (!member) {
				dbuser.left = true;
				DBuser.setData(dbuser);
				return false;
			}
			if (dbuser.left) {
				delete dbuser.left;
				DBuser.setData(dbuser);
			}			
			if (!/online|idle|dnd/.test(member.presence.status)) return false;
			if (!dbuser.lastupdate) return true;
			if (dbuser.lastupdate < currentValue && dbuser.lastupdate < Date.now() - config.delays.repeat) {
				currentValue = dbuser.lastupdate;
				return dbuser;
			}
		})
	}
}

module.exports = LUTDU;