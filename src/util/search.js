const config = require("../config.json");
const DBuser = require("./dbuser.js");

class Search {

  constructor(message) {
    this.client = message.client;
    this.guild = message.guild || this.client.guilds.get(config.houseid);
  }

  get(searchstring, exactmode) {
    let user = "";
    if(searchstring.length >= 3) {
      if(!user) user = this.getfromid(searchstring);
      if(!user) user = this.getfromusername(searchstring, exactmode);
      if(!user) user = this.getfromtag(searchstring);
      if(!user) user = this.getfromnickname(searchstring, exactmode);
      if(!user) user = this.getfromaliases(searchstring, exactmode);
    };
    return user;
  }

  getfromid(snowflake) {
    let id = snowflake.match(/[0-9]{18}/);
    return id ? this.client.users.find(user => id[0] === user.id) : "";
  }

  getfromusername(string, exactmode) {
    return this.client.users.find(user => exactmode ? user.username.toLowerCase() === string.toLowerCase() : user.username.toLowerCase().startsWith(string.toLowerCase())) || "";
  }

  getfromtag(string) {
    return this.client.users.find(user => string.toLowerCase() === user.tag.toLowerCase()) || "";
  }

  getfromnickname(string, exactmode) {
    return this.guild.members.find(member => member.nickname && (exactmode ? member.nickname.toLowerCase() === string.toLowerCase() : member.nickname.toLowerCase().startsWith(string.toLowerCase()))) || "";
  }

  getfromaliases(searchstring, exactmode) {
    let dbuser = DBuser.getfromaliases(searchstring, exactmode);
    return dbuser ? this.getfromid(dbuser.id) : "";
  }

  getMember(user) {
    if(typeof user === "string") user = this.get(user);
    return this.getMemberfromUser(user);
  }

  getMemberfromUser(user) {
    return this.guild.members.find(member => user.id === member.id) || "";
  }

  getChannel(searchstring) {
    let channel = "";
    if(searchstring.length >= 2) {
      if(!channel) channel = this.getChannelfromid(searchstring);
      if(!channel) channel = this.getChannelfromname(searchstring);
    }
    return channel;
  }

  getChannelfromid(id) {
    return this.guild.channels.find(channel => id === channel.id) || "";
  }
  
  getChannelfromname(name) {
    return this.guild.channels.find(channel => name.toLowerCase() === channel.name.toLowerCase()) || "";
  }

  getRole(name) {
    return this.guild.roles.find(role => name.toLowerCase() === role.name.toLowerCase()) || "";
  }

  getEmoji(name) {
    return this.client.emojis.find("name", name) || "";
  }

  getmemberRoles(member) {
    return (member.roles || []).map(role => role.name) 
  }

}

module.exports = Search;