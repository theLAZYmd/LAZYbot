const express = require('express');
const path = require('path');
const simpleOauth = require('simple-oauth2');
const fs = require('fs');
const lichess = require('lichess');

const app = express();
const DataManager = require('../util/datamanager');
const config = require('../config.json');
const token = require('../token.json');
const auth = require('../modules/Chess/auth');

const tokenHost = 'https://oauth.lichess.org';
const authorizePath = '/oauth/authorize';
const tokenPath = '/oauth';
const oauth2 = simpleOauth.create({
	client: {
		id: config.ids.lichess,
		secret: token.lichess,
	},
	auth: {
		tokenHost,
		tokenPath,
		authorizePath,
	},
});
const redirectUri = 'http://lazybot.co.uk/callback';

app.use(express.static(path.join(__dirname, 'public')));

app.use('/commands', express.static(path.join(__dirname, '..', 'commands')));

app.get('/logs/debug.log', function (req, res) {
	try {
		let buffer = fs.readFileSync('./src/logs/debug.log', 'utf8');
		let str = buffer.toString().trim().split('\n').reverse().join('\n');
		res.status(200).type('text/plain').send(str);
	} catch (e) {
		if (e) res.status(404).type('text/plain').send(e.message);
	}
});

app.get('/logs/error.log', function (req, res) {
	try {
		if (req.params.name === 'data.log') throw new Error('Access denied');
		let buffer = fs.readFileSync('./src/logs/error.log', 'utf8');
		let str = buffer.toString().trim().split(/\n[^\s]/).reverse().join('\n');
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
		await sendData(req.query.state, req.query.code);
		res.status(200).sendFile('./callback.html', {
			root: __dirname
		});
	} catch(e) {
		if (typeof e === 'object') res.status(500).type('text/plain').send(e.message);
		else res.status(500).json('Authentication failed');
	}
});

function sendData(state, code) {
	app.get('/profile', async function (req, res) {
		if (!req.query.state || req.query.state !== state) throw new Error('Invalid state.');
		const result = await oauth2.authorizationCode.getToken({
			code,
			redirect_uri: redirectUri
		});
		const access = oauth2.accessToken.create(result);
		const lila = new lichess().setPersonal(access.token.access_token);
		const userInfo = await lila.profile.get();
		let keys = DataManager.getFile('./src/modules/Chess/auth.json');
		keys[state].data = userInfo;
		new auth().verifyRes(state, keys[state]);
		res.status(200).json(userInfo);
	});
}

app.get('/config.json', function (req, res) {
	res.status(200).json({
		id: config.ids.lichess
	});
});

app.get('/', function (req, res) {
	res.status(200).sendFile('./index.html', {
		root: __dirname
	});
});

app.listen(80);