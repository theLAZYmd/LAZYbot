const Parse = require("../util/parse.js");
const config = require("../config.json");
const request = require("request");
const rp = require("request-promise");

class Reddit extends Parse {

  constructor(message) {
    super(message);
  }

  async link() {
    try {
      if (!this.message.content) throw "";
      let subreddits = this.message.content.match(/(^|\b)\/*r\/([a-z]{2,21})/gi);
      if (!subreddits || !Array.isArray(subreddits)) throw "";
      let string = "";
      for (let sub of subreddits) {
        let name = sub.replace(/^\/*r\//, ""); /*
        let uri = config.urls.reddit.api.replace("|", name);
        let body = await rp({uri,
          "json": true,
          "timeout": 2000
        });
        if (!body || body.error || body.message === "Not Found") throw "sub"; */
        string += `[${config.urls.reddit.name.replace("|", name)}](${config.urls.reddit.link.replace("|", name)})\n`
      };
      if (string) this.Output.generic(string);
    } catch (e) {
      if (e) this.Output.onError(e);
    }
  }

}

module.exports = Reddit;