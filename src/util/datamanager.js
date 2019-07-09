const fs = require('fs');
const config = require('../config.json');
const Logger = require('./logger.js');
const Server = require('../templates/server.js');

class DataManager {

	static getFile(newfilepath) { //basic file management. All files come through here
		return JSON.parse(fs.readFileSync(newfilepath, 'utf8'));
	}

	static setFile(data, newfilepath) { //All files set through here
		fs.writeFileSync(newfilepath, JSON.stringify(data, null, 4));
	}

	static getData() { //get tally
		if (DataManager._data) return DataManager._data;
		return DataManager._data = DataManager.getFile(config.dataFile);
	}

	static setData(data) {
		DataManager._data = data;
		return DataManager.setFile(data, config.dataFile);
	}

	static getServer(_id, newfilepath) { //get server by:
		let filepath = newfilepath ? newfilepath : config.guildFile; //if a path is specified, it's not server.json
		let file = DataManager.getFile(filepath);
		let server = file[_id]; //get the specific info for that server
		if (!server) { //if there's no data for that server
			server = new Server(_id);
			DataManager.setServer(server, filepath); //set it
			Logger.verbose('Server ' + server._id + ' has been logged in the database!');
		}
		return server; //and return the object
	}

	static setServer(newServer, newfilepath) {
		let filepath = newfilepath ? newfilepath : config.guildFile; //if a path is provided, use it
		let allServer = DataManager.getFile(filepath); //get the file (the meta object)
		let id = newServer._id || newServer.id;
		allServer[id] = newServer; //metaobject.id === the object
		DataManager.setFile(allServer, filepath); //and set it
	}

}

module.exports = DataManager;