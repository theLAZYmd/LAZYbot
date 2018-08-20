const config = require("../config.json");
const DBuser = require("./dbuser.js");
const Parse = require("./parse.js");

class All extends Parse {
  constructor(message) {
    super(message);
  }
}

class User extends All {
  constructor(message) {
    super(message);
  }

  get(searchstring, exactmode) {
    let user = "";
    if(typeof searchstring !== "string") return "";
    if(searchstring.length >= 2) {
      if(!user) user = this.byID(searchstring);
      if(!user) user = this.byUsername(searchstring, exactmode);
      if(!user) user = this.byTag(searchstring);
      if(!user) user = this.byAliases(searchstring, exactmode);
      if(!user) user = this.byNickname(searchstring, exactmode);
    };
    return user;
  }

  byID(snowflake) {
    let id = snowflake.match(/[0-9]{18}/);
    return id ? this.client.users.find(user => id[0] === user.id) : "";
  }

  byTag(string) {
    return this.client.users.find(user => string.toLowerCase() === user.tag.toLowerCase()) || "";
  }

  byUsername(string, exactmode) {
    return this.client.users.find(user => exactmode ? user.username.toLowerCase() === string.toLowerCase() : user.username.toLowerCase().startsWith(string.toLowerCase())) || "";
  }

  byAliases(searchstring, exactmode) {
    let dbuser = DBuser.get(searchstring, exactmode);
    return dbuser ? this.byID(dbuser.id) : "";
  }

  byNickname(string, exactmode) {
    return this.guild.members.find(member => member.nickname && (exactmode ? member.nickname.toLowerCase() === string.toLowerCase() : member.nickname.toLowerCase().startsWith(string.toLowerCase()))) || "";
  }

}

class Member extends All {
  constructor(message) {
    super(message);
  }

  get(searchstring, exactmode) {
    let member = "";
    let user = (new User(this.message)).get(searchstring, exactmode);
    if(user) searchstring = user;
    member = this.byUser(searchstring);
    return member;
  }

  byUser(user) {
    return this.guild.members.find(member => member.id === user.id);
  }

  getRoles(member) {
    return (member.roles || []).map(role => role.name) 
  }

  getOnline() {
    return this.guild.members.filter(member => !!member.presence.status.match(/online|idle|dnd/));
  }

}

class Channel extends All {
  constructor(message) {
    super(message);
  }

  get(searchstring) {
    let channel = "";
    if(searchstring.length >= 2) {
      if(!channel) channel = this.byID(searchstring);
      if(!channel) channel = this.byName(searchstring);
    }
    return channel;
  }

  byID(id) {
    return this.guild.channels.find(channel => id === channel.id) || "";
  }
  
  byName(name) {
    return this.guild.channels.find(channel => name.toLowerCase() === channel.name.toLowerCase()) || "";
  }

}

class Role extends All {
  constructor(message) {
    super(message);
  }

  get(searchstring) {
    let role = "";
    if(searchstring.length >= 2) {
      if(!role) role = this.byID(searchstring);
      if(!role) role = this.byName(searchstring);
    }
    return role;
  }

  byID(id) {
    return this.guild.roles.find(role => id === role.id) || "";
  }
  
  byName(name) {
    return this.guild.roles.find(role => name.toLowerCase() === role.name.toLowerCase()) || "";
  }

}

class Emoji extends All {
  constructor(message) {
    super(message);
  }

  get(searchstring) {
    let emoji = "";
    if(searchstring.length >= 2) {
      if(!emoji) emoji = this.byID(searchstring);
      if(!emoji) emoji = this.byName(searchstring);
      if(!emoji) emoji = this.byUnicode(searchstring);
    };
    return emoji;
  }

  byID(id) {
    return this.client.emojis.find(emoji => id === emoji.id) || "";
  }
  
  byName(name) {
    return this.client.emojis.find(emoji => emoji.name.replace(/[^a-z0-9]+/gi, "") === name.replace(/[^a-z0-9]+/gi, "")) || "";
  }

  byUnicode(searchstring) {
    let emoji = searchstring.match(/(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|[\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|[\ud83c[\ude32-\ude3a]|[\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/);
    return emoji && emoji[0] ? emoji[0] : "";
  }

}

class Search {
  constructor(message) {
    this.client = message.client;
    this.guild = message.guild || this.client.guilds.get(config.houseid);
    this.users = new User(message);
    this.members = new Member(message);
    this.channels = new Channel(message);
    this.roles = new Role(message);
    this.emojis = new Emoji(message);
  }
}

module.exports = Search;