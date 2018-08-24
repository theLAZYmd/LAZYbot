const Parse = require("../util/parse.js");
const DataManager = require("../util/datamanager.js");
const request = require("request");
const config = require("../config.json");

class Embeds extends Parse {
  constructor(message) {
    super(message)
  }

  find (args) {
    if (!args[0]) return;
    this.getEmbeds ()
    .then((embeds) => {
      for (let type in embeds) {
        for (let guide in embeds[type]) {
          if (args[0] === guide) {
            this.guide = Array.isArray(embeds[type][guide]) ? embeds[type][guide] : [embeds[type][guide]];
            return this.Paginator.sender(this.guide, 180000); 
          }
        }
      };
      let filter = m => m.author.bot;
      this.channel.awaitMessages(filter, {
        "max": 1,
        "time": 1000,
        "errors": ["time"]
      })
      .catch(() => {
        return this.Output.onError("Couldn't find guide matching that name.");
      })
    })
    .catch((e) => console.log(e))
  }

  getEmbeds () {
    return new Promise ((resolve, reject) => {
      if (!this._embeds) {
        if (this.client.user.id === config.ids.betabot) {
          this._embeds = DataManager.getFile("./src/data/embeds.json");
          return resolve(this._embeds);
        };
        request(config.urls.embeds, function(error, response, body) {
          if (response.statusCode === "404") {
            reject(error);
            this._embeds = DataManager.getFile("./data/embeds.json");
            return resolve(this._embeds);
          } else {
            this._embeds = JSON.parse(body);
            return resolve(this._embeds);
          }
        })
      } else return resolve(this._embeds);
    });
  }

  //old code: an absolute mess lmao

  router () {
    if(args.length < 1) return;
    let guidename = args[0].toLowerCase();
    if(guidename.match(/[^a-z]+/g)) return;
    let deleteboolean = false;
    let objectboolean = false;
    for(let i = 0; i < args.length; i++) {
      if(args[i].includes("{")) {
        args.length = i;
        objectboolean = true;
        break;
      };
      if(args[i] === "delete") deleteboolean = true;
    };
    let [page, type] = ["", "utility"];
    for(let i = 1; i < args.length; i++) {
      if(!isNaN(parseInt(args[i]))) page = parseInt(args[i]) - 1;
      if(args[i].match(/guide|utility/)) type = args[i];
    };
    argument = argument.slice(args.join(" ").length).trim();
    let embeds = DataManager.getData("./embeds.json");
    if(deleteboolean) {
      if(page) {
        if(embeds[type][guidename][page]) {
          delete embeds[type][guidename][page];
          message.react(getemojifromname("true"));
        }
      } else {
        if(embeds[type][guidename]) {
          delete embeds[type][guidename];
          message.react(getemojifromname("true"));
        };
      }
    } else {
      if(!objectboolean) return;
      let killboolean = false;
      try {
        JSON.parse(argument);
      } catch(e) {
        message.channel.send({embed: {
          "description": `Invalid JSON!`,
          "color": config.colors.error
        }})
        .then(msg => msg.delete(15000));
        killboolean = true;
      };
      if(killboolean) {
        let reactionsfilter = (reaction, user) => reaction.emoji.name === "false" && user.id === message.author.id;
        message.react(getemojifromname("false"))
        .then((reaction) => {
          reaction.message.createReactionCollector(reactionsfilter, {
            "max": 1,
            "time": 15000
          })
          collector.on("collect", (collected) => {
            if(collected.first()) message.delete()
          })
          collector.on("end", (collected)  => {
            message.clearReactions();
          })
          .catch((e) => console.log(e))
        })
        .catch((e) => console.log(e))
        return;
      };
      let object = JSON.parse(argument);
      if(object.thumbnail && typeof object.thumbnail === "string") {
        object.thumbnail = embedthumbnail(object.thumbnail);
      };
      if(object.image && typeof object.image === "string") {
        object.image = embedimage(object.image);
      };
      if(!object.color) object.color = config.colors.generic;
      if(page || page === 0) {
        if(!embeds[type][guidename]) embeds[type][guidename] = [];
        embeds[type][guidename][page] = object;
      } else {
        embeds[type][guidename] = object;
      }
      message.channel.send({embed: object});
    };
    let reactionsfilter = (reaction, user) => reaction.emoji.name === "true" && user.id === message.author.id;
    message.react(getemojifromname("true"))
    .then((reaction) => {
      reaction.message.createReactionCollector(reactionsfilter, {
        "max": 1,
        "time": 15000
      })
      collector.on("collect", (collected) => {
        if(collected.first()) message.delete()
      })
      collector.on("end", (collected)  => {
        message.clearReactions();
      })
    })
    .catch((e) => console.log(e))
    if(command !== "say") DataManager.setData(embeds, "./embeds.json");
  }

  add () {
    let topic = args[0]
    let guidename = args[1];
    if(guidename.startsWith("{")) return;
    let object = JSON.parse(argument.slice(args[0].length).trim());
    if(object !== Object(object)) return;
    let embeds = DataManager.getData("./embeds.json");
    embeds[topic][guidename] = object;
    DataManager.setData(embeds, "./embeds.json");
    message.react(getemojifromname("tick"))
  }

  get () {
    let guidename = args[0];
    embeds = DataManager.getData("./embeds.json");
    object = embeds.guides[guidename];
    if(!object) return;
    message.channel.send({embed: object})
  }

}

module.exports = Embeds;