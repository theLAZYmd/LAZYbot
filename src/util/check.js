const config = require("../config.json");
const Search = require("./search.js");

class Check extends Search {

  constructor(message) {
    super(message)
  }

  role(member, rolename) {
    let role = this.roles.get(rolename);
    return member.roles.has(role.id);
  }

  owner(author) {
    let ownerboolean = false;
    for(let i = 0; i < config.ids.owner.length; i++) {
      if(author.id === config.ids.owner[i]) ownerboolean = true;
    }
	  return ownerboolean;
  }

}

module.exports = Check;