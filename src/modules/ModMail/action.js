const Main = require('./main.js');
const Embed = require('../../util/embed');
const Logger = require('../../util/logger');

class Action extends Main {

	constructor(message) {
		super(message);
	}

	get output () {
		let outputConstructor = require('./output.js');
		return new outputConstructor(this.message);
	}

	/*data object {
	  "mod": false if it's a new user mail. Otherwise it's the user object of the mod who sent the message {
		"flair": true if new mail was sent with -s flag, or message was reacted with 🗣 emoji
	  },
	  "user": the user object of the conversation,
	  "name": appears for mod actions, outputted to name fields
	  "content": the last line of the conversation, to be processed
	  "message": the conversation. Exists when the new message is a reply and history is found.
	  "embed": message.embeds[0]. The embed to be sent.
	}*/

	async react(reaction, user) {
		try {
			let data = {
				mod: user,
				message: reaction.message,
				embed: new Embed(reaction.message.embeds[0])
			};
			data.user = this.Search.users.byTag(this.modmail[reaction.message.id].tag);
			if (!data.user) throw 'User **' + user.tag + '** no longer exists!';
			data.mod.flair = false;
			switch (reaction.emoji.name) {
				case '❎':
					this.close(data);
					break;
				case '🗣':
					data.mod.flair = true;
					this.reply(data);
					break;
				case '👤':
					data.mod.flair = false;
					this.reply(data);
					break;
				case '👁': //"seen"
					return; //"Don't remove the emoji"
				case '❗':
					this.warn(data);
					break;
				case '⏲':
					this.timeout(data);
					break;
			}
			reaction.remove(user);
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	async reply(data) {
		try {
			let msg = await this.Output.response({
				author: data.mod,
				description: '**' + data.mod.tag + '** Please type your response below (replying as ' + (data.mod.flair ? 'server' : 'yourself') + ')'
			}, true);
			let content = msg.content + ' ' + msg.attachments.map(([,a]) => '[Attachment](' + a.url + ')').join(' ');
			if (content.length > 1024) throw 'Your message must be less than 1024 characters!\nPlease shorten it by **' + (content.length - 1024) + '** characters.';
			else data.content = content; //DATA.CONTENT SET
			msg.delete();
			data.command = 'reply';
			this.output.amend(data);
			this.output.send(data);
			this.log(data);
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	async close(data) {
		try {
			await this.Output.confirm({
				action: 'closing conversation for user **' + data.user.tag + '**',
				author: data.mod
			});
			for (let id of Object.keys(this.modmail)) {
				if (this.modmail[id].tag === data.user.tag) {
					try {
						let msg = await this.mchannel.fetchMessage(id);
						msg.delete();
					} catch (e) {
						return '';
					}
					delete this.modmail[id];
				}
			}
			this.setData(this.modmail);
			this.Output.generic('**' + data.mod.tag + '** closed the ModMail conversation for **' + data.user.tag + '**.');
			data.command = 'close';
			this.log(data);
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	async warn(data) {
		try {
			await this.Output.confirm({
				action: 'warning for user **' + data.user.tag + '**',
				author: data.mod
			});
			Object.assign(data, {
				title: 'Warning from server ' + this.guild.name + ':',
				content: 'You are abusing server modmail. Please be polite and do not spam the inbox.',
				command: 'warn',
				name: 'On ' + Date.getISOtime(Date.now()) + ', ' + data.mod.tag + ' warned user.'
			});
			this.output.moderate(data);
			this.output.send(data);
			this.log(data);
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

	async timeout(data) {
		try {
			await this.Output.confirm({
				action: 'timeout for user **' + data.user.tag + '**',
				author: data.mod
			});
			Object.assign(data, {
				title: 'You have been timed out from sending messages to server ' + this.guild.name + ':',
				content: 'The mod team will not receive your messages for 24 hours.',
				command: 'timeout',
				name: 'On ' + Date.getISOtime(Date.now()) + ', ' + data.mod.tag + ' timed out user for 24h.'
			});
			if (!this.modmail._timeout) this.modmail._timeout = {};
			this.modmail._timeout[data.user.tag] = Date.now();
			this.setData(this.modmail);
			this.output.moderate(data);
			this.output.send(data);
			this.log(data);
		} catch (e) {
			if (e) this.Output.onError(e);
		}
	}

}

module.exports = Action;