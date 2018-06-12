const level = require('level');
const { promisify } = require('util');

class LevelPromise {
  constructor(location) {
    this.location = location;
    this.level = level(location);
    const prototype = Object.getPrototypeOf(this.level);
    
    Object.keys(prototype).forEach(key => {
      if(this._hasParam(prototype[key], "callback")) {

        this[key] = promisify(prototype[key]).bind(this.level);
      } else {
        this[key] = (...args) => this.level[key](...args);
      }
    });
  }
  
  _hasParam (fn, name) {
    const params = fn.toString()
      .replace(/((\/\/.*$)|(\/\*[\s\S]*?\*\/)|(\s))/mg,'')
      .match(/^function\s*[^\(]*\(\s*([^\)]*)\)/m)[1]
      .split(/,/);
    return params.includes(name);
  }
}

module.exports = LevelPromise;
