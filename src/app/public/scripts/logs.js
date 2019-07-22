let container = document.getElementById('container');
let log_box = document.getElementById('ll0');
let log_link1 = document.getElementById('ll1');
let log_link2 = document.getElementById('ll2');
let expando = false;

container.onmouseover = function() {
	transition_right(log_link1);
	transition_right(log_link2);
};

container.onmouseleave = function() {
	transition_left(log_link1);
	transition_left(log_link2);
};

log_box.onclick = function() {
	if (!expando) container.onmouseover();
	else container.onmouseleave();
};

let link1 = document.getElementById('link1');
let link2 = document.getElementById('link2');

log_link1.onclick = function(e) {
	if (this === e.target) link1.click();
};

log_link2.onclick = function(e = window.event) {
	if (this === e.target) link2.click();
};

function transition_right(element) {
	element.style.width = '100%';
	element.style.left = 100;
	element.style.overflow = 'visible';
	expando = true;
}

function transition_left(element) {
	element.style.width = 0;
	element.style.left = '100%';
	element.style.overflow = 'hidden';
	expando = false;
}

/*
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
*/
