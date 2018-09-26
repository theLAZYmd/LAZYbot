class Vote extends Parse { //this module parses voting data

  constructor(message) {
    super(message);
  }

  async receive() {
    try {
      let Constructor = require("./" + election.system.toLowerCase() + "./vote.js");
      let Instance = new Constructor(this.message);
      Instance.receive();
    } catch (e) {
      if (e) this.Output.onError(e);
    }
  }

}

module.exports = Vote;