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
      if(!user) user = this.byTag(searchstring);
      if(!user) user = this.byUsername(searchstring, exactmode);
      if(!user) user = this.byAliases(searchstring, exactmode);
      if(!user) user = this.byDisplayName(searchstring, exactmode);
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
    let user = null;
    user = this.client.users.find(user => user.username.toLowerCase() === string.toLowerCase());
    if (!user && !exactmode) user = this.client.users.find(user => user.username.toLowerCase().startsWith(string.toLowerCase()));
    return user;
  }

  byAliases(searchstring, exactmode) {
    let dbuser = DBuser.get(searchstring, exactmode);
    return dbuser ? this.byID(dbuser.id) : "";
  }

  byDisplayName(string, exactmode) {
    let member = null;
    member = this.guild.members.find(member => member.displayName.toLowerCase() === string.toLowerCase());
    if (!member && !exactmode) member = this.guild.members.find(member => member.displayName.toLowerCase().startsWith(string.toLowerCase()));
    return member ? member.user : null;
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

  byID(snowflake) {
    let id = snowflake.match(/[0-9]{18}/);
    return id ? this.client.channels.find(channel => id[0] === channel.id) : "";
  }
  
  byName(name) {
    return (this.guild || this._guild).channels.find(channel => channel.name && name.toLowerCase() === channel.name.toLowerCase()) || "";
  }

}

class Guild extends All {
  constructor(message) {
    super(message);
  }

  get(searchstring) {
    let guild = "";
    if(searchstring.length >= 2) {
      if(!guild) guild = this.byID(searchstring);
      if(!guild) guild = this.byName(searchstring);
    }
    return guild;
  }

  byID(snowflake) {
    let id = snowflake.match(/[0-9]{18}/);
    return id ? this.client.guilds.find(guild => id[0] === guild.id) : "";
  }
  
  byName(name) {
    return this.client.guilds.find(guild => guild.name && name.toLowerCase() === guild.name.toLowerCase()) || "";
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
    return this.client.emojis.find(emoji => emoji.name.replace(/[^a-z0-9]+/gi, "").toLowerCase() === name.replace(/[^a-z0-9]+/gi, "").toLowerCase()) || "";
  }

  byUnicode(searchstring) {
    let emoji = searchstring.match(/(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|[\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|[\ud83c[\ude32-\ude3a]|[\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/);
    return emoji && emoji[0] ? emoji[0] : "";
  }

}

class Search {
  constructor(message) {
    this.message = message;
  }

  get users () {
    return new User(this.message);
  }

  get members () {
    return new Member(this.message);
  }

  get channels () {
    return new Channel(this.message);
  }
  get guilds () {
    return new Guild(this.message);
  }

  get roles () {
    return new Role(this.message);
  }

  get emojis () {
    return new Emoji(this.message);
  }
}

module.exports = Search;