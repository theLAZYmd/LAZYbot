const Parse = require('../../util/parse');
const Embed = require('../../util/embed');
const DataManager = require('../../util/datamanager');
const Message = DataManager.getFile('./src/commands/message.json');
const fs = require('fs');

const regexes = {
	newline: /\r/g,
	title: /^#\s?([\w\s]+)[\n]/i,
	footer: /#\s?([\w\s]+)[\n]?$/i,
	section: / {2}-/g,
	text: /\w+/i
};

class Commands extends Parse {

	constructor(message) {
		super(message);
	}

	/**
	 * Parses the README file and returns it in embed format
	 * @public
	 */
	async about () {
		const readMe = fs.readFileSync('./README.md').toString().replace(regexes.newline, '');
		let title = readMe.match(regexes.title);
		let footer = readMe.match(regexes.footer) || [];    
		let sections = readMe.replace(footer[0], '').split('###');    
		let description = sections.shift().replace(title[0], '').trim() + '\n\u200b';
		let fields = sections.map((string) => {
			let arr = string.split('\n');
			let name = arr.shift();
			let value = arr.join('\n');
			let inline = false;
			return {   name, value, inline  };
		});
		for (let j = 0; j < fields.length; j++) {
			let f = fields[j];
			let length = f.value.length;
			if (length > 1024) {
				let index = Math.ceil(length / 1024);
				let divisor = Math.ceil(length / index);
				let arr = [];
				for (let i = 0; i < index - 1; i++) {
					arr.push(f.value.indexOf('\n', divisor * (i + 1)));
				}
				let array = arr.map((d) => {
					let i = arr.indexOf(d);
					let name = i === 0 ? f.name : '\u200b';
					let value = f.value.substring(arr[i - 1], d).replace(regexes.section, '\u200b       •');
					let inline = false;
					return {    name, value, inline    };
				});
				fields.splice(j, 1, ...array);
			}
			if (0 < j && regexes.text.test(f.name)) fields[j - 1].value += '\n\u200b';
		}
		let embed = new Embed()
			.setTitle(title[1])
			.setDescription(description)
			.setThumbnail(this.client.user.avatarURL)
			.setFooter(footer[1]);
		embed.fields = fields;
		this.Output.sender(embed);
	}

	/**
	 * Lists the available commands on the bot
	 * @param {string} Module
	 * @public
	 */
	async list(Module = this.argument) {
		const prefix = this.prefixes.get('generic');
		let Entries = Object.entries(Message);
		if (Module) {
			let m = Entries.find(([k]) => k.toLowerCase().startsWith(Module.toLowerCase()));
			if (!m) throw 'Invalid commands module specified ' + Module;
			Entries = Entries.filter(([k]) => k === m[0]);
		}
		const length = Entries.length;
		let embed = new Embed()
			.setColor(11126483)
			.setTitle(`Type "${prefix}h CommandName" to see help for a specified command. e.g. "${prefix}h ${prefix}profile"`);
		let i = 0;
		for (let [name, collection] of Entries) {
			let value = '';
			for (let [j, cmdInfo] of Object.entries(collection)) {
				let [command, alias] = cmdInfo.aliases;
				command = this.prefixes.get(cmdInfo.prefix) + command;
				let line = command + ' '.repeat(Math.max(1, 18 - command.length)) + //spacer, 18 allows 2 across per embed
                    '[' + (alias && alias.length <= 5 ? alias : '') + ']'; //spacer
				value += line;
				if (i < length - 1 || !(length & 1)) { //if we're not on the last module or we have an even number of modules
					value += '\n';
					continue;
				}
				if (j === collection.length - 1) continue; //if we're not at the last one of the group continue
				value += !(j & 1) ? ' '.repeat(Math.max(0, 28 - line.length)) + '\u200b' : '\n'; //spacer
			}
			embed.addField(name.toProperCase(), value.format('css'), true); //return arguments for field, - a field
			i++;
		}
		this.Output.sender(embed);
	}

}

module.exports = Commands;