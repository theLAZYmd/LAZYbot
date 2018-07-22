const Parse = require("../util/parse.js");
const Embed = require("../util/embed.js");
const config = require("../config.json");
const request = require('request');

class FEN extends Parse {

  constructor(message) {
    super(message)
  }

  run() {
    if(!this.fen) return this.Output.onError("Invalid FEN!");
    let Output = this.Output;
    let embed = this.embed;
    request(this.imageURL, function(error, response, body) {
      if(response.statusCode != "404") Output.sender(embed);
    })
  }

  /* The difficulty here is, not parsing the url to the analysis board, which thank to lichess is just some variant of their analysis url followed by the fen,
  But getting the url to display the board for chess.com and parsing and generating the specialiased variant info.
  That means the additional pieces for crazyhouse and the additional checks for threeCheck, then working out how to display them.
  this.fen returns the simple full fen.
  this.positionfen returns the the board position which for standard chess is the same as this.fen
  */

  get fenArray () {
    const fenRegExpString = 
      "((?:(?:[pnbrqkPNBRQK1-8]{1,8})\\/?){8})" + //Piece Placement: any of those characters, allow 1 to 8 of each, folloed by a slash, all that repeated 8 times. Standard chess FEN produced. Slash is optional (0 or 1).
      "\\s?" + //white space
      "((?:[pnbrqkPNBRQK]{1,8})\\/?)?" + //Second group: crazyhouse additional inhand pieces, if they exist.
      "\\s+" + //white space
      "(b|w)" + //Side to Move
      "\\s+" + //white space
      "(-|K?Q?k?q?)" + //Castling Rights. Matches 0 or 1 of each, so optional.
      "\\s+" + //white space
      "(-|[a-h][3-6])" + //En Passant Possible Target Squares
      "\\s+" + //white space
      "(\\d+)" + //Half-Move Clock since last capture or pawn advance for 50 move rule
      "\\s+" + //white space
      "(\\d+)" + //Fullmove number
      "\\s*" + //white space, may or may not exist
      "(\\+[0-3]\\+[0-3])?"; //three-check extra group, may or may not exist
    const regex = /((?:(?:[pnbrqkPNBRQK1-8]{1,8})\/?){8})\s?((?:[pnbrqkPNBRQK]{1,8})\/?)?\s+(b|w)\s+(-|K?Q?k?q?)\s+(-|[a-h][3-6])\s+(\d+)\s+(\d+)\s*(\+[0-3]\+[0-3])?/ //for syntax highlighting + copy/paste to debugger
    let fenRegExp = new RegExp(fenRegExpString);
    let fenArray = this.argument.match(fenRegExp);
    if(fenArray) return fenArray; //returns matches witch capture groups [full string, ...each () match group]
    return [];
  }

  get positionfenArray () { //array of 6 items, beginning at 0 ending with 5.
    let fenArray = this.fenArray.slice(1).clean(); //first exec match is always full match
    if(fenArray[0].endsWith("/")) fenArray[0] = fenArray[0].slice(0, -1); //removes extra backslash prone to messing shit up
    if(this.variant === "chess") return fenArray;
    if(this.variant === "crazyhouse") return fenArray.remove(1); //remove zh group
    if(this.variant === "threeCheck") return fenArray.remove(6); //remove threecheck group
  }

  get fen () {
    return this.fenArray[0];
  }

  get positionfen () {
    return this.positionfenArray.join(" ");
  }

  get flip () {
    return this.positionfenArray[1] === "b";
  }
  
  get variant () {
    if(this.inhand) return "crazyhouse";
    if(this.checks) return "threeCheck";
    return "chess";
  }

  get inhand () { //a crazyhouse thing
    if(!this.fenArray[2]) return "";
    let crazyhouseRegExp = /(?:[pnbrqkPNBRQK]{1,8})\/?/;
    let fen = this.fenArray[2].match(crazyhouseRegExp);
    fen[1] = fen[0].replace(/[^A-Z]/g, '');
    fen[2] = fen[0].replace(/[^a-z]/g, '');
    if(fen) return fen;
    else return "";
  }

  get checks () {
    if(!this.fenArray[8]) return "";
    let threeCheckRegExp = /\+([0-3])\+([0-3])/;
    let checks = this.fenArray[8].match(threeCheckRegExp);
    if(checks) return checks;
    else return "";
  }

  get description () {
    if(this.variant === "chess") return;
    let winhandstring, binhandstring;
    if(this.variant === "crazyhouse") {
      let winhand = this.inhand[1].split(""); //converts them to arrays of each character
      let binhand = this.inhand[2].split(""); //white in-hand pieces, black in-hand pieces
      for(let i = 0; i < winhand.length; i++) {
        winhand[i] = this.Search.getEmoji("white" + winhand[i].toLowerCase());
      };
      for(let i = 0; i < binhand.length; i++) {
        binhand[i] = this.Search.getEmoji("black" + binhand[i]);
      };
      winhandstring = winhand.join(" ");
      binhandstring = binhand.join(" ");
    } else
    if(this.variant === "threeCheck") {
      winhandstring = "White checks: " + "**+**".repeat(this.checks[1]);
      binhandstring = "Black checks: " + "**+**".repeat(this.checks[2]);
    };
    return this.flip ? winhandstring + "\n" + binhandstring : binhandstring + "\n" + winhandstring;
  }

  get hint () {
    return this.argument.replace(this.fen, "").trim();
  }

  get imageURL () {
    return config.url.fen.board.replace("|",
      "?fen=" + encodeURIComponent(this.positionfen) +
      "&board=" + config.fen.board +
      "&piece=" + config.fen.pieces +
      "&coordinates=" + config.fen.coords +
      "&size=" + config.fen.size +
      "&flip=" + (this.flip ? 1 : 0) +
      "&ext=.png"
    )
  }

  get analysisURL () { //encode for chess
    if(this.variant === "chess") return config.url.fen.analysis.replace("|", encodeURIComponent(this.fen));
    else return config.url.fen[this.variant].replace("|", this.fen.replace(/\s+/g, "_"))
  } //as is with modified spaces for variants

  get embed () {
    let embed = {
      "title": (this.flip ? "Black" : "White") + " to move." + (this.hint ? " " + this.hint : ""),
      "url": this.analysisURL,
      "image": Embed.image(this.imageURL)
    };
    if(this.variant !== "chess") embed.description = this.description;
    return embed;
  }

}

module.exports = FEN;

Array.prototype.remove = function(index) {
  if(!index && index !== 0) return;
  if(Array.isArray(index)) {
    index.sort(function(a, b) {
      return b - a;
    })
    for(let i = 0; i < index.length; i++) {;
      this.splice(index[i], 1);
    }
  } else {
    this.splice(index, 1);
  }
  return this;
}

Array.prototype.clean = function() {
  for(let i = 0; i < this.length; i++) {
    if(!this[i]) {
      this.splice(i, 1);
      i--;
    }
  }
  return this;
}