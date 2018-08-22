const Parse = require("../util/parse.js");

class Maths extends Parse {
  constructor(message) {
    super(message);
    this.Output.generic = (description) => {
      this.Output.sender({
        "title": "⚙ Result", description
      })
    }
  }

  run (argument) {
    let route = argument.match(/([a-z]+)\(([a-z0-9\s,.]+)\)/i);
    if (!route) return "Invalid format for operation."
    route[2].replace(/ \s/g, "").split(",").validate()
    .then((array => {
      if (Maths[route[1]]) {
        let result = Maths[route[1]](...array).toString();
        return this.Output.generic((Math.round(1000 * result) / 1000).toString());
      };
      this.Output.onError("Couldn't find matching operation to calculate.");
    }))
    .catch((e) => {
      this.Output.onError(e);
    })
  }

  static binomial (n, p, x, cumulative) {
    let result = Maths.choose(n, x) * Math.pow(p, x) * Math.pow(1 - p, n - x);
    if (cumulative) {
      for (let i = 0; i < x ; i++) {
        result += Maths.choose(n, i) * Math.pow(p, i) * Math.pow(1 - p, n - i);
      }
    };
    return result;
  }
  
  static choose (n, r) {
    if (n - r > r) r = n - r;
    let result = 1;
    for (let i = 1; i < r + 1; i++) {
      result = (result / i) * (n + 1 - i);
    };
    return result;
  }
  
  static permutations (n, r) {
    if (n - r > r) r = n - r;
    let result = n;
    for (let i = 1; i < r; i++) {
      result = result * (n - i);
    };
    return result;
  }

}

module.exports = Maths;

Array.prototype.validate = function () {
  return new Promise ((resolve, reject) => {
    for (let i = 0; i < this.length; i++) {
      this[i] = this[i].trim();
      if (this[i] === "true") {
        this[i] = true;
        continue;
      };
      if (this[i] === "false") {
        this[i] = false;
        continue;
      };
      this[i] = Number(this[i]);
      if (isNaN(this[i])) return reject("Invalid inputs to operation!");
    };
    resolve(this);
  })

}