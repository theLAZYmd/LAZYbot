const config = require("../config.json");
const Search = require("./search.js");

class Check extends Search {

  constructor(message) {
    super(message)
  }

  role(member, rolename) {
    let role = this.getRole(rolename)
    return member.roles.has(role.id);
  }

  owner(member) {
    let ownerboolean = false;
    for(let i = 0; i < config.ids.owner.length; i++) {
      if(member.id === config.ids.owner[i]) ownerboolean = true;
    };
    return ownerboolean;
  }

}

module.exports = Check;