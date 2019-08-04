let uri = window.location.href;
const params = new URLSearchParams(uri.split('?').slice(1).join('?'));

loadJSON('/profile/' + params.get('state'))
	.then((buffer) => {
		let json = JSON.parse(buffer);
		let data = Object.entries(json);
		let element = document.getElementById('profile_data');
		let table = document.createElement('table');
		let [key, id] = data.shift();
		let thead = document.createElement('thead');
		let col1 = document.createElement('th');
		col1.innerHTML = key.toUpperCase();
		col1.scope = 'col';
		let col2 = document.createElement('th');
		col2.innerHTML = id;
		col2.scope = 'col';
		let row = thead.insertRow();
		row.appendChild(col1);
		row.appendChild(col2);
		table.appendChild(thead);
		for (let [k, v] of data) {
			let th = document.createElement('th');
			th.innerHTML = toProperCase(k);
			th.scope = 'row';
			let td = document.createElement('td');
			td.innerHTML = typeof v === 'object' ? JSON.stringify(v, null, 4) : v.toString();
			let tbody = document.createElement('tbody');
			let row = tbody.insertRow();
			row.appendChild(th);
			row.appendChild(td);
			table.appendChild(tbody);
		}
		element.appendChild(table);
	})
	.catch(console.error);

function loadJSON(file) {
	//eslint-disable-next-line no-unused-vars
	return new Promise((res, rej) => {
		var xobj = new XMLHttpRequest();
		xobj.open('GET', file, true);
		xobj.setRequestHeader('Cache-Control', 'no-cache, must-revalidate, post-check=0, pre-check=0');
		xobj.onreadystatechange = function () {
			if (this.readyState == 4 && this.status == '200') res(this.responseText);
		};
		xobj.send();
	});
}

//eslint-disable-next-line no-unused-vars
function loadJSONsync(file, callback) {
	var xobj = new XMLHttpRequest();
	xobj.setRequestHeader('Cache-Control', 'no-cache, must-revalidate, post-check=0, pre-check=0');
	xobj.open('GET', file, true);
	xobj.onreadystatechange = function () {
		if (this.readyState == 4 && this.status == '200') callback(this.responseText);
	};
	xobj.send();
}

function toProperCase (string) {
	let words = string.replace(/[A-Z]/, (letter) => ' ' + letter).split(/ +/g);
	let newArray = [];
	for (let i = 0; i < words.length; i++) {
		newArray[i] = words[i][0].toUpperCase() + words[i].slice(1, words[i].length).toLowerCase();
	}
	let newString = newArray.join(' ');
	return newString;
}