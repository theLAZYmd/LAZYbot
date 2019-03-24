const Tracker = require("./tracker");
const Parse = require("../../../util/parse");
const Embed = require("../../../util/embed");
const config = require("../../../config.json");

class Output extends Tracker {
  
  constructor(message, msg) {
    super(message);
    this.msg = msg;
  }

  async track(data) {
		try {
			let embed = new Embed().setColor(this.server.colors.ratings), errors = "", whitespace = "      \u200B";
			for (let source of data.sources) {
				for (let account of (this.command === "update" ? Object.keys(data.dbuser[source.key]) : [data.username])) try {
					if (account.startsWith("_")) continue;
					if (!data.successfulupdates.includes(source.key)) errors += this.Search.emojis.get(source.key) + " Couldn't " + (this.command === "update" ? "update '" : "link to '") + account + "' on " + source.name + (data.errors[source.key] ? ": " + data.errors[source.key] : ".") + "\n";
					else embed.addField(
            this.Search.emojis.get(source.key) + " " + (this.command === "update" ? "Updated '" : `Linked ${this.user.username} to '`) + account + "'",
            Parse.profile(data.dbuser, source, account) + "\nCurrent highest rating is **" + data.dbuser[source.key][account].maxRating + "**" + whitespace + "\n" + Parse.ratingData(data.dbuser, source, account),
            true
          )
				} catch (e) {
          if (e) throw "Error setting data."
        }
      }
			if (embed.fields.length > 0) this.Output[this.command === "update" ? "editor" : "sender"](embed, this.msg);
			if (errors) throw errors;
		}
		catch (e) {
			if (e) this.Output.onError(e);
		}
  }  
  
	async remove(data) {
		this.Output.sender(new Embed()
			.setTitle(`Stopped tracking via !remove command`)
			.setDescription(`Unlinked **${data.username}** from ${data.source.key} account **${data.dbuser.username}**.`)
			.setColor(config.colors.ratings)
		)
	}

}

module.exports = Output;