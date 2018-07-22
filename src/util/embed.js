const config = require("../config.json");

class Embed {

  static sender(inputobject, channel) {
    return new Promise((resolve, reject) => {
      if(!inputobject) return reject("**Embed.sender():** Embed object is undefined.");
      let object = Embed.receiver(inputobject);
      if(!object.color) object.color = config.colors.generic;
      try {
        channel.send(object.content, {embed: object})
        .then(msg => resolve(msg))
        .catch(e => console.log(JSON.stringify(e)));
      }
      catch(error) {
        return reject("**Embed.sender():** Incorrect embed format.");
      }
    })
  }

  static editor(inputobject, message) {
    return new Promise((resolve, reject) => {
      if(!inputobject) return reject(`Incorrect embed object syntax.`);
      let object = Embed.receiver(inputobject);
      if(!object.color) object.color = config.colors.generic;
      message.edit(object.content, {embed: object})
      .then(msg => resolve(msg))
      .catch(e => console.log(JSON.stringify(e)));
    })
  }

  static getFields(array, messageconstant, bold) { //see explanation at bottom
    let string = "";
    if(!messageconstant) {
      for(let i = 0; i < array.length; i++) {
        if(typeof array[i] === "array" || typeof array[i] === "object" ) {
          if(array[i][1] || array[i][1] === 0) {
            string += (array[i][2] === false ? array[i][0] + array[i][1] + (i < array.length -1 ? `\n` : `` ) : array[i][0] + "**" + array[i][1] + "**" + (i < array.length -1 ? `\n` : ``));
          }
        } else 
        if(typeof array[i] === "string") {
          string += array[i] + (i < array.length -1 ? `\n` : ``);
        }
      }
    } else {
      for(let i = 0; i < array.length; i++) {
        if(array[i]) {
          string += (bold ? messageconstant + "**" + array[i] + "**" + (i < array.length -1 ? `\n` : ``) : messageconstant + array[i] + (i < array.length -1 ? `\n` : ``));
        }
      }
    }
    return string;
  }

  static fielder(fields, name, value, inline) { 
    inline = inline ? inline : false;
    if(!fields) {
      fields = [];
      fields[0] = {name, value, inline}
    } else fields.push({name, value, inline});
    return fields;
  }

  static author(name, url, icon_url) {
    let author = {};
    author.name = name;
    if(url) author.url = url;
    if(icon_url) author.icon_url = icon_url;
    return author;
  }

  static thumbnail(link) {
    return {
      "url": link
    }
  }

  static image(image) {
    return {
      "url": image
    }
  }

  static footer (text, icon_url) {
    let footer = {};
    if(text) {footer.text = text};
    if(icon_url) {footer.icon_url = icon_url};
    return footer
  }

  static receiver(embed) {
    let embedinput = {};
    let property = ["title", "url", "description", "color", "video", "timestamp"];
    for(let i = 0; i < property.length; i++) {
      if(embed[property[i]]) embedinput[property[i]] = embed[property[i]];
    };
    if(embed.author) {
      let name = "";
      let url = "";
      let icon_url = "";
      name = embed.author.name;
      if(embed.author.url) url = embed.author.url;
      if(embed.author.icon_url) icon_url = embed.author.icon_url;
      embedinput.author = Embed.author(name, url, icon_url);
    };
    if(embed.footer) {
      let text = "";
      let icon_url = "";
      if(embed.footer.text) text = embed.footer.text;
      if(embed.footer.icon_url) icon_url = embed.footer.icon_url;
      if(text || icon_url) embedinput.footer = Embed.footer(text ? text : "", icon_url ? icon_url : "");
    };
    if(embed.image) {
      let url = "";
      if(embed.image.url) url = embed.image.url;
      if(url) embedinput.image = Embed.image(url);
    };
    if(embed.thumbnail) {
      let url = "";
      if(embed.thumbnail.url) url = embed.thumbnail.url;
      if(url) embedinput.thumbnail = Embed.thumbnail(url);
    };
    if(embed.fields) {
      embedinput.fields = [];
      for(let i = 0; i < embed.fields.length; i++) {
        let name = "";
        let value = "";
        let inline = "";
        if(embed.fields[i].name) name = embed.fields[i].name;
        if(embed.fields[i].value) value = embed.fields[i].value;
        if(embed.fields[i].inline) inline = embed.fields[i].inline;
        if(name || value || inline) {
          embedinput.fields[i] = {};
          name = name ? name : "\u200b";
          value = value ? value : "\u200b";
          inline = inline ? inline : false;
          embedinput.fields[i] = {name, value, inline}
        };
      };
    };
    return embedinput;
  }

  static leaderboard(array, page, inline, _pagekey) { //see explanation at bottom
    let embed = {
      "description": ""
    };
    if(!array[0]) return;
    let pagekey = _pagekey ? _pagekey : 9;
    let beginfields = false;
    for(let i = 0; i < array.length; i++) { //if i is less than point where second field starts appearing, add to description
      if(!!array[i][1] || array[i][1] === 0 || !beginfields) {
        embed.description += "**#" + (i + 1 + page * pagekey) + "** " +array[i][0] + (i < 10 ? "\n" : ""); //CLASS 2
      } else {
        if(array[i][0] && array[i][1]) { //CLASS 1 OR 3
          if(array[i][0].length > 17 && inline !== false) array[i][0] = array[i][0].slice(0, 17); //if title is longer than 17, trim
          embed.fields = Embed.fielder(embed.fields,
            `#${i + 1 + page * pagekey} ${array[i][0]} `, //#1 theLAZYmd#2353 score value is multiplied by page * 9
            array[i][1], //second item in embed
            inline === false ? false : true //default position of inline is true, have it be true unless specifically stated
          );
          beginfields = true; //first time we begin making fields, it triggers so that we do it from now on
        } else 
        if(!array[i][1]) {
          embed.fields = Embed.fielder(embed.fields,
            `#${i + 1 + page * pagekey} `, //since no two fields specified, one field given is the value, leave the name as just increment
            array[i][0],
            inline === false ? false : true
          );
        }
      }
    };
    return embed;
  }

