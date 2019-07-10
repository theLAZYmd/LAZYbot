const Logger = require('../util/logger');

module.exports = async (client, e) => {
	try {
		if (e && e.message) Logger.error(e.message);
		await Logger.verbose('Destroying client...');
		await client.destroy();
		await Logger.verbose('Client successfully destroyed!');
		await Logger.verbose('Re-establishing a webconnection...');
		await client.login(require('../token.json').token);
		await Logger.verbose('Webconnection successfully established!');
	} catch (e) {
		if (e) Logger.error(e);
	}
};