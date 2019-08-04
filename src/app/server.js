const express = require('express');
const path = require('path');
const simpleOauth = require('simple-oauth2');
const fs = require('fs');
const lichess = require('lichess');

process.chdir(path.join(__dirname, '..', '..'));

const app = express();
const DataManager = require('../util/datamanager');
const config = require('../config.json');
const token = require('../token.json');
const auth = require('../modules/Chess/auth');

const betabot = true;
const id = betabot ? config.ids.lichess_beta : config.ids.lichess;
const secret = betabot ? token.lichess_beta : token.lichess;
const redirectUri = betabot ? 'http://localhost:80/callback' : 'http://lazybot.co.uk/callback';

const tokenHost = 'https://oauth.lichess.org';
const authorizePath = '/oauth/authorize';
const tokenPath = '/oauth';
const credentials = {
	client: {
		id,
		secret,
	},
	auth: {
		tokenHost,
		tokenPath,
		authorizePath,
	},
};
const oauth2 = simpleOauth.create(credentials);

app.use(express.static(path.join(__dirname, 'public')));

app.use('/commands', express.static(path.join(__dirname, '..', 'commands')));

app.get('/logs/debug.log', function (req, res) {
	try {
		let buffer = fs.readFileSync('./src/logs/debug.log', 'utf8');
		let str = buffer.toString().trim().split('\n').slice(-200).reverse().join('\n');
		res.status(200).type('text/plain').send(str);
	} catch (e) {
		if (e) res.status(404).type('text/plain').send(e.message);
	}
});

app.get('/logs/error.log', function (req, res) {
	try {
		if (req.params.name === 'data.log') throw new Error('Access denied');
		let buffer = fs.readFileSync('./src/logs/error.log', 'utf8');
		let str = buffer.toString().trim().split(/\n[^\s]/).slice(-200).reverse().join('\n');
		res.status(200).type('text/plain').send(str);
	} catch (e) {
		if (e) res.status(404).type('text/plain').send(e.message);
	}
});

app.get('/auth', function (req, res) {
	try {
		const keys = DataManager.getFile('./src/modules/Chess/auth.json');
		if (!req.query.state || !keys[req.query.state]) throw new Error('Invalid state.');
		res.status(200).sendFile('./auth.html', {
			root: __dirname
		});
	} catch (e) {
		if (typeof e === 'object') res.status(400).type('text/plain').send(e.message);
		else res.status(404);
	}
});

app.get('/callback', async function (req, res) {
	try {
		const result = await oauth2.authorizationCode.getToken({
			code: req.query.code,
			redirect_uri: redirectUri
		});
		await sendData(req.query.state, result);
		res.status(200).sendFile('./callback.html', {
			root: __dirname
		});
	} catch(e) {
		if (typeof e === 'object') res.status(500).type('text/plain').send(e.message);
		else res.status(500).json('Authentication failed');
	}
});

function sendData(state, result) {
	app.get('/profile', async function (req, res) {
		try {
			if (!req.query.state || req.query.state !== state) throw new Error('Invalid state.');
			const access = oauth2.accessToken.create(result);
			const lila = new lichess().setPersonal(access.token.access_token);
			const userInfo = await lila.profile.get();
			let keys = DataManager.getFile('./src/modules/Chess/auth.json');
			keys[state].data = userInfo;
			new auth().verifyRes(state, keys[state]);
			res.status(200).json(userInfo);
		} catch (e) {
			if (e) res.json({
				message: e.message,
				stack: e.stack.replace(new RegExp(process.cwd().split(path.sep).join('\\\\'), 'g'), '.')
			});
		}
	});
}

app.get('/config.json', function (req, res) {
	res.status(200).json({
		callback: redirectUri,
		id: betabot ? config.ids.lichess_beta : config.ids.lichess
	});
});

app.get('/', function (req, res) {
	res.status(200).sendFile('./index.html', {
		root: __dirname
	});
});

app.listen(80);