  /*
  VALID INPUT.LEADERBOARD INPUT FORMATS:

    array input is a double array, each item in outer array has two options:
      either it is [itemtitle, itemdescription]
      or it is [itemdescription].
    dictates the cases

    page determines what numbers to use. it's always 9 consective numbers, multiplied by page, +1.
    To change whether it is 9 or not, use a _pagekey value

    inline applies to case 1 fields.
    Case 1 (and 3 bottom half) fields are inline by default.
    To produce a leaderboard with non-inline (i.e. vertical column) fields, have third argument false.

    For example: CASE 1 FIELDS
      [
        ["supunay#6696 (312485288150827010), 20 :cherry_blossom: for invitinig arsenic 33"],
        ["supunay#6696 (312485288150827010), 32 :cherry_blossom: for https://lichess.org/tournament/qUXhP7Hg"],
        ["supunay#6696 (312485288150827010), 32 :cherry_blossom: for https://lichess.org/tournament/qUXhP7Hg"]
      ]
    will return an embed that looks like this:
      "fields": [
        {
          "name": "#1 supunay#6696 (312485288150827010)",
          "value": "20 :cherry_blossom: for invitinig arsenic 33",
          "inline": false
        },
        {
          "name": "#2 supunay#6696 (312485288150827010)",
          "value": "32 :cherry_blossom: for https://lichess.org/tournament/qUXhP7Hg",
          "inline": false
        },
        {
          "name": "#2 supunay#6696 (312485288150827010)",
          "value": "32 :cherry_blossom: for https://lichess.org/tournament/qUXhP7Hg",
          "inline": false
        }
      ]
    which looks very neat, but on the other hand is space-limited by the 2000 character limit.

    On the other hand, an array looking like this: CASE 2 DESCRIPTION
      [
        ["Vempele 2646"],
        ["schaker 2643"],
        ["Mugwort 2559"],
        ["MMichael 2556"],
        ["penguingm1 2530"],
        ["mastertan 2493"],
        ["schwinggggg 2452"],
        ["MeneerMandje 2449"],
        ["TcubesAK 2445"],
        ["titsinablender 2433"]
      ]
    will return an embed description that looks like this:
      "#1 Vempele 2646\n" +
      "#2 schaker 2643\n" +
      "#3 Mugwort 2559\n" +
      "#4 MMichael 2556\n" +
      "#5 penguingm1 2530\n" +
      "#6 mastertan 2493\n" +
      "#7 schwinggggg 2452\n" +
      "#8 MeneerMandje 2449\n" +
      "#9 TcubesAK 2445\n" +
      "#10 titsinablender 2433"
    Which is space efficient, but less customisation with the titles.

    An array can contain both, in which case the leaderboard will be parsed for description to the extent that an array[i][1] is detected.
    For instance: CASE 3 MIXED
      [
        ["Revamp LAZYbot to use classes!"],
        ["Add voting features"],
        ["Optimise classes"],
        ["Submitted by chuckmoulton#2381", "Set default bug source to chess.com"],
        ["Submitted by TheLoneWolf#4001", "Set 'mod' role to Admin."],
        ["Set nowplaying() listeners to accept twitch streams"],
        ["Add twitch streamers to profiles"],
        ["Submitted by titsinablender#1754", "Eighth place is best place."]
      ]
    will produce an embed that looks like this:
      {
        "description":
          "#1 Revamp LAZYbot to use classes!\n" +
          "#2 Add voting features\n" +
          "#3 Optimise classes",
        "fields": [
          {
            "name": "#4 Submitted by chuckmoulton#2381",
            "value": "Set default bug source to chess.com",
            "inline": false
          },
          {
            "name": "#5 Submitted by TheLoneWolf#4001",
            "value": "Set 'mod' role to Admin.",
            "inline": false
          },
          {
            "name": "#6",
            "value": "Set nowplaying() listeners to accept twitch streams",
            "inline": false
          },
          {
            "name": "#7",
            "value": "Add twitch streamers to profiles",
            "inline": false
          },
          {
            "name": "#8 Submitted by titsinablender#1754",
            "value": "Eighth place is best place.",
            "inline": false
          },
        ]
      }
    
    So hope this makes it memorable now.
    Double embeds can be annoying and complicated so make sure to include line breaks to add clarity and well-formatted for(let loops.

  VALID EMBED.GETFIELDS INPUT FORMATS {
    double array, each item in outer array is an array of three parts: the title, the value, and whether it is inline or not.
    skip a line between each for clarity.
    ex:
    [
        ["a.k.a.", this.aliases, false],
        [(this.dbuser.modverified ? " " + this.Search.getEmoji(this.dbuser.modverified[0]) : "") + "Info", this.info, true],
        ["Joined Date", this.joined, this.info ? true: false],
        ["Index", this.ids, this.dbuser.messages ? true : false],
        ["Messages Sent", this.dbuser.messages.toLocaleString(), true],
        ["Last Message", this.lastMessage, false],
        ["House Trophies", this.award, true]
    ]
  }
  */

};

module.exports = Embed;