let tbody = document.getElementById('table_body');

loadJSON('/data/donors.json', (data) => {
	let Message = JSON.parse(data);
	for (let [donorName, data] of Object.entries(Message)) try {
		//Name
		let th = document.createElement('th');
		th.scope = 'row';
		th.innerHTML = donorName;

		//Info
		let lastTimestamp = 0, totalAmount = 0;
		for (let [timestamp, amount] of Object.entries(data)) {
			if (timestamp > lastTimestamp) lastTimestamp = timestamp;
			totalAmount += amount;
		}
		let desc = document.createElement('td');
		desc.innerHTML = '£' + totalAmount.toFixed(2);
		let sum = document.createElement('td');
		sum.innerHTML = new Date(parseInt(lastTimestamp)).toString().slice(3, 15);
		
		let row = tbody.insertRow();
		row.appendChild(th);
		row.appendChild(desc);
		row.appendChild(sum);
	} catch (e) {
		if (e) console.error(e);
	}
});

function loadJSON(file, callback) {
	var xobj = new XMLHttpRequest();
	xobj.open('GET', file, true);
	xobj.onreadystatechange = function () {
		if (this.readyState == 4 && this.status == '200') callback(this.responseText);
	};
	xobj.send();
}