const Logger = require('../util/logger');

module.exports = async (client, e) => {
	try {
		if (e && e.message) Logger.error(e.message);
		await Logger.log('Destroying client...');
		await client.destroy();
		await Logger.log('Client successfully destroyed!');
		await Logger.log('Re-establishing a webconnection...');
		await client.login(require('../token.json').token);
		await Logger.log('Webconnection successfully established!');
	} catch (e) {
		if (e) Logger.error(e);
	}
};