class Main {

	static rank(candidates, votes) { //main input, votes = [423, 124, 12, 1342], candidates = [1, 2, 3, 4, 5, 6]
		try {
			/*
			[ '319901088557957122',
			  '414816252733685760',
			  'blank',
			  '356192671750029313' ],
				[ '0', '0', '10', '2', '03', '', '0', '03', '0', '0', '0', '0' ]
			 */
			let data = {
				"count": candidates.length,
				"candidates": candidates.slice(0),
				"eliminated": [],
				"finished": false,
				"votes": votes.slice(0),
				"cycle": 0
			};
			while (!data.finished) {
				data = Main.cycle(data);
			}
			let order = data.eliminated.reverse(); /*
			for (let i = 0; i < order.length; i++) {
				let t = order[i].split("");
				if (t.length < 2) continue;
				let _data = {
					"count": candidates.length,
					"candidates": candidates,
					"eliminated": [],
					"eliminate": candidates.filter(c => !t.includes(c.toString())),
					"finished": false,
					"votes": votes,
					"cycle": 0
				};
				while (!_data.finished)  {
					_data = Main.cycle(_data);
				}
				order.splice(i, 1, _data.eliminated.reverse());
			}*/
			return order;
		} catch (e) {
			if (e) throw e;
		}
	}

	static cycle(data) {
		try {
			let m = Main.getMap(data.votes, data.candidates); //create a new map from {  candidates => no. of first preference votes for candidate }
			let removeList = data.cycle === 0 && data.eliminate ? data.eliminate : Main.findElims(m);
			for (let r of removeList) { //for everyone that needs to be removed
				data.votes = Main.remove(r, data.votes);
				data.candidates = Main.eliminate(r, data.candidates);
			}
			data.eliminated.push(removeList.join(""));
			if (data.eliminated.join("").length === data.count) data.finished = true;
			console.log('Cycle ' + data.cycle + "; " + "Eliminated: " + data.eliminated.join("").length + ", Target: " + data.count + "\n",
				m,
				//"\nEliminated Candidates: '" + data.eliminated.join("', '") + "'"
			);
			data.cycle++;
			return data;
		} catch (e) {
			if (e) throw e;
		}
	}

	/*
		Cycle 0; Eliminated: 1, Target: 4
		Map { '0' => 9, '1' => 1, '2' => 1, '3' => 0 }
		Eliminated Candidates: '3'
		Cycle 1; Eliminated: 3, Target: 4
		Map { '0' => 9, '1' => 1, '2' => 1 }
		Eliminated Candidates: '3', '12'
		Cycle 2; Eliminated: 4, Target: 4
		Map { '0' => 10 }
		Eliminated Candidates: '3', '12', '0'
		[ '0', '12', '3' ]
	 */

	static getMap(votes, candidates) { //returns a map based on first preference votes
		let range = new Map(); //creates an map []
		for (let c of candidates) {
			range.set(c.toString(), 0); //sets array index(candidate) value(0), ex: [1: 0, 2: 0]
		}
		for (let v of votes) {
			let initVote = v.charAt(0); //first preference vote
			if (initVote !== '') {
				let mapGet = range.get(initVote);
				if (mapGet !== undefined) range.set(initVote, mapGet + 1);
			}
		}
		return range; //ex: [1: 4, 2: 7...] etc.
	}

	static remove(r, votes) {
		for (let i = 0; i < votes.length; i++) {
			votes[i] = votes[i].replace(r, "");
		}
		return votes;
	}

	static eliminate(r, candidates) {
		candidates.splice(candidates.map(c => c.toString()).indexOf(r), 1);
		return candidates;
	}

	static findElims(map) {
		let zeroes = Array.from(map).filter(([, v]) => v === 0).map(([k]) => k);
		if (zeroes.length !== 0) return zeroes;
		let lowest = [];
		let lowestValue = Infinity;
		map.forEach((value) => {
			if (value < lowestValue) lowestValue = value;
		});
		map.forEach((v, k) => {
			if (v === lowestValue) lowest.push(k);
		});
		return lowest;
	}

	static findHighest(map) { //for STV stuff
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

module.exports = Main;