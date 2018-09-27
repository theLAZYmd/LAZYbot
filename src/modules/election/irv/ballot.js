class Ballot { //create a bunch of properties for this instance/object. Cache each one for the object = if it's calced before, don't calc again.

  constructor(ballot) {
    this.ballot = ballot;
  }

  //IDs to identify vote, server and channel of the this.ballot.

  get ids() { // returns an array of the three ex: ["185412969130229760", "314155682033041408", "racing-kings"]
    if (!this._matches) this._matches = this.ballot.match(/^#VoterID: ([0-9]{18})$\n^#ServerID: ([0-9]{18})$\n^#Channel: ([\w-]+)$/m).slice(1);
    return this._matches;
  }

  get voter() {
    return this.ids[0];
  }

  get server() {
    return this.ids[1];
  }

  get channel() {
    return this.ids[2];
  }

  //Vote information

  get lines() { // returns an array of voting lines ["[1] samoyd#2402", "[] Gopnik#4031", "[2] okei#1207", "[] Write-In", "[3] Blank Vote"]
    if (!this._lines) this._lines = this.ballot.match(/^\[(?:[0-9]*)\]\s(?:[\w\s]{2,32}#(?:[0-9]{4})|Write-In|Blank Vote)$/mg);
    return this._lines;
  }

  get raw() { // returns nested arrays of each lines placings vs name [["1", samoyd#2402"], ["", "Gopnik#4031"], ["2", okei#1207"], ["", "Write-In"], ["3", "Blank Vote"]]
    if (!this._raw) this._raw = this.lines.map(line => line.match(/^\[([0-9]*)\]\s([\w\s]{2,32}#(?:[0-9]{4})|Write-In|Blank Vote)$/m).slice(1));
    return this._raw;
  }

  get votes() {
    if (!this._votes) {
      this._votes = [false];
      for (let [index, tag] of this.raw)
        if (Number(index))
          this._votes[Number(index)] = tag ==="Blank Vote" ? "blank" : tag;
    }
	  return this._votes;
  }

  //error checking

  get zeroes() { //returns a boolean whether a checkbox was filled in with a [0] vote
    if (!this._zeroes) this._zeroes = !!this.votes[0]; //we set it to false. If a string has magically appeared in its place, return true
    return this._zeroes;
  }

  get writeIn() { //returns a boolean whether someone wrote a [1] or number in the Write-In box without changing the name
    for (let vote of this.votes)
      if (vote === "Write-In") return true;
    return false;
  }

  get ascending() { //returns a boolean whether the votes were done in ascending order
    for (let i = 1; i < this.votes.length; i++) {
      if (typeof this.votes[i] !== "string") return false;
    }
    return true;
  }

  get duplicates () { //returns a boolean whether the same number was used for more than one option, for instance: [["1", samoyd#2402"], ["1", okei#1207"]]
    let obj = {};
    for (let [index] of this.raw) {
      if (!index) continue;
      if (obj[index]) return true; //if the index already exists in the object
      else obj[index] = true;
    }
	  return false;
  }

  get spoiled () {
    return this.votes.length === 1;
  }

}

module.exports = Ballot;