const Parse = require("../util/parse.js");

class Reddit extends Parse {

  constructor(message) {
    super(message);
  }

  link(content) {
    if(typeof content !== "string" || !content) return;
    let subreddits = content.match(/(^|\b)\/*r\/([a-z]{2,21})/gi);
    if(!subreddits || typeof subreddits !== "object") return;
    let string = "";
    for(let i = 0; i < subreddits.length; i++) {
      if(subreddits[i]) {
        let name = subreddits[i].replace(/^\/*r\//, "");
        string += `[/r/${name}](http://www.reddit.com/r/${name})\n`
      }
    };
    if(string) this.Output.generic(string);
  }

}

module.exports = Reddit;