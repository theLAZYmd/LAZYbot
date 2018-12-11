//the permanent requires that access data files or modules
const Discord = require("discord.js");
const config = require("./config.json");
const fs = require("fs");
const client = new Discord.Client();

const Logger = require("./util/logger.js");
const router = "router/";

require('events').EventEmitter.prototype._maxListeners = 100;
process.on("unhandledRejection", Logger.error);

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
	["ready", [], true],
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

fs.readdir("./src/" + router, (err, _files) => {
    try {
        if (err) throw err;
        let files = _files.map(f => f.split(".").slice(0, -1).join("."));
        for (let event of events) try {
            if (!event[2]) continue;
            if (!files.find(f => f === event[0])) throw "Couldn't find matching event handler.";
            client.on(event[0], async function () {
                let Instance = require("./" + router + event[0] + ".js");
                Instance(client, ...arguments);
            });
        } catch (e) {
            if (e) Logger.error(e);
        }
    } catch (e) {
        if (e) Logger.error(e);
    }
})

client.login(process.env.TOKEN ? process.env.TOKEN : require("./token.json").token)

//PROTOTYPE MODIFIERS

String.prototype.occurrences = function (subString, allowOverlapping) {
	subString += "";
	if (subString.length <= 0) return (this.length + 1);
	let n = 0;
	let position = 0;
	let step = allowOverlapping ? 1 : subString.length;
	while (true) {
		position = this.indexOf(subString, position);
		if (position >= 0) {
			++n;
			position += step;
		} else break;
	}
	return n;
};

String.prototype.toProperCase = function () {
	let words = this.split(/ +/g);
	let newArray = [];
	for (let i = 0; i < words.length; i++) {
		newArray[i] = words[i][0].toUpperCase() + words[i].slice(1, words[i].length).toLowerCase();
	}
	let newString = newArray.join(" ");
	return newString;
};

String.prototype.bold = function () {
	if (this.length > 0) return "**" + this + "**";
	return "";
};

String.prototype.format = function (type = "") {
	if (this.length > 0) return "```" + type + "\n" + this + "```";
	return "";
};

Array.prototype.findd = function (f) {
    let array = this.filter(f);
    return array.length > 0 ? array.pop() : null;
}

Array.prototype.inArray = function (string) {
	let regex = /[a-z_$£@!.?]/gi;
	for (let i = 0; i < this.length; i++) {
		if ((string.match(regex) || []).join("").toLowerCase() === (this[i].match(regex) || []).join("").toLowerCase()) return true;
	}
	return false;
};

Array.prototype.findAllIndexes = function (conditions) {
	let indexes = [];
	for (let i = 0; i < this.length; i++) {
		if (conditions(this[i])) {
			indexes.push(i)
		}
	}
	return indexes;
};

Array.prototype.swap = function (dbindex1, dbindex2) {
	let user = this[dbindex1];
	this[dbindex1] = this[dbindex2];
	this[dbindex2] = user;
	return this;
};

Array.prototype.toProperCase = function () {
	for (let i = 0; i < this.length; i++)
		this[i] = this[i].toProperCase();
	return this;
};

Array.prototype.clean = function () {
	for (let i = 0; i < this.length; i++) {
		if (!this[i]) {
			this.splice(i, 1);
			i--;
		}
	}
	return this;
};

Array.prototype.shuffle = function () {
	let currentIndex = this.length,
		temporaryValue, randomIndex;
	while (0 !== currentIndex) { // while there remain elements to shuffle...
		randomIndex = Math.randBetween(0, currentIndex); // pick a remaining element...
		currentIndex--;
		temporaryValue = this[currentIndex]; // and swap it with the current element.
		this[currentIndex] = this[randomIndex];
		this[randomIndex] = temporaryValue;
	}
	return this.clean();
};

Array.prototype.remove = function (index) {
	if (index === 0) return;
	if (Array.isArray(index)) {
		index.sort(function (a, b) {
			return b - a;
		});
		for (let i = 0; i < index.length; i++) {
			this.splice(index[i], 1);
		}
	} else {
		this.splice(index, 1);
	}
	return this;
};

Object.prototype._getDescendantProp = function (desc) {
	let arr = desc.split('.'), obj = this;
	while (arr.length) {
		obj = obj[arr.shift()];
	}
	return obj;
};

Object.prototype._setDescendantProp = function (desc, value) {
	let arr = desc.split('.'), obj = this;
	while (arr.length > 1) {
		obj = obj[arr.shift()];
	}
	return obj[arr[0]] = value;
};

Number.prototype.toSign = function () {
	if (this > 0) return "+" + Math.round(this);
	return Math.round(this).toString();
};

Date.prototype.getUTCDays = function () {
	return Math.floor(this.getTime() / 86400000);
};

Date.getTime = function (ms) {
	let time = new Date(ms);
	time.days = time.getUTCDays();
	time.hours = time.getUTCHours();
	time.minutes = time.getUTCMinutes();
	time.seconds = time.getUTCSeconds();
	time.milliseconds = time.getUTCMilliseconds();
	return time;
};

Date.getISOtime = function (ms) {
	return Date.getTime(ms).toString().slice(0, 31);
};

Date.getMonth = function (ms) {
	let string = Date.getTime(ms).toString();
	return string.slice(4, 7) + " " + string.slice(11, 15);
};

Math.randBetween = function (min, max) {
	return Math.floor(Math.random() * (max - min + 1) + min);
};

Math.genRange = function (number) {
	let range = [];
	for (let i = 0; i < number; i++) {
		range.push(i + 1);
	}
	return range;
};

Math.genRandomList = function (number, independentvariables) {
	let range = Math.genRange(number); //[1, 2, 3, 4, 5] up to number
	let randomrange = [];
	let limit = independentvariables ? Math.randBetween(0, number) : number; //length of randomrange is independent from number of voters
	for (let i = 0; i < limit; i++) {
		let randIndex = Math.randBetween(0, range.length - 1); //extract a random number from the array
		randomrange.push(range.splice(randIndex, 1)[0]); //and push it, reducing the number of the original arrray
	}
	return randomrange; //[4, 2, 3]
};