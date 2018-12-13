/* Built by @theLAZYmd
 * Derived from experience from the experience of what methods might be useful to call straight from a string
 * Formatting methods are designed for markdown or for displaying front-end
 * Note that iterating over the properties of these prototypes with for(... in...) will therefore bring up unwanted results
 */

//STRING PROTOTYPE METHODS

String.prototype.toProperCase = function () { //Sets All Words In The String To Have First Letter Capitalised
	let words = this.split(/ +/g);
	let newArray = [];
	for (let i = 0; i < words.length; i++) {
		newArray[i] = words[i][0].toUpperCase() + words[i].slice(1, words[i].length).toLowerCase();
	}
	let newString = newArray.join(" ");
	return newString;
};

String.prototype.reverse = function () { //reverses a string
    return this.split("").reverse().join("");
};

String.prototype.url = function (link) { //converts texts to have a link for markdown
    if (!/(https?:\/\/[\S\.]+\.\w+\/?)\s?/.test(link)) return this;
    return "[" + this + "](" + link + ")";
}

String.prototype.bold = function () { //bolds text for markdown
	if (this.length > 0) return "**" + this + "**";
	return "";
};

String.prototype.format = function (type = "") { //adds a codeblock for markdown
	if (this.length > 0) return "```" + type.replace(/```/g, "\\`\\`\\`") + "\n" + this + "```";
	return "";
};

String.prototype.parseTime = function (units = ["hours", "minutes", "seconds"]) { //checks for time units in a given string
    return units.map((u) => {
        let regex = new RegExp("\\b([0-9])+\\s*h(?:ours?)?\\b");
        if (!regex.test(u)) return null;
        return Number(u.match(regex)[1]);
    })
};

String.prototype.occurrences = function (subString, allowOverlapping = false) { //occurrences of a substring
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

//ARRAY PROTOTYPE METHODS

Array.prototype.toPairs = function (bold = false, constant = "") { //returns an array concatenated to a "key: value\n" format
    return array.map((entry) => {
        if (Array.isArray(entry)) {
            let [k, v] = entry;
            return k + ": " + (bold ? v.bold() : v)
        } else
        if (/string|number/.test(typeof entry)) {
            return constant + (bold ? entry.bold() : entry);
        }
    }).join("\n");
};

Array.prototype.toRank = function(startAt) { //returns an array concatenated to a "#1 item1" format
    let string = "";
    for (let i = 0; i < this.length; i++) {
        string += ("#" + (i + startAt)).bold() + " " + this[i] + (i < this.length + 1 ? "\n" : "");
    }
    return string;
};

Array.prototype.toLeaderboard = function(page = 0, pagekey = 9, inline = true) { //see explanation at bottom
    let startAt = 1 + page * pagekey;
    let i = this.findIndex(entry => entry[1]);
    if (i === -1) i = this.length;
    let j = -1;    
    let description = this.slice(0, i).toRank(startAt);
    let fields = this.slice(i).map(([k, v]) => {
        j++;
        return [`#${i + j + startAt} ${k} `, v, inline].toField(i);
    });
    return { description, fields };
};

Array.prototype.toField = function () { //returns an array formatted as a 'Field Object' for a Discord embed
    let [name, value, inline] = this;
    return {  name, value, inline };
};

Array.prototype.toProperCase = function () { //does String.prototype.toProperCase() on every element in an array
	for (let i = 0; i < this.length; i++)
		this[i] = this[i].toProperCase();
	return this;
};

