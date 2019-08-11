const Logger = require('../util/logger');

module.exports = async (client, e) => {
	try {
		if (e && e.message) Logger.error(e.message);
	} catch (e) {
		if (e) Logger.error(e);
	}
};