const fs = require("fs");

function DataManager(filepath) {
	this.filepath = filepath;
}
DataManager.prototype.getData = function(newfilepath) {
	return JSON.parse(fs.readFileSync(newfilepath ? newfilepath : this.filepath, "utf8"));
};
DataManager.prototype.setData = function(data, newfilepath) {
	fs.writeFileSync(newfilepath ? newfilepath : this.filepath, JSON.stringify(data, null, 4));
};

module.exports = DataManager;