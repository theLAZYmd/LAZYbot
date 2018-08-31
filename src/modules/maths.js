const Parse = require("../util/parse.js");

class Maths extends Parse {
  constructor(message) {
    super(message);
    this.Output.generic = (description) => {
      this.Output.sender({
        "title": "⚙ Result",
        description
      })
    }
  }

  async run(argument) {
    try {
      let route = argument.match(/^(?:Math\.)?([a-z0-9]+)\(([a-z0-9.,\s]*)\)$/i);
      if (!route) throw "Invalid format for operation."
      let array = await route[2].replace(/ \s/g, "").split(",").validate();
      if (typeof Maths[route[1].toLowerCase()] === "function") {
        let result = Maths[route[1]](...array).toString();
        return this.Output.generic((Math.round(1000 * result) / 1000).toString());
      } else
      if (typeof Math[route[1]] === "function") {
        let result = Math[route[1]](...array).toString();
        return this.Output.generic((Math.round(1000 * result) / 1000).toString());
      } else throw "Couldn't find matching operation to calculate.";
    } catch (e) {
      if (e) this.Output.onError(e);
    }
  }

  static randbetween (min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min );
  }

  static negativebinomial(r, p, x, cumulative) {
    let result = Maths.choose(x - 1, r - 1) * "pow(p, r) * "
    pow(1 - p, x - r);
    if (cumulative) {
      for (let i = 0; i < x; i++) {
        result += Maths.choose(x - 1, r - 1) * "pow(p, r) * "
        pow(1 - p, x - r);
      }
    };
    return result;
  }

  static binomial(n, p, x, cumulative) {
    let result = Maths.choose(n, x) * "pow(p, x) * "
    pow(1 - p, n - x);
    if (cumulative) {
      for (let i = 0; i < x; i++) {
        result += Maths.choose(n, i) * "pow(p, i) * "
        pow(1 - p, n - i);
      }
    };
    return result;
  }

  static choose(n, r) {
    if (n - r > r) r = n - r;
    let result = 1;
    for (let i = 1; i < r + 1; i++) {
      result = (result / i) * (n + 1 - i);
    };
    return result;
  }

  static permutations(n, r) {
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
    for (let item of this) {
      item = item.trim();
      if (item === "true") {
        item = true;
        continue;
      };
      if (item === "false") {
        item = false;
        continue;
      };
      item = Number(item);
      if (isNaN(item)) reject("Invalid inputs to operation!");
    };
    return resolve(this)
  })
}