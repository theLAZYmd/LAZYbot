class Color {

	constructor() {}

	static randDecimal() {
		return parseInt(Color.randHex(), 16);
	}

	static randHex() {
		return Color.randRGB().map(n => n.toString());
	}

	static randRGB() {
		let arr = [];
		for (let i = 0; i < 2; i++) {
			arr[i] = randBetween(0, 255);
		}
		return arr;
	}

	static get regexes () {
		if (Color._regexes) return Color._regexes;
		return Color._regexes = {
			rgb: /^([0-9]{1,3})[,\s]+\s?([0-9]{1,3})[,\s]+?([0-9]{1,3})$/,
			hex: /^(?:0x|#)?([0-9a-f]{1,6})$/i,
			strings: /\w+/
		};
	}

	static get strings() {
		if (Color._strings) return Color._strings;
		return Color._strings = [
			'DEFAULT',
			'BLACK',
			'WHITE',
			'AQUA',
			'GREEN',
			'BLUE',
			'PURPLE',
			'LUMINOUS_VIVID_PINK',
			'GOLD',
			'ORANGE',
			'RED',
			'GREY',
			'NAVY',
			'DARK_AQUA',
			'DARK_GREEN',
			'DARK_BLUE',
			'DARK_PURPLE',
			'DARK_VIVID_PINK',
			'DARK_GOLD',
			'DARK_ORANGE',
			'DARK_RED',
			'DARK_GREY',
			'DARKER_GREY',
			'LIGHT_GREY',
			'DARK_NAVY',
			'BLURPLE',
			'GREYPLE',
			'DARK_BUT_NOT_BLACK',
			'NOT_QUITE_BLACK'
		];
	}
	
	get(searchstring, {
		disableStrings = false
	} = {}) {
		let color;
		if (searchstring) {
			if (!color) color = this.byRGB(searchstring);
			if (!color) color = this.byDecimal(searchstring);
			if (!color) color = this.byHex(searchstring);
			if (!color) color = this.byRandom(searchstring);
			if (!color && !disableStrings) color = this.byString(searchstring);
			if (!color) color = this.byNull(searchstring);
		}
		return color;
	}

	/**
	 * @param {string|string[]} rgbResolvable
	 * @returns {number[]?}
	 */
	byRGB(rgbResolvable) {
		if (!Color.regexes.rgb.test(rgbResolvable)) return undefined;
		return rgbResolvable.match(Color.regexes.rgb).slice(1).map(n => Number(n));
	}

	/**
	 * @param {string|string[]} rgbResolvable
	 * @returns {string}
	 */
	byHex(hexResolvable) {
		if (!Color.regexes.hex.test(hexResolvable)) return undefined;
		return hexResolvable.match(Color.regexes.hex)[1];
	}


	/**
	 * Checks if a value is a valid decimal number within the colour range 0 to (i=0,5)Σ 15 * (16 ^ i)
	 * @param {Number} num
	 * @returns {Number?}
	 */
	byDecimal(num) {
		if (isNaN(Number(num))) return undefined;
		let x = Number(num);
		if (x < 0 || x > 16777215) throw new RangeError('Numbers must be within 0 to 1677777215 range');
		return x;
	}

	/**
	 * Checks if color value is the string 'random', and generates a colour instead
	 * @param {string} colorResolvable
	 * @returns {null}
	 */
	byRandom(colorResolvable) {
		if (colorResolvable.toLowerCase() === 'random') return this.constructor.randDecimal();
		return undefined;
	}

	/**
	 * Checks if a string is on a known list value
	 * @param {string} str
	 * @returns {string?}
	 */
	byString(str) {
		if (!Color.regexes.strings.test(str)) return undefined;
		str = str.match(Color.regexes.strings)[0];
		if (Color.strings.indexOf(str.toUpperCase()) !== -1) return str.toUpperCase();
		return undefined;
	}

	/**
	 * Checks if color value is the string 'null', a valid color input for the Discord API
	 * @param {string} colorResolvable
	 * @returns {null}
	 */
	byNull(colorResolvable) {
		if (colorResolvable === 'null') return null;
		return undefined;
	}

}

module.exports = Color;

/**
 * Generates a random number within a range
 * @param {Number} min inclusive
 * @param {Number} max inclusive
 */
function randBetween(min, max) {
	return Math.floor(Math.random() * (max - min + 1) + min);
}



/**
 * Test Cases:

{
    "1": 1,
    "2": 2,
    "3": 3,
    "6": 6,
    "8": 8,
    "37": 37,
    "170": 170,
    "255": 255,
    "274": 274,
    "5703": 5703,
    "234983": 234983,
    "949039": 949039,
    "990099": 990099,
    "999099": 999099,
    "DARK_BLUE": "DARK_BLUE",
    "255, 0, 255": [
        255,
        0,
        255
    ],
    "green": "GREEN",
    "255 255 0": [
        255,
        255,
        0
    ],
    "1 0 1": [
        1,
        0,
        1
    ],
    "255 0 255": [
        255,
        0,
        255
    ],
    "#FF00FF": "FF00FF",
    "dark_green": "DARK_GREEN",
    "'DARK_ORANGE'": "DARK_ORANGE",
    "#FF5733": "FF5733",
    "#99FF66": "99FF66",
    "#F4D03F": "F4D03F",
    "255 35 58": [
        255,
        35,
        58
    ],
    "FF90FF": "FF90FF",
    "244, 208, 63": [
        244,
        208,
        63
    ]
}     
 */