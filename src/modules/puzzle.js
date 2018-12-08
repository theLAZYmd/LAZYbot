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

    async variant() {
        try {
            let {   variant   } = await require("../util/variant")(this.message.content, this.channel, this.args, this);
            let body = JSON.parse((await rp(config.sources.cvt.url.puzzle.replace("|", config.variants.cvt[variant.key].api))).toString());
            if (!body.success) throw JSON.stringify(body, null, 4);
            if (!body.id) throw "Not given an ID property!";
            this.log(body.id);
            let options = {
                "method": "POST",
                "uri": config.sources.cvt.url.setup,
                "headers": {
                    "Origin": "https://chessvariants.training"
                },
                "body": {
                    "id": body.id
                },
                "timeout": 5000,
                "json": true
            };
            this.log(await rp.post(options));
        } catch (e) {
            if (e) this.Output.onError(e);
        }
    }

    async add(message, argument) {
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

    async close() {
        try {
            let index = await this.Output.choose({
                "options": this.puzzles,
                "type": "puzzle to remove"
            });
            if (puzzle.authorid !== message.author.id) throw "You did not create this puzzle!";
            Puzzle.stored.remove(index); //use it using array remover
            this.Output.generic(`**${this.author.tag}**: successfully closed puzzle number ${index + 1}.`);
            this.message.delete();
        } catch (e) {
            if (e) this.Output.onError(e);
        }
    }

}

module.exports = Puzzle;