Array.prototype.shuffle = function () { //Fisher-Yates shuffle algorithm for javascript
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

Array.prototype.validate = async function () { //parse to mathematical inputs: numbers and booleans
    for (let [i, item] of Object.entries(this)) {
        if (typeof item !== "string") continue;
        item = item.trim();
        if (item === "true") this[i] = true;
        else if (item === "false") this[i] = false;
        this[i] = Number(item);
        if (isNaN(item)) throw "Invalid inputs to operation!";
    }
    return this;
};

Array.prototype.findd = function (f) { //Array.prototype.find() but the function is run for all members of the array. Useful for when there's a running variable that gets changed with each iteration.
    let array = this.filter(f);
    return array.length > 0 ? array.pop() : null;
}

Array.prototype.inArray = function (string) { //same as Array.prototype.indexOf() !== -1 but allows for 'close' matches, i.e. lowercase letters with some punctuation
	let regex = /[a-z_$£@!.?]/gi;
	for (let i = 0; i < this.length; i++) {
		if ((string.match(regex) || []).join("").toLowerCase() === (this[i].match(regex) || []).join("").toLowerCase()) return true;
	}
	return false;
};

Array.prototype.findIndex = function (f) { //same as Array.prototype.find() but returns an index. Like if .indexOf() took a function
    if (typeof f !== "function") return -1;
    for (let i = 0; i < this.length; i++) {
        if (f(this[i])) {
            return i;
        }
    }
    return -1;
};

Array.prototype.findIndexes = function (f) { //same as Array.prototype.findIndexes() but returns all matching indexes
    if (typeof f !== "function") return [];
	let indexes = [];
	for (let i = 0; i < this.length; i++) {
		if (f(this[i])) {
			indexes.push(i)
		}
	}
	return indexes;
};

Array.prototype.indexesOf = function (str) { //same as Array.prototype.indexOf() but returns all matching indexes
    let arr = [];
    let currValue = 0;
    while (this.indexOf(str) !== -1) {
        currValue = this.indexOf(str, currValue);
        arr.push(currValue);
    }
    return arr;
}

Array.prototype.swap = function (dbindex1, dbindex2) { //swaps two elements in an array
	let dummy = this[dbindex1];
	this[dbindex1] = this[dbindex2];
	this[dbindex2] = dummy;
	return this;
};

Array.prototype.clean = function () { //removes null or undefined values from an array
	for (let i = 0; i < this.length; i++) {
		if (this[i] === null || this[i] === undefined) {
			this.splice(i, 1);
			i--;
		}
	}
	return this;
};

Array.prototype.remove = function (index) { //remove an index or a set of indexes from an Array. Same as this.splice(index, 1) but allows for multi-index functionality
	if (index === 0) return;
	if (Array.isArray(index)) {
		for (let i of index.sort((a, b) => b - a)) {
			this.splice(i, 1);
		}
	} else {
		this.splice(index, 1);
	}
	return this;
};

//OBJECT PROTOTYPE METHODS

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

//NUMBER PROTOTYPE METHODS

Number.prototype.round = function (places) {
    (Math.round(this * Math.pow(10, places)) / Math.pow(10, places));
    return this;
};

Number.prototype.toSign = function () {
	if (this > 0) return "+" + Math.round(this);
	return Math.round(this).toString();
};

//DATE PROTOTYPE METHODS

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

//MATHS PROTOTYPE METHODS

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

/*
VALID Array.prototype.toPairs INPUT FORMATS {

    returns a string

    TYPE 1:
    a double array, each item in outer array is an array of three parts: the title, the value, and whether it is inline or not.
    skip a line between each for clarity.
    ex:
    [
        ["a.k.a.", this.aliases, false],
        [(this.dbuser.modverified ? " " + this.Search.emojis.get(this.dbuser.modverified[0]) : "") + "Info", this.info, true],
        ["Joined Date", this.joined, this.info ? true: false],
        ["Index", this.ids, this.dbuser.messages ? true : false],
        ["Messages Sent", this.dbuser.messages.toLocaleString(), true],
        ["Last Message", this.lastMessage, false],
        ["House Trophies", this.award, true]
    ]

    and this returns basically a string

    TYPE 2:
    a single array! Each item in the array is a new line.
    requires a "data.constant"!
    each line is made up of:
    ${data.constant}: value
    with bolding around the value if specified.
}
*/

/*
VALID Array.prototype.toLeaderboard INPUT FORMATS:

    array input is a double array, each item in outer array has two options:
    either it is [itemtitle, itemdescription]
    or it is [itemdescription].
    dictates the cases

    page determines what numbers to use. it's always 9 consective numbers, multiplied by page, +1.
    To change whether it is 9 or not, use a _pagekey value

    inline applies to case 1 fields.
    Case 1 (and 3 bottom half) fields are inline by default.
    To produce a leaderboard with non-inline (i.e. vertical column) fields, have third argument false.

    For example: CASE 1 FIELDS
    [
        ["supunay#6696 (312485288150827010), 20 :cherry_blossom: for invitinig arsenic 33"],
        ["supunay#6696 (312485288150827010), 32 :cherry_blossom: for https://lichess.org/tournament/qUXhP7Hg"],
        ["supunay#6696 (312485288150827010), 32 :cherry_blossom: for https://lichess.org/tournament/qUXhP7Hg"]
    ]
    will return an embed that looks like this:
    "fields": [
        {
        "name": "#1 supunay#6696 (312485288150827010)",
        "value": "20 :cherry_blossom: for invitinig arsenic 33",
        "inline": false
        },
        {
        "name": "#2 supunay#6696 (312485288150827010)",
        "value": "32 :cherry_blossom: for https://lichess.org/tournament/qUXhP7Hg",
        "inline": false
        },
        {
        "name": "#2 supunay#6696 (312485288150827010)",
        "value": "32 :cherry_blossom: for https://lichess.org/tournament/qUXhP7Hg",
        "inline": false
        }
    ]
    which looks very neat, but on the other hand is space-limited by the 2000 character limit.

    On the other hand, an array looking like this: CASE 2 DESCRIPTION
    [
        ["Vempele 2646"],
        ["schaker 2643"],
        ["Mugwort 2559"],
        ["MMichael 2556"],
        ["penguingm1 2530"],
        ["mastertan 2493"],
        ["schwinggggg 2452"],
        ["MeneerMandje 2449"],
        ["TcubesAK 2445"],
        ["titsinablender 2433"]
    ]
    will return an embed description that looks like this:
    "#1 Vempele 2646\n" +
    "#2 schaker 2643\n" +
    "#3 Mugwort 2559\n" +
    "#4 MMichael 2556\n" +
    "#5 penguingm1 2530\n" +
    "#6 mastertan 2493\n" +
    "#7 schwinggggg 2452\n" +
    "#8 MeneerMandje 2449\n" +
    "#9 TcubesAK 2445\n" +
    "#10 titsinablender 2433"
    Which is space efficient, but less customisation with the titles.

    An array can contain both, in which case the leaderboard will be parsed for description to the extent that an array[i][1] is detected.
    For instance: CASE 3 MIXED
    [
        ["Revamp LAZYbot to use classes!"],
        ["Add voting features"],
        ["Optimise classes"],
        ["Submitted by chuckmoulton#2381", "Set default bug source to chess.com"],
        ["Submitted by TheLoneWolf#4001", "Set 'mod' role to Admin."],
        ["Set nowplaying() listeners to accept twitch streams"],
        ["Add twitch streamers to profiles"],
        ["Submitted by titsinablender#1754", "Eighth place is best place."]
    ]
    will produce an embed that looks like this:
    {
        "description":
        "#1 Revamp LAZYbot to use classes!\n" +
        "#2 Add voting features\n" +
        "#3 Optimise classes",
        "fields": [
        {
            "name": "#4 Submitted by chuckmoulton#2381",
            "value": "Set default bug source to chess.com",
            "inline": false
        },
        {
            "name": "#5 Submitted by TheLoneWolf#4001",
            "value": "Set 'mod' role to Admin.",
            "inline": false
        },
        {
            "name": "#6",
            "value": "Set nowplaying() listeners to accept twitch streams",
            "inline": false
        },
        {
            "name": "#7",
            "value": "Add twitch streamers to profiles",
            "inline": false
        },
        {
            "name": "#8 Submitted by titsinablender#1754",
            "value": "Eighth place is best place.",
            "inline": false
        },
        ]
    }

    So hope this makes it memorable now.
    Double embeds can be annoying and complicated so make sure to include line breaks to add clarity and well-formatted for(let loops.
*/