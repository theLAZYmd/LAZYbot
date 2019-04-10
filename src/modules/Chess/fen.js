const Parse = require('../../util/parse');
const Embed = require('../../util/embed');
const config = require('../../config.json');
const rp = require('request-promise');
const qs = require('querystring');

class FEN extends Parse {

	static get regexString () {
		return '((?:(?:[pnbrqkPNBRQK1-8]{1,8})\\/?){8})' + //Piece Placement: any of those characters, allow 1 to 8 of each, folloed by a slash, all that repeated 8 times. Standard chess FEN produced. Slash is optional (0 or 1). 
            '((?:[pnbrqkPNBRQK]{1,16})\\/?)?' + //Second group: crazyhouse additional inhand pieces, if they exist.
            '\\s+' + //white space
            '(b|w)' + //Side to Move
            '\\s+' + //white space
            '(-|K?Q?k?q?)' + //Castling Rights. Matches 0 or 1 of each, so optional.
            '\\s+' + //white space
            '(-|[a-h][3-6])' + //En Passant Possible Target Squares
            '\\s+' + //white space
            '(\\d+)' + //Half-Move Clock since last capture or pawn advance for 50 move rule
            '\\s+' + //white space
            '(\\d+)' + //Fullmove number
            '\\s*' + //white space, may or may not exist
            '(\\+[0-3]\\+[0-3])?'; //three-check extra group, may or may not exist
	}

	static get regex () {
		if (FEN._regex) return FEN._regex;
		//const regex = /((?:(?:[pnbrqkPNBRQK1-8]{1,31})\/?){8})\s?((?:[pnbrqkPNBRQK]{1,16})\/?)?\s+(b|w)\s+(-|K?Q?k?q?)\s+(-|[a-h][3-6])\s+(\d+)\s+(\d+)\s*(\+[0-3]\+[0-3])?/; //for syntax highlighting + copy/paste to debugger
		return FEN._regex = new RegExp(FEN.regexString);
	}

	constructor(message, argument) {
		super(message);
		this.a = argument || this.argument;
	}

	async run() {
		if (!this.fen) return this.Output.onError('Invalid FEN!');
		let Output = this.Output;
		let embed = this.embed;
		if (await rp.get(this.imageURL)) Output.sender(embed);
	}

	/* The difficulty here is, not parsing the url to the analysis board, which thank to lichess is just some variant of their analysis url followed by the fen,
	But getting the url to display the board for chess.com and parsing and generating the specialiased variant info.
	That means the additional pieces for crazyhouse and the additional checks for threeCheck, then working out how to display them.
	this.fen returns the simple full fen.
	this.positionfen returns the the board position which for standard chess is the same as this.fen
	*/

	get fenArray() {
		if (this._fenArray) return this._fenArray;
		let fenArray = this.a.match(FEN.regex);
		return this._fenArray = fenArray || []; //returns matches witch capture groups [full string, ...each () match group]
	}

	get positionfenArray() { //array of 6 items, beginning at 0 ending with 5.
		let fenArray = this.fenArray.slice(1).clean(); //first exec match is always full match
		if (fenArray[0].endsWith('/')) fenArray[0] = fenArray[0].slice(0, -1); //removes extra backslash prone to messing shit up
		if (this.variant === 'crazyhouse') return fenArray.remove(1); //remove zh group
		if (this.variant === 'threeCheck') return fenArray.remove(6); //remove threecheck group
		return fenArray;
	}

	get fen() {
		return this.fenArray[0];
	}

	get positionfen() {
		return this.positionfenArray.join(' ');
	}
    
	get colour () {
		if (this.positionfenArray[1] === 'b') return 'black';
		return 'white';
	}

	get flip() {
		if (this._flip) return this._flip;
		if (this.variant === 'racing-kings') return false;
		return this._flip = this.colour === 'black';
	}

	get variant() {
		if (this._variant) return this._variant;
		if (this.inhand) return this._variant = 'crazyhouse';
		if (this.checks) return this._variant = 'threeCheck';
		if (this.channel && this.channel.name.match(/[a-z]/gi).join('').toLowerCase() === 'racingkings') return this._variant = 'racing-kings';
		return this._variant = 'chess';
	}

	get inhand() { //a crazyhouse thing
		if (!this.fenArray[2]) return undefined;
		let crazyhouseRegExp = /(?:[pnbrqkPNBRQK]{1,16})\/?/;
		let fen = this.fenArray[2].match(crazyhouseRegExp);
		fen[1] = fen[0].replace(/[^A-Z]/g, '');
		fen[2] = fen[0].replace(/[^a-z]/g, '');
		return fen || '';
	}

	get checks() {
		if (this._checks) return this._checks;
		if (!this.fenArray[8]) return '';
		let threeCheckRegExp = /\+([0-3])\+([0-3])/;
		let checks = this.fenArray[8].match(threeCheckRegExp).map(c => !isNaN(Number(c)) ? Number(c) : c);
		return this._checks = checks || [this.fenArray[8], 0, 0];
	}

	get description() {
		if (!/^crazyhouse|threeCheck$/.test(this.variant)) return '';
		let winhandstring, binhandstring;
		if (this.variant === 'crazyhouse') {
			let winhand = this.inhand[1].split(''); //converts them to arrays of each character
			let binhand = this.inhand[2].split(''); //white in-hand pieces, black in-hand pieces
			for (let i = 0; i < winhand.length; i++) {
				winhand[i] = this.Search.emojis.get('white' + winhand[i].toLowerCase());
			}
			for (let i = 0; i < binhand.length; i++) {
				binhand[i] = this.Search.emojis.get('black' + binhand[i]);
			}
			winhandstring = winhand.join(' ');
			binhandstring = binhand.join(' ');
		} else if (this.variant === 'threeCheck') {
			winhandstring = 'White checks: ' + ('+'.repeat(this.checks[1]) || '').bold();
			binhandstring = 'Black checks: ' + ('+'.repeat(this.checks[2]) || '').bold();
		}
		return this.flip ? winhandstring + '\n' + binhandstring : binhandstring + '\n' + winhandstring;
	}

	get hint() {
		return this.a.replace(this.fen, '').replace(this.puzzleURL || '', '').trim() + (this.lastMove ? '\n' + this.lastMove : '');
	}
    
	get lastMove() {
		return null;
	}

	get imageURL() {
		return config.fen.url.board.replace('|', '?' + qs.stringify({
			fen: encodeURIComponent(this.positionfen),
			board: config.fen.board,
			piece: config.fen.pieces,
			coordinates: config.fen.coords,
			size: config.fen.size, 
			flip: this.flip ? 1 : 0,
			ext: '.png'
		}));
	}
    
	get puzzleURL() {
		if (this._puzzleURL) return this._puzzleURL;
		for (let s of Object.values(config.sources)) {
			if (!s.url || !s.url.puzzle) continue;
			let u = s.url.puzzle.replace(/\//g, '\\/').replace('|', '([0-9]+)');
			let regex = new RegExp(u);
			if (regex.test(this.a)) return this.a.match(regex)[0];
		}
		return null;
	}

	get analysisURL() { //encode for chess
		if (!/^threeCheck|crazyhouse$/.test(this.variant)) return config.fen.url.analysis.replace('|', encodeURIComponent(this.fen));
		else return config.fen.url[this.variant].replace('|', this.fen.replace(/\s+/g, '_'));
	} //as is with modified spaces for variants

	get embed() {
		let embed = new Embed()
			.setTitle((this.colour === 'black' ? 'Black' : 'White') + ' to move.' + (this.hint ? ' ' + this.hint : ''))
			.setURL(this.puzzleURL || this.analysisURL)
			.setImage(this.imageURL)
			.setDescription(this.description);
		return embed;
	}

}

module.exports = FEN;