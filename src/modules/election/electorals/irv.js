
class IRV {

  static rank(votes, candidates) { //main input, votes = [423, 124, 12, 1342], candidates = [1, 2, 3, 4, 5, 6]
    let data = {
        "count": candidates.length,
        "candidates": candidates,
        "eliminated": [],
        "finished": false,
        "votes": votes,
      },
      order = "";
    let i = 0;
    while (!data.finished) {
      console.log('Cycle ' + i);
      data.cycle = i;
      data = AV.cycle(data);
      i++;
    };
    order = data.eliminated.reverse();
    console.log(order);
    return order;
  }

  static cycle(data) {
    let resultsMap = AV.getMap(data.votes, data.candidates); //create a new map from votes and candidates
    console.log(resultsMap);
    let toRemoveList = AV.findElims(resultsMap);
    for (let i = 0; i < toRemoveList.length; i++) { //for everyone that needs to be removed
      let toRemove = toRemoveList[i]; //take the single person who needs to be removed
      data.votes = AV.iterate(toRemove, data.votes);
      let index = -1;
      for (let j = 0; j < data.candidates.length; j++) {
        if (data.candidates[j].toString() === toRemove.toString()) index = j;
      };
      data.candidates.splice(index, 1);
    };
    resultsMap = AV.getMap(data.votes, data.candidates); //create a new map from votes and candidates
    console.log(resultsMap);
    data.eliminated[data.cycle] = toRemoveList.join("");
    if (data.eliminated.join("").length === data.count) data.finished = true;
    return data;
  }

  static getMap(votes, candidates) { //returns a map based on first preference votes
    let range = new Map(); //creates an map []
    for (let i = 0; i < candidates.length; i++) {
      range.set(candidates[i].toString(), 0); //sets array index(candidate) value(0), ex: [1: 0, 2: 0]
    };
    for (let i = 0; i < votes.length; i++) {
      let initVote = votes[i].charAt(0); //first preference vote
      if (initVote !== '') {
        let mapGet = range.get(initVote);
        if (mapGet === undefined) range.set(initVote, 1);
        else range.set(initVote, mapGet + 1);
      }
    }
    return range; //ex: [1: 4, 2: 7...] etc.
  }

  static iterate(toRemove, votes) {
    for (let i = 0; i < votes.length; i++) {
      votes[i] = votes[i].replace(toRemove, "");
    };
    return votes;
  }

  static findElims(map) {
    let elims = [];
    if (!elims[0]) elims = AV.findZeroes(map);
    if (!elims[0]) elims = AV.findLowest(map);
    return elims;
  }

  static findZeroes(map) { //
    let zeroes = [];
    map.forEach((value, key) => {
      if (value === 0) zeroes.push(key);
    });
    return zeroes;
  }

  static findLowest(map) { //edited so that they return arrays now, not single instances
    let lowest = [];
    let lowestValue = Infinity;
    map.forEach((value, key) => {
      if (value < lowestValue) lowestValue = value;
    });
    map.forEach((value, key) => {
      if (value === lowestValue) lowest.push(key);
    });
    return lowest;
  }

  static findHighest(map) { //
    let highest = [];
    let highestValue = 0;
    map.forEach((value, key) => {
      if (value < highestValue) {
        lowest.push([key]);
        highestValue = value;
      }
    });
    return highest;
  }

  static mapConcat(map) {
    let range = true;
    map.forEach(function (value, key) {
      range += value;
    });
    return range;
  }

}

module.exports = IRV;