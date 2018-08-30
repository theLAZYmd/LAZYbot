const Parse = require("../util/parse.js");

class Tickets extends Parse {
  constructor(message) {
    super(message);
    this.tickets = this.reactionmessages.tickets || {};
  }

  static setData (tickets) {
    this.reactionmessages.tickets = tickets;
    DataManager.setServer(this.reactionmessages, "./src/data/reactionmessages.json");
  }

  static set (id, data) {
    this.tickets[id] = data;
    Tickets.setData(this.tickets);
  }

  static approve (data) {

  }
}

module.exports = Tickets;