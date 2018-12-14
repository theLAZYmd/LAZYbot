import Discord from 'discord.js';
import fs from 'fs';
import listeners from 'events'
import './extensions'

import DataManager from './util/datamanager';
import Logger from './util/logger';
import Ready from "./router/ready";

const {    token   } = DataManager.getFile("./src/token.json");
const router = "router/";

let client = new Discord.Client();
listeners.EventEmitter.prototype._maxListeners = 100;
process.on("unhandledRejection", Logger.error);

console.log("running in experimental mode");

const events = [
	["channelCreate", ["channel"]],
	["channelDelete", ["channel"]],
	["channelPinsUpdate", ["channel", "time"]],
	["channelUpdate", ["oldChannel", "newChannel"]],
	["clientUserGuildSettingsUpdate", ["clientUserGuildSettings"]],
	["clientUserSettingsUpdate", ["clientUserSettings"]],
	["debug", ["info"]],
	["disconnect", ["event"]],
	["emojiCreate", ["emoji"]],
	["emojiDelete", ["emoji"]],
	["emojiUpdate", ["oldEmoji", "newEmoji"]],
	["error", ["error"], true],
	["guildBanAdd", ["guild", "user"]],
	["guildBanRemove", ["guild", "user"]],
	["guildCreate", ["guild"]],
	["guildDelete", ["guild"]],
	["guildMemberAdd", ["member"], true],
	["guildMemberAvailable", ["member"]],
	["guildMemberRemove", ["member"]],
	["guildMembersChunk", ["member", "guild"]],
	["guildMemberSpeaking", ["member", "speaking"]],
	["guildMemberUpdate", ["oldMember", "newMember"]],
	["guildUnavailable", ["guild"]],
	["guildUpdate", ["oldGuild", "newGuild"]],
	["message", ["message"], true],
	["messageDelete", ["message"]],
	["messageDeleteBulk", ["messages"]],
	["messageReactionAdd", ["messageReaction", "user"], true],
	["messageReactionRemove", ["messageReaction", "user"]],
	["messageReactionRemoveAll", ["message"]],
    ["messageUpdate", ["oldMessage", "newMessage"]],
    ["presenceUpdate", ["oldMember", "newMember"], true],
	["reconnecting", []],
	["resume", ["replayed"]],
	["roleCreate", ["role"]],
	["roleDelete", ["role"]],
	["roleUpdate", ["oldRole", "newRole"]],
	["typingStart", ["channel", "user"]],
	["typingStop", ["channel", "user"]],
	["userNoteUpdate", ["user", "oldNote", "newNote"]],
	["userUpdate", ["oldUser", "newUser"]],
	["voiceStateUpdate", ["oldMember", "newMember"]],
	["warn", ["info"]]
];

fs.readdir("./src/" + router, async (err, _files) => {
    try {
        if (err) throw err;
        let files = _files.map(f => f.split(".").slice(0, -1).join("."));
        client.on("ready", async function () {
            await Ready(client);
        }) 
        for (let event of events) try {
            if (!event[2]) continue;
            if (!files.find(f => f === event[0])) throw "Couldn't find matching event handler.";
            client.on(event[0], async function () {
                let mod = await import("./" + router + event[0] + ".js");
                let Instance = mod.default;
                Instance(client, ...arguments);
            });
        } catch (e) {
            if (e) Logger.error(e);
        }
    } catch (e) {
        if (e) Logger.error(e);
    }
})

client.login(process.env.TOKEN ? process.env.TOKEN : token)