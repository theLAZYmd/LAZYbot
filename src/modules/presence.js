const Parse = require("../util/parse.js");
const config = require("../config.json");
const StatesConstructor = require("./states.js");
const Router = require("../util/router.js");

class Presence extends Parse {
  constructor(data) {
    super(data);
    this.States = new StatesConstructor(data);
  }

  async bot (oldPresence, newPresence) {
    if (this.member.id !== config.ids.bouncer) return;
    let forced;
    if (oldPresence.status !== "offline" && newPresence.status === "offline") forced = true;
    if (newPresence.status !== "offline" && oldPresence.status === "offline") forced = false;
    if (forced === undefined) return;
    await this.States.bcp(forced);
    Router.logCommand({
      "author": {
        "tag": "auto"
      },
      "args": [forced],
      "command": "bcp"
    }, {
      "file": "Presence",
      "prefix": ""
    }); //log updates received as a command
  }

  async streamer (oldPresence, newPresence) {
    try {
      let live;
      if (!oldPresence.game && newPresence.game && newPresence.game.streaming) live = true;
      if (!newPresence.game && oldPresence.game && oldPresence.game.streaming) live = false;
      if (live === undefined) return;
      let streamersbox = this.Search.channels.get("Streamers Box");
      if (!streamersbox) return;
      for(let region of this.server.regions) {
        streamersbox.overwritePermissions(this.Search.roles.get(region), {
          VIEW_CHANNEL: live
        })
      }
	    Router.logCommand({
        "author": {
          "tag": "auto"
        },
        "args": [live],
        "command": "streamers box"
      }, {
        "file": "Presence",
        "prefix": ""
      }); //log updates received as a command
    } catch (e) {
      if (e) this.Output.onError(e);
    }
  }

}

module.exports = Presence;