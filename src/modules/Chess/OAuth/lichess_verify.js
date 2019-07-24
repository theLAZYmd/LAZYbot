const {		Builder, By, Key, until		} = require('selenium-webdriver');
require('chromedriver');
const { lichess } = require('./config.json');
var { username, password, subject, body, recipients } = lichess;
let driver = new Builder().forBrowser('chrome').build();
const Logger = require('../../../util/logger.js');

class Verify {

	constructor (_recipients = recipients) {
		(async ($recipients) => {
			let x = await Verify.login();
			if (!x) return;
			for (let r of $recipients) {
				await Verify.linkToPage();
				await Verify.sendMessage(r);
			}
		})(_recipients);
	}

	static async login () {
		try {
			await driver.get('https://lichess.org/login?referrer=/');
			await driver.wait(until.titleIs('Sign in • lichess.org'), 1000);            
			await driver.findElement(By.name('username')).sendKeys(username, Key.RETURN);
			await driver.findElement(By.name('password')).sendKeys(password, Key.RETURN);
			await driver.findElement(By.className('submit button text')).click();
			await driver.wait(until.titleIs('lichess.org • Free Online Chess'), 1000);
			return true;
		} catch (e) {
			if (e) Logger.error(e);
		}
	}

	static async navigateToPage() { //not too sure this static works
		try {
			await driver.findElement(By.partialLInk('dasher shown')).click();
			await driver.findElement(By.linkText('/inbox')).click();            
			await driver.wait(until.titleIs('Inbox • lichess.org'), 1000);
			await driver.findElement(By.className('goto_compose button text')).click();            
			await driver.wait(until.titleIs('Compose message • lichess.org'), 1000);
		} catch (e) {
			if (e) Logger.error(e);
		}
	}

	static async linkToPage() {
		try {
			await driver.get('https://lichess.org/inbox/new');          
			await driver.wait(until.titleIs('Compose message • lichess.org'), 1000);
		} catch (e) {
			if (e) Logger.error(e);
		}
	}

	static async sendMessage(r) {
		try {
			await driver.findElement(By.name('username')).sendKeys(r, Key.RETURN);
			await driver.findElement(By.name('subject')).sendKeys(subject, Key.RETURN);
			await driver.findElement(By.name('text')).sendKeys(body, Key.RETURN);
			await driver.findElement(By.className('send button')).click();
			await driver.wait(until.titleIs(subject + ' • Free Online Chess'), 1000);                
			Logger.verbose('Done for ' + r + '!');
		} catch (e) {
			if (e) Logger.error(e);
		}
	}
}

new Verify();

module.exports = Verify;

String.prototype.reverse = function () {
	return this.split('').reverse().join('');
};