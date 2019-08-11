require('dotenv').config();
require('./util/extensions');
require('events').EventEmitter.prototype._maxListeners = 100;

const Discord = require('discord.js');
const fs = require('fs');
const path = require('path');
const client = new Discord.Client();

const Logger = require('./util/logger');
process.on('unhandledRejection', (e) => {
	if (e.message === 'Something took too long to do.') client.emit('error', e);
	Logger.error(e);
});

const events = [
	['channelCreate', ['channel']],
	['channelDelete', ['channel']],
	['channelPinsUpdate', ['channel', 'time']],
	['channelUpdate', ['oldChannel', 'newChannel']],
	['clientUserGuildSettingsUpdate', ['clientUserGuildSettings']],
	['clientUserSettingsUpdate', ['clientUserSettings']],
	['debug', ['info']],
	['disconnect', ['event']],
	['emojiCreate', ['emoji']],
	['emojiDelete', ['emoji']],
	['emojiUpdate', ['oldEmoji', 'newEmoji']],
	['error', ['error'], true],
	['guildBanAdd', ['guild', 'user']],
	['guildBanRemove', ['guild', 'user']],
	['guildCreate', ['guild']],
	['guildDelete', ['guild']],
	['guildMemberAdd', ['member'], true],
	['guildMemberAvailable', ['member']],
	['guildMemberRemove', ['member'], true],
	['guildMembersChunk', ['member', 'guild']],
	['guildMemberSpeaking', ['member', 'speaking']],
	['guildMemberUpdate', ['oldMember', 'newMember'], true],
	['guildUnavailable', ['guild']],
	['guildUpdate', ['oldGuild', 'newGuild']],
	['interval', ['cmdInfo'], true],
	['message', ['message'], true],
	['messageDelete', ['message']],
	['messageDeleteBulk', ['messages']],
	['messageReactionAdd', ['messageReaction', 'user'], true],
	['messageReactionRemove', ['messageReaction', 'user']],
	['messageReactionRemoveAll', ['message']],
	['messageUpdate', ['oldMessage', 'newMessage']],
	['presenceUpdate', ['oldMember', 'newMember'], true],
	['ready', [], true],
	['reconnecting', []],
	['resume', ['replayed']],
	['roleCreate', ['role']],
	['roleDelete', ['role']],
	['roleUpdate', ['oldRole', 'newRole']],
	['typingStart', ['channel', 'user']],
	['typingStop', ['channel', 'user']],
	['userNoteUpdate', ['user', 'oldNote', 'newNote']],
	['userUpdate', ['oldUser', 'newUser']],
	['voiceStateUpdate', ['oldMember', 'newMember']],
	['warn', ['info']]
];

/**
 * Interpreted requirements
 * For each event in the abbove list which is marked as true, set a listener
 * Find the function to execute on event emit of that listener in the src/router folder
 * So each file is only called when that listener is set
 */
fs.readdir(path.join(process.cwd(), 'src', 'router'), (err, _files) => {
	try {
		if (err) throw err;
		let files = _files.map(f => f.split('.').slice(0, -1).join('.'));
		for (let event of events) try {
			if (!event[2]) continue;
			if (!files.find(f => f === event[0])) throw 'Couldn\'t find matching event handler.';
			client.on(event[0], async function () {
				let Instance = require(path.join(__dirname, 'router', event[0]));
				if (typeof Instance === 'function') Instance(client, ...arguments);
				else if (typeof Instance === 'object' && typeof Instance.default === 'function') Instance.default(client, ...arguments);
				else throw 'event ' +  event[0] + ' does not have a listener function';
			});
		} catch (e) {
			if (e) Logger.error(e);
		}
	} catch (e) {
		if (e) Logger.error(e);
	}
});

client.login(process.env['TOKEN' + (process.env.instance ? '_' + process.env.instance : '')]);
require('./app/server');

module.exports = client;