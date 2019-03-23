const Parse = require("../util/parse.js");
const DataManager = require("../util/datamanager.js");

class Survey extends Parse {

  constructor() {
    super()
  }

  run() {
    let surveydata = DataManager.getFile("./src/data/survey.json");
    let interval = 3600000;
    let guild = this.client.guilds.get(config.ids.house);
    let [online, idle, dnd, total] = [0, 0, 0, 0];
    let lm = {
      "lm1": 0,
      "lm2": 0,
      "lm4": 0,
      "lm8": 0,
      "lm24": 0
    };
    guild.members.forEach(function (member) {
      let tally = DataManager.getData();
      let dbuser = tally.find(dbuser => dbuser.id === member.id);
      if (member.presence.status === "online") online++;
      if (member.presence.status === "idle") idle++;
      if (member.presence.status === "dnd") dnd++;
      if (dbuser && dbuser.lastmessagedate) {
        if (Date.now() - dbuser.lastmessagedate < 3600000) lm.lm1++;
        if (Date.now() - dbuser.lastmessagedate < 7200000) lm.lm2++;
        if (Date.now() - dbuser.lastmessagedate < 14400000) lm.lm4++;
        if (Date.now() - dbuser.lastmessagedate < 28800000) lm.lm8++;
        if (Date.now() - dbuser.lastmessagedate < 86400000) lm.lm24++;
      }
      total++;
    });
    surveydata[Date.now()] = {
      "online": online,
      "idle": idle,
      "dnd": dnd,
      "total": total,
      "lm": lm
    };
    DataManager.setData(surveydata, "./src/data/survey.json");
  }
}

module.exports = Survey;