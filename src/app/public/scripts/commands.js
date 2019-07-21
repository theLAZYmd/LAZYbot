let tbody = document.getElementById('commands_body');
const prefixes = new Map([
	['generic', '!'],
	['nadeko', '.']
]);

loadJSON('/commands/message.json', (data) => {
	let Message = JSON.parse(data);
	for (let [moduleName, data] of Object.entries(Message)) {
		for (let c of data) try {
			if (!Array.isArray(c.aliases)) continue;
			let prefix = prefixes.get(c.prefix);
			let th = document.createElement('th');
			let cmds = c.aliases.reduce((acc, curr, i) => acc += (curr.split(/\s+/).length < 2 ? prefix : '') + curr + (i < c.aliases.length - 1 ? ', ' : '\n'), '');
			let name = document.createTextNode(cmds);
			th.appendChild(name);
			let mod = document.createElement('span');
			let moduleText = document.createTextNode(moduleName);
			mod.appendChild(moduleText);
			mod.className = 'module';
			th.appendChild(mod);
			th.scope = 'row';
			let desc = document.createElement('td');
			let description = c.description;//.replace(/\[([\w\s]+)]\((https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*))/g, (match, text, url) => text.link(url));
			let text1 = document.createTextNode(description);
			desc.appendChild(text1);
			let usage = document.createElement('td');
			let str = (c.usage || []).reduce((acc, curr) => acc += prefix + curr + '\n', '');
			let text2 = document.createTextNode(str);
			usage.appendChild(text2);
			let row = tbody.insertRow();
			row.appendChild(th);
			row.appendChild(desc);
			row.appendChild(usage);
			row.id = 'command_' + c.aliases[0];
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