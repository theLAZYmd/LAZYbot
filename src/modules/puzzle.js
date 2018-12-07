const Parse = require("../util/parse.js");
const Embed = require("../util/embed.js");
const config = require("../config.json");
const rp = require("request-promise");
const FEN = require("./fen.js");

class P {
    constructor (imageURL, argument, channel, author) {
        this.authorid = author.id;
        this.title = `${author.tag} #${channel.name}`;
        this.description = argument || "\u200b";
        this.image = imageURL;
        this.dateAdded = Date.now();
    }
}

class Puzzle extends Parse {

    constructor(message) {
        super(message);
        this.puzzles = this.server.puzzles || [];
    }

    async daily() {
        let body = (await rp.get(config.sources.lichess.url.puzzle.replace("|", "daily"))).toString();
        let id = (body.match(/content="Chess tactic #([0-9]+) - (?:White|Black) to play"/)|| [, null])[1];
        let initialPly = (body.match(/"initialPly"\:([0-9]+)\,/)|| [, null])[1];
        let argument = (body.match(new RegExp(`\"ply\"\:${initialPly}\,\"fen\"\:\"(` + FEN.regexVerifier + `)`))|| [, null])[1];
        let fen = new FEN(this.message, argument + " " + config.sources.lichess.url.puzzle.replace("|", id));
        fen.run();
    }

    add(message, argument) {
        try {
            let imageURL;
            let fen = new FEN(this.message, argument);
            if (message.attachments.first()) imageURL = message.attachments.first().url;
            else if (fen.fenArray && fen.imageURL) imageURL = fen.imageURL;
            else if (/(https?:\/\/[\S\.]+\.\w+\/?)\s?/.test(argument)) imageURL = argument.match(/(https?:\/\/[\S\.]+\.\w+\/?)\s?/)[0];
            else throw "Incorrect format! No link or image provided.";
            let puzzle = new P(imageURL, argument, this.channel, this.author)
            this.puzzles.push(puzzle);
            puzzle.content = this.Search.roles.get("puzzles") + ""; //ping puzzles when posted
            this.Output.sender(puzzle);
            this.server.puzzles = this.puzzles;
            DataManager.setServer(this.server);
        } catch (e) {
            if (e) this.Output.onError(e);
        }
    }

    async view(fetchboolean) {
        try {
            let embed = Embed.leaderboard(this.puzzles.map(p => [p.title, p.description]), 0, false); //generates fields probably
            embed.title = "Active Puzzles. " + fetchboolean ? "Type the index of the puzzle you would like to view below." : "Use `!puzzle [index]` to view a puzzle."; //informs about the await
            this.message.delete(); //deletes unnecessary command message
            this.Output.sender(embed);
        } catch (e) {
            if (e) this.Output.onError(e);
        }
    }

    async fetch(args) {
        try {
        if (args.length === 1) this.fetchfromindex(Number(args[0]) - 1); //if '!puzzle 0' take args[0] as index
        else {
            this.fetchfromindex(this.Output.choose({
                embed,
                "options": this.puzzles.map(p => p.title + " " + p.description),
                "type": "puzzle to view"
            }))
        }
        } catch (e) {
            if (e) this.Output.onError(e);
        }
    }

    async fetchfromindex(index) {
        try {
            let puzzle = this.puzzles[index];
            if (!puzzle) throw "No puzzle found!";
            else {
                if (puzzle.content) delete puzzle.content;
                this.Output.sender(puzzle);
                this.message.delete();
            }
        } catch (e) {
            if (e) this.Output.onError(e);
        }
    }

    async close(args) {
        try {
            let index = Number(args[0]) - 1;
            let puzzle = this.puzzles[args];
            if (!puzzle) throw "No puzzle found!";
            if (puzzle.authorid !== message.author.id) throw "You did not create this puzzle!"; //check that person created the puzzle
            else {
                Puzzle.stored.remove(index); //use it using array remover
                this.Output.generic(`**${this.author.tag}**: successfully closed puzzle number ${index + 1}.`);
                this.message.delete();
            }
        } catch (e) {
            if (e) this.Output.onError(e);
        }
    }

}

module.exports = Puzzle;