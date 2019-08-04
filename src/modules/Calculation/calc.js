const Parse = require('../../util/parse.js');

class Calc extends Parse {

	constructor(message) {
		super(message);
	}

	mf (args) { //conversion formula for matches, usage is fairly self-explanatory
		this.Output.generic('This feature has been retired. Please see https://discordapp.com/channels/314155682033041408/390264166843154433/457922481668227076 for details.');
		/*
    if(args.length !== 3) return this.Output.onError("Incorrect number of parameters!");
    let [games, time, increment] = args;
    this.Output.sender({
      "title": "House Match Reward",
      "description": Math.floor(7 / 12 * Number(games) * (Number(time) + 2/3 * Number(increment))) + " :cherry_blossom:"
    })*/ //retired
	}

	tf (args) {
		let [games, time, increment] = args;
		this.Output.sender({
			title: 'House Tournament Reward',
			description: Math.floor(1 / 10 * Number(games) * (Number(time) + 2/3 * Number(increment))) + ' :cherry_blossom:'
		});
	}

	tous(args) {
		if(isNaN(args[0])) return;
		let description = Calc.tous(Number(args[0]));
		if (!description) return this.Output.onError('Decimal odds must be above 1!');
		description = (description > 0 ? '+' : '') + description.round().toFixed().toString();
		let embedoutput = {
			title: 'Decimal to US Odds',
			color: 431075,
			description
		};
		this.Output.sender(embedoutput);
	}

	todecimal(args) {
		if(isNaN(args[0])) return;
		let description = Calc.todecimal(Number(args[0])).round(2).toFixed(1).toString();
		let embedoutput = {
			title: 'US to Decimal Odds',
			color: 431075,
			description
		};
		this.Output.sender(embedoutput);
	}

	static tous (odds) {
		if (odds < 1) return null;
		if (odds < 2) return (-100 / (odds - 1));
		return (100 * (odds - 1));
	}

	static todecimal (odds) {
		if (odds < 0) return (1 - 100 / odds);
		return (1 + odds / 100);
	}

}

module.exports = Calc;