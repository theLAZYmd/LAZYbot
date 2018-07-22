const Parse = require("../util/parse.js");
const DBuser = require("../util/dbuser.js");

class ASL extends Parse {

  constructor(message) {
    super(message);
  }

  run () {
    if(this.args.length === 0) this.output();
    else if(this.args.length === 1) {
      if(this.args[0] === "clear") { //clear asl values
        if(this.dbuser.age) delete tally[dbindex].age;
        if(this.dbuser.sex) delete tally[dbindex].sex;
        if(this.dbuser.location) delete tally[dbindex].location;
        if(this.dbuser.modverified) delete tally[dbindex].modverified; //delete mod given tick
        DBuser.setData(dbuser);
        this.Output.generic(`Data on **age**, **sex**, and **location** cleared for **${this.user.tag}**.`)
      } else {
        this.Output.onError("Incorrect number of parameters specified. Please specify **age**, **sex**, and **location**.");
      }; //otherwise number of paramters is just wrong
    } else
    if(this.args.length === 3) {
      let [age, sex, location] = this.args;
      if(isNaN(Number(age)) && age !== "-") return this.Output.onError(`Please specify a number for **age**.`);
      age = age === "-" ? "" : age;
      sex = sex === "-" ? "" : sex.toLowerCase();
      location = location === "-" ? "" : location.toProperCase();
      if(!age) delete this.dbuser.age; else this.dbuser.age = age; //if "-" argument, delete it, otherwise set it
      if(!sex) delete this.dbuser.sex; else this.dbuser.sex = sex;
      if(!location) delete this.dbuser.location; else this.dbuser.location = location;
      if(this.dbuser.modverified) delete tally[dbindex].modverified;
      DBuser.setData(this.dbuser);
      this.output();
    }
  }

  output () {
    let asl = "", aslarray = [];
    aslarray.push(
      this.dbuser.age ? `**${this.dbuser.age}** years old` : ``,
      this.dbuser.sex ? `**${this.dbuser.sex}**` : ``,
      this.dbuser.location ? `from **${this.dbuser.location}**` : ``
    );
    aslarray.clean();
    for(let i = 0; i < aslarray.length; i++) {
      if(!aslarray[i]) aslarray.remove(i);
      asl += aslarray[i] +
        (i >= aslarray.length -1 ? "" :
          (i < aslarray.length -2 ? ", " : 
            (aslarray.length === 3 ? "," : ``) +
          " and ")
        ); //punctuation, just go with it
    };
    if(asl) this.Output.generic(`Hello **${this.author.username}**, I see you're ${asl}.`);
    else this.Output.onError(`No **age**, **sex**, and **location** found, please specify.`);
  }

}

module.exports = ASL;

String.prototype.toProperCase = function() {
  let words = this.split(/ +/g);
  let newArray = [];
  for(let i = 0; i < words.length; i++) {
    newArray[i] = words[i][0].toUpperCase() + words[i].slice(1, words[i].length).toLowerCase();
  }
  let newString = newArray.join(" ");
  return newString;
}

Array.prototype.clean = function() {
  for(let i = 0; i < this.length; i++) {
    if(!this[i]) {
      this.splice(i, 1);
      i--;
    }
  }
  return this;
}

Array.prototype.remove = function(index) {
  if(!index && index !== 0) return;
  if(Array.isArray(index)) {
    index.sort(function(a, b) {
      return b - a;
    })
    for(let i = 0; i < index.length; i++) {;
      this.splice(index[i], 1);
    }
  } else {
    this.splice(index, 1);
  }
  return this;
}