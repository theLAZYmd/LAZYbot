const Parse = require("../util/parse.js");
const Maths = require("./maths.js");
const Calc = require("./calc.js");
const Embed = require("../util/embed.js");

class All extends Parse {
  constructor(message) {
    super(message);
  }
}

class Series extends All {
  constructor(message) {
    super(message);
    this.embed = {};
  }

  async input() { //if there's a draw the bettor just gets all the money
    try {
      let data = { //alright create the big data object to be passed around
        "players": []
      };
      let msg1 = await this.Output.response({ //get the number of games played. Game total must add up to this number.
        "description": "Please input the number of games played in the series.",
        "filter": m => !isNaN(parseInt(m.content) && Number(m.content) < 21)
      });
      data.length = parseInt(msg1.content);
      let msg2 = await this.Output.response({ //first name. String literal for object. Purely aesthetic, we don't take into account ratings
        "description": "Please input the name of the first player."
      })
      data.players[0] = {
        "name": msg2.content
      };
      let msg3 = await this.Output.response({ //second name. String literal for object. Purely aesthetic, we don't take into account ratings
        "description": "Please input the name of the second player."
      })
      data.players[1] = {
        "name": msg3.content
      };
      let msg4 = await this.Output.response({ //these are important - not only do they provide the ratio but the degree of accuracy too
        "description": "Please input past number of **" + data.players[0].name + "** wins against " + data.players[1].name + ".",
        "filter": m => !isNaN(Number(m.content))
      })

      data.players[0].score = Number(msg4.content);
      let msg5 = await this.Output.response({
        "description": "Please input past number of **" + data.players[1].name + "** wins against " + data.players[0].name + ".",
        "filter": m => !isNaN(Number(m.content))
      })
      data.players[1].score = Number(msg5.content);
      this.message.delete(), msg1.delete(), msg2.delete(), msg3.delete(), msg4.delete(), msg5.delete();
      this.gen(data);
    } catch (e) {
      console.log(e);
    }
  }

  gen(data) {
    data.total = data.players[0].score + data.players[1].score;
    if (!data.total) return this.Output.onError("Couldn't calculate odds for this data.");
    data.reliability = (Math.pow(Math.E, (Math.min(data.total, 200) / 200)) //e^(total/200) or if total is more than 1000, 1
      *
      (1 / (Math.E)) //divided by (e), now a number between 0 and 1
      *
      0.25); //now a number between 0 and 0.25
    data.accuracy = (Math.pow(Math.E, (Math.min(data.length, 20) / 20)) //e^(number of games/50) or if total is more than 50, 1
      *
      (1 / Math.E) //divided by (e), now a number between 0 and 1
      *
      0.25); //now a number between 0 and 0.25
    data.confidence = 0.45 + data.reliability + data.accuracy //base value
    console.log("data.reliability: " + data.reliability + "\n", "data.accuracy:" + data.accuracy + "\n", "data.confidence: " + data.confidence)
    for (let player of data.players) { //for each player
      player.discrete = {
        "probability": [],
        "decimal": []
      };
      player.cumulative = {
        "probability": [],
        "decimal": []
      };
      player.winchance = (player.score / data.total);
      for (let j = 0; j < data.length + 1; j++) {
        player.discrete.probability[j] = Maths.binomial(data.length, player.winchance, j, false);
        player.discrete.decimal[j] = data.confidence / player.discrete.probability[j];
        player.cumulative.probability[j] = 1 - Maths.binomial(data.length, player.winchance, j - 1, true);
        player.cumulative.decimal[j] = data.confidence / player.cumulative.probability[j];
      };
    };
    let embedgroup = [];
    for (let j = 0; j < 2; j++) { //maxpages is 2
      embedgroup.push(this.build(data, j));
    };
    this.Paginator.sender(embedgroup, 180000)
  }

  build(data, page) {
    let type = page === 0 ? "discrete" : "cumulative";
    let embed = {
      "title": this.Search.emojis.get("lazyslack") + " LAZY odds for match " + data.players[0].name + " vs " + data.players[1].name,
      "description": "Showing " + type + " odds...\n**Note:** these odds are not valid unless it is <@!185412969130229760> who has request them.",
      "fields": []
    };
    for (let player of data.players) {
      let array = [];
      for (let j = 0; j < data.length + 1; j++) {
        let decimal = player[type].decimal[j] && player[type].decimal[j] > 1 ? player[type].decimal[j].toFixed(2) : null;
        let us = decimal ? (decimal > 2 ? "+" : "") + Calc.tous(decimal).toFixed() : null;
        array.push([
          (type === "discrete" ? "Exactly " : "At least ") + j, !decimal || decimal > 80 ? "-" : "**" + decimal + "** (" + us + ")"
        ]);
      };
      let w = Math.floor((data.length - 1) / 2);
      let matchodds = player.cumulative.decimal[w] && player.cumulative.decimal[w] > 1 ? player.cumulative.decimal[w].toFixed(2) : "";
      let usmatchodds = matchodds ? (matchodds > 2 ? "+" : "") + Calc.tous(matchodds).toFixed() : null;
      array.push([
        "The match", !matchodds || matchodds > 80 ? "-" : "**" + matchodds + "** (" + usmatchodds + ")"
      ])
      Embed.fielder(embed.fields, "How many games will " + player.name + " win?    \u200b", Embed.getFields(array), true);
    };
    return embed;
  }

}

class Odds {

  constructor(message) {
    this.message = message;
  }

  get series() {
    return new Series(this.message);
  }

  get match() {
    return new Match(this.message);
  }

  get tournament() {
    return new Tournament(this.message);
  }

  run(args) {
    if (this[args[0]]) return this[args[0]].input();
    this.Output.onError("Invalid type of odds requested.");
  }

}

module.exports = Odds;

Number.prototype.round = function (places) {
  (Math.round(this * Math.pow(10, places)) / Math.pow(10, places));
  return this;
}

String.prototype.toProperCase = function () {
  let words = this.split(/ +/g);
  let newArray = [];
  for (let j = 0; j < words.length; j++) {
    newArray[j] = words[j][0].toUpperCase() + words[j].slice(1, words[j].length).toLowerCase();
  }
  let newString = newArray.join(" ");
  return newString;
}

/*
EXAMPLE data object produced from series odds

{
  length: 10,
  total: 317,
  reliability: 0.1997638788330735, //out of 0.25
  accuracy: 0.177706988738792, //out of 0.25
  confidence: 0.8774708675718655,
  players: [{
      name: 'littleplotkin',
      score: 113,
      discrete: {
        probability: [0.01218173231856259,
          0.06747724274497906,
          0.16819695066579338,
          0.2484477833364007,
          0.24083602526849623,
          0.16008512267847105,
          0.07389550188998052,
          0.023389892755091866,
          0.004858562281848128,
          0.0005980583200967738,
          0.00003312774027987032
        ],
        decimal: [72.0316983352828,
          13.003952619820964,
          5.21692494482493,
          3.5318120201690895,
          3.6434369259898576,
          5.481276791312174,
          11.874482818701061,
          37.5149589935954,
          180.6029884293442,
          1467.1994989215752,
          26487.495378761178
        ],
        us: [7103.16983352828,
          1200.3952619820964,
          421.692494482493,
          253.18120201690894,
          264.34369259898574,
          448.1276791312174,
          1087.448281870106,
          3651.49589935954,
          17960.298842934422,
          146619.9498921575,
          2648649.537876118
        ]
      },
      cumulative: {
        probability: [0.01218173231856259,
          0.07965897506354165,
          0.247855925729335,
          0.49630370906573573,
          0.737139734334232,
          0.897224857012703,
          0.9711203589026836,
          0.9945102516577754,
          0.9993688139396235,
          0.9999668722597203,
          1.0000000000000002
        ],
        decimal: [72.0316983352828,
          11.015342174211161,
          3.540245668889458,
          1.768011907917545,
          1.1903724988646522,
          0.977983234318086,
          0.9035655153634744,
          0.8823145524233523,
          0.878025064753399,
          0.8774999371618794,
          0.8774708675718653
        ],

        us: [7103.16983352828,
          1001.5342174211162,
          254.0245668889458, -130.20631447128054, -525.2859556731263,
          null,
          null,
          null,
          null,
          null,
          null
        ]
      },
      winchance: 0.35646687697160884
    },
    {
      name: 'opperwezen',
      score: 204,
      discrete: {
        probability: [0.00003312774027987032,
          0.0005980583200967738,
          0.004858562281848127,
          0.02338989275509187,
          0.07389550188998052,
          0.16008512267847105,
          0.24083602526849626,
          0.2484477833364007,
          0.1681969506657934,
          0.06747724274497906,
          0.01218173231856259
        ],
        decimal: [26487.495378761178,
          1467.1994989215752,
          180.60298842934424,
          37.51495899359539,
          11.874482818701061,
          5.481276791312174,
          3.643436925989857,
          3.5318120201690895,
          5.216924944824929,
          13.003952619820964,
          72.0316983352828
        ],
        us: [2648649.537876118,
          146619.9498921575,
          17960.298842934422,
          3651.495899359539,
          1087.448281870106,
          448.1276791312174,
          264.34369259898574,
          253.18120201690894,
          421.6924944824929,
          1200.3952619820964,
          7103.16983352828
        ]
      },
      cumulative: {
        probability: [0.00003312774027987032,
          0.0006311860603766442,
          0.005489748342224771,
          0.028879641097316642,
          0.10277514298729716,
          0.2628602656657682,
          0.5036962909342645,
          0.7521440742706652,
          0.9203410249364586,
          0.9878182676814377,
          1.0000000000000002
        ],
        decimal: [26487.495378761178,
          1390.193672921511,
          159.8380859870641,
          30.38371787983875,
          8.537773259827228,
          3.3381647292694527,
          1.7420633889209658,
          1.1666260462435025,
          0.9534192693762045,
          0.8882918005064084,
          0.8774708675718653
        ],
        us: [2648649.537876118,
          138919.36729215112,
          15883.80859870641,
          2938.371787983875,
          753.7773259827228,
          233.81647292694527, -134.75937701954274, -600.1462691724851,
          null,
          null,
          null
        ]
      },
      winchance: 0.6435331230283912
    }
  ]
}

*/