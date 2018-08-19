const Parse = require("../util/parse.js");

class Calc extends Parse {

  constructor(message) {
    super(message);
  }

  mf (args) { //conversion formula for matches, usage is fairly self-explanatory
    this.Output.generic("This feature has been retired. Please see https://discordapp.com/channels/314155682033041408/390264166843154433/457922481668227076 for details.");
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
      "title": "House Tournament Reward",
      "description": Math.floor(1 / 10 * Number(games) * (Number(time) + 2/3 * Number(increment))) + " :cherry_blossom:"
    })
  }

  tous(args) {
    if(args.length !== 1) return;
    if(isNaN(Number(args[0]))) return;
    let embedoutput = {
      "title": "Decimal to US Odds",
      "color": 431075,
      "description": args[0] < 1 ? "Error: Decimal odds must be greater than or equal to 1." :
                    (args[0] < 2 ? (-100/(args[0]-1)).toFixed(0).toString() : "+" + (100*(args[0]-1)).toFixed(0).toString())
    }
    this.Output.sender(embedoutput);
  }

  todecimal(args) {
    if(args.length !== 1) return;
    if(isNaN(args[0])) return;
    let embedoutput = {
      "title": "US to Decimal Odds",
      "color": 431075,
      "description": args[0] < 0 ? (1 - 100/args[0]).toFixed(1) : (1 + args[0]/100).toFixed(1)
    }
    this.Output.sender(embedoutput);
  }

}

module.exports = Calc;