const Parse = require("../../util/parse.js");
const Embed = require("../../util/embed.js");
const DBuser = require("../../util/dbuser.js");
const DataManager = require("../../util/datamanager.js");
const Permissions = require("../../util/permissions.js");
const config = require("../../config.json");

class Trivia extends Parse {

	constructor(message) {
        super(message);
    }

    get trivia () {
        if (!this.server.trivia) this.trivia = {};
        return this.server.trivia;
    }

    set trivia (obj) {
        let server = this.getServer();
        server.trivia = obj;
        this.server = server;
    }

    get players () {
        if (!this.trivia.players) this.players = {};
        return this.trivia.players;
    }

    set players (obj) {
        let trivia = this.trivia;
        trivia.players = obj;
        this.trivia = trivia;
    }
    
    async gen() {
        this.Output.sender(new Embed()
            .setTitle(`Now playing rated trivia`)
            .setDescription(Object.entries(this.players)
                .filter(([, playing]) => playing)
                .map(([player]) => player === this.user.tag ? "**" + player + "**" : player)
                .reverse()
                .join("\n") || ""
            )
        );
    }

	async init(args) {
		if (this.server.states.trivia) return;
		for (let a of args) {
            if (/^(:?--pokemon|-p)$/.test(a)) return;
        }
		this.server.states.trivia = true;
        DataManager.setServer(this.server);
        this.gen();
	}

	async end() {
        this.players = {};
        let server = this.server;
        server.states.trivia = false;
        this.server = server;
    }
    
    async show() {
        try {
            if (!this.server.states.trivia) throw 'Not currently playing rated trivia!';
            this.gen();
        } catch (e) {
            if (e) this.Output.onError(e);
        }
    }

    async rate(argument) {
        try {
            if (!this.server.states.trivia) throw 'Not currently playing rated trivia!';
            if (argument) {
				if (!(await Permissions.role('admin', this))) throw Permissions.output('role');
                this.user = this.Search.users.get(argument);
                if (!this.user) throw "Couldn't find user " + argument + "!";
            }
            this.onNewMessage(this.user);
        } catch (e) {
            if (e) this.Output.onError(e);
        }
    }

	async onNewMessage(user = this.author) {
		try {
            if (user.id === "392031018313580546") throw "";
			if (typeof this.players[user.tag] !== "undefined") throw "";
            let players = this.players;
            players[user.tag] = true;
            this.players = players;
			let playing = await this.Output.confirm({
				"description": `**${user.tag}** joined rated trivia.\nType \`n\` or press ❎ in 10s to cancel.`,
				"errors": ["time"],
				"cancel": true
			}, true);
			if (playing) this.gen();
			else {
                players[user.tag] = false;
                this.players = players;
            }
		} catch (e) {
			if (e) this.Output.onError(e)
		}
    }

	async ratingUpdate(embed) {
		try {
			const lines = embed.description.split("\n");
			let data = lines.map(line => {
				let [name, , score] = line.match(/[^\s]+/gi); //[**ObiWanBenoni#3488**, has, 3, points]
				let user = this.Search.users.byTag(name.replace(/\*/g, "")); //byTag filters out the **
				if (!user) return null;
				let dbuser = DBuser.getUser(user);
				if (!dbuser.trivia) dbuser.trivia = {
					"rating": 1500,
					"games": 0
				};
				let estimate = Math.pow(10, (dbuser.trivia.rating - config.trivia.initial) / config.trivia.spread); //ex: (2000 - 1500) / 1589 or (1400 - 1500 / 1589
				return [dbuser, estimate, Number(score)]; //a number from 0 to 10. If less than 1500, it's between 0 and 1. Realistically not above 5
			});
            data = data.filter(d => d && this.server.trivia.players[d[0].username]);    //d is dbuser, not user            
            let description = "";
            try {
                if (data.length === 0) throw "";
                let totalEstimate = data.reduce((a, [, estimate]) => a + estimate, 0);
                let totalScore = data.reduce((a, [, , score]) => a + score, 0);
                if (totalScore < this.server.trivia.min) throw `Only ${this.server.trivia.min}+ point games are rated.\nActive players: ` + data.map(([dbuser]) => dbuser).join(", ");
                if (data.length < 2) throw "Only games with 2+ players are rated.\nActive players: " + data.map(([dbuser]) => dbuser).join(", ");
                for (let [dbuser, estimate, score] of data) {
                    let shareEstimate = (estimate / totalEstimate) * totalScore;
                    let RD = Math.max(50 - (dbuser.trivia.games || 0) * 3, 10);
                    let difference = RD * (score - shareEstimate);
                    dbuser.trivia.rating = Math.round(difference + dbuser.trivia.rating);
                    dbuser.trivia.games++;
                    description += "**" + dbuser.username + "** " + dbuser.trivia.rating + (dbuser.trivia.games < this.server.trivia.provisional ? "?" : "") + " (" + difference.toSign() + ")\n";
                    DBuser.setData(dbuser);
                }
            } catch (e) {
                if (e) throw e;
            }
            await this.Output.sender(new Embed()
                .setAuthor("Trivia Game Ended.")
				.setTitle(description ? "Trivia Rating Update" : "")
				.setDescription(description)
            )
            this.end();
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}


	async rating(argument) {
		try {
			let user = this.user;
			if (argument) user = this.Search.users.get(argument);
			if (!user) throw "Couldn't find user **" + argument + "**!";
			let dbuser = DBuser.getUser(user);
			this.Output.sender(new Embed()
				.setTitle("Trivia Rating")
				.setDescription("**" + dbuser.username + "** " + (dbuser.trivia ? dbuser.trivia.rating : 1500) + (dbuser.trivia.games < this.server.trivia.provisional ? "?" : ""))
			)
		} catch (e) {
			if (e) this.Output.onError(e)
		}
	}

}

module.exports = Trivia;