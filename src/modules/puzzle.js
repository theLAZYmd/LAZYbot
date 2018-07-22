const Parse = require("./parse.js");
const Embed = require("../util/embed.js");

class Puzzle extends Parse {

  constructor(message) {
    super(message)
  }
  
  add(message, argument, author, channel) {
    let imageurl = "";
    let url = argument.match(/(https?:\/\/[\S\.]+\.\w+\/?)\s?/);
    if(url) {
      imageurl = url[0]; //is there a url attached? if so, that's the puzzle picture
    } else
    if(message.attachments.first()) { //but if there's an image attached, have that as the puzzle picture
      imageurl = message.attachments.first().url //in the form of a url
    } else return this.Output.onError(`Incorrect format! No link or image provided.`); //otherwise return
    let puzzle = {
      "authorid" : author.id, //18 digit discord code
      "title" : `${author.tag} #${channel.name}`, //Puzzle by theLAZYmd#2353 for #zh
      "description" : argument ? argument : "\u200b",
      "image" : Embed.image(imageurl)
    };
    if(!Puzzle.stored) Puzzle.stored[0] = puzzle;
    else Puzzle.stored.push(puzzle); //pushh it to the stored array
    puzzle.content = this.Search.getRole("puzzles") + ""; //ping puzzles when posted
    this.Output.sender(puzzle);
  }

  view(fetchboolean) {
    return new Promise((resolve, reject) => { //so that awaitMessages can be used on it when fetching
      let array = [];
      for(let i = 0; i < Puzzle.stored.length; i++) {
        array[i] = [];
        array[i][0] = Puzzle.stored[i].title;
        array[i][1] = Puzzle.stored[i].description;
      }; //[[theLAZYmd#2353 #zh, link], ...]
      let embedoutput = Embed.leaderboard(array, 0, false); //generates fields probably
      embedoutput.title = "Active Puzzles. " + fetchboolean ? "Type the index of the puzzle you would like to view below." : "Use `!puzzle [index]` to view a puzzle."; //informs about the await
      this.message.delete(); //deletes unnecessary command message
      this.Output.sender(embedoutput)
      .then(message => resolve(message));
    })
  }

  fetch(args) {
    if(args.length === 1) {
      this.fetchfromindex(Number(args[0]) - 1); //if '!puzzle 0' take args[0] as index
    } else 
    if(args.length === 0) {
      this.view(true) //if no arguments, post list of puzzles then wait for an index
      .then(originalmessage => {
        originalmessage.delete(10000)
      })
      let filter = msg => msg.author.id === message.author.id && !isNaN(Number(msg.content));
      this.message.channel.awaitMessages(filter, {
        max: 1,
        time: 30000,
        errors: ['time']
      })
      .then(collected => this.fetchfromindex(Number(collected.first().content) - 1))
    }
  }

  fetchfromindex(index) {
    let puzzle = Puzzle.stored[index];
    if(!puzzle) return this.Output.onError("No puzzle found!", this.message.channel); //if the index is wrong, return
    else {
      let embed = puzzle;
      delete embed.content; //otherwise, without the pinging subs
      this.Output.sender(embed); //post the puzzle
      this.message.delete();
    }
  }

  close(args) {
    if(args.length !== 1) return;
    let puzzle = Puzzle.stored[Number(args[0]) - 1];
    if(!puzzle) {
      this.Output.onError("No puzzle found!");
      return;
    } else 
    if(puzzle.authorid !== message.author.id) return this.Output.onError("You did not create this puzzle!"); //check that person created the puzzle
    else {
      Puzzle.stored.remove(puzzleindex); //use it using array remover
      Output.generic(`**${this.message.author.tag}** successfully closed puzzle number ${puzzleindex + 1}.`)
      this.message.delete();
    }
  }
  
}

Puzzle.stored = [];

module.exports = Puzzle;

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