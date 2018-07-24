const Parse = require("../util/parse.js");
const CRFile = require("../data/customreactions.json");
const DataManager = require("../util/datamanager.js")

class CustomReactions extends Parse {

  constructor(message) {
    super(message);
    if((this.command.length === 3 && this.command[1] === "c") || (this.command.includes("custom"))) this._command = "text";
    if((this.command.length === 3 && this.command[1] === "e") || (this.command.includes("emoji"))) this._command = "emoji";
    this.CRData = CRFile[message.guild.id] ? CRFile[message.guild.id] : {
      "text": [],
      "emoji": []
    }
  }

  react (SearchArray, functionOnTrue) { //router
    for(let i = 0; i < SearchArray.length; i++) {
      if(this.message.content === SearchArray[i].trigger) {
        functionOnTrue(SearchArray[i].reaction)
        break;
      } else {
        for(let j = 0; j < this.args.length; j++) {
          if(SearchArray[i].anyword && this.args[j] === SearchArray[i].trigger) {
            functionOnTrue(SearchArray[i].reaction);
            break;
          }
        }
      }
    }
  }

  update (SearchArray, functionOnFound) { //router
    let foundboolean = false;
    for(let i = 0; i < SearchArray.length; i++) {
      if(SearchArray[i].trigger === this.args[0]) {
        functionOnFound(SearchArray[i]);
        foundboolean = true;
      };
      if(!SearchArray[i].trigger) {
        SearchArray.remove(i); //removes null ones
        i--;
      };
    };
    if(foundboolean) {
      this.message.react(this.Search.emojis.get("true"));
      this.onUpdate()
    }
    else this.message.react(this.Search.emojis.get("false"));
  }
  
  onUpdate() {
    CRFile[this.message.guild.id] = this.CRData;
    DataManager.setFile(CRFile, "./data/customreactions.json");
  }

  text () { //aplies to all messages
    this.react (this.CRData.text, (content) => this.Output.generic(content));
  }
  
  emoji () { // applies to all messages
    this.react (this.CRData.emoji, (emojiname) => this.message.react(this.Search.emojis.get(emojiname)))
  }

  add (args, argument) { //acr or aer
    let entry =  {
      "trigger": args[0],
      "reaction": argument.slice(args[0].length).trim(),
      "anyword": false
    };
    if(this.CRData[this._command][0]) this.CRData[this._command].push(entry);
    else this.CRData[this._command][0] = entry;
    this.message.react(this.Search.emojis.get("tick"));
    this.onUpdate();
  }
  
  edit (args, argument) { //ecr or eer
    this.update(this.CRData[this._command], (foundEntry) => {
      foundEntry.trigger = args[0];
      foundEntry.reaction = argument.slice(args[0].length).trim();
      foundEntry.anyword = false
    })
  }
  
  toggle () { //tcr or ter
    this.update(this.CRData[this._command], (foundEntry) => {
      foundEntry.anyword = !foundEntry.anyword;
    })
  }

  delete () { //dcr or der
    this.update(this.CRData[this._command], (foundEntry) => {
      foundEntry.trigger = null; //set its to null to be cleaned it up in the remove
    })
  }

}

module.exports = CustomReactions;

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
};