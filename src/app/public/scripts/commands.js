let tbody = document.getElementById('commands_body');
const prefixes = new Map([
	['generic', '!'],
	['nadeko', '.']
]);

loadJSON('/commands/message.json', (data) => {
	let Message = JSON.parse(data);
	for (let [Module, data] of Object.entries(Message)) {
		for (let c of data) try {
			if (!Array.isArray(c.aliases)) continue;
			let prefix = prefixes.get(c.prefix);
			let th = document.createElement('th');
			let name = document.createTextNode(prefix + c.aliases[0]);
			th.appendChild(name);
			let desc = document.createElement('td');
			let text1 = document.createTextNode(c.description);
			desc.appendChild(text1);
			let usage = document.createElement('td');
			let str = '';
			for (let u of c.usage) {
				str += prefix + u;
			}
			let text2 = document.createTextNode(str);
			usage.appendChild(text2);
			let row = tbody.insertRow();
			row.appendChild(th);
			row.appendChild(desc);
			row.appendChild(usage);
		} catch (e) {
			if (e) console.error(e);
		}
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