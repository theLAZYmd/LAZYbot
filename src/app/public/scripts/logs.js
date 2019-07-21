const logs = ['data', 'debug', 'error'];

try {
	for (let log of logs) {
		let text = readTextFile('/logs/' + log + '.log');

		let header = document.createElement('h1');
		let t1 = document.createTextNode(log.toUpperCase() + ' LOG');
		header.appendChild(t1);
		document.body.appendChild(header);

		let body = document.createElement('h1');
		let t2 = document.createTextNode(text);
		body.appendChild(t2);
		document.body.appendChild(body);
	}
} catch (e) {
	alert(e);
}

function readTextFile(file) {
	var rawFile = new XMLHttpRequest();
	rawFile.open('get', file, false);
	rawFile.onreadystatechange = function () {
		if (rawFile.readyState === 4) {
			if (rawFile.status === 200 || rawFile.status == 0) {
				return rawFile.responseText;
			}
		}
	}
	rawFile.send(null);
}