require('dotenv').config();
const express = require('express');
const path = require('path');
const simpleOauth = require('simple-oauth2');
const fs = require('fs');
const fsR = require('fs-reverse-modern');
const lichess = require('lichess');

process.chdir(path.join(__dirname, '..', '..'));

const app = express();
const DataManager = require('../util/datamanager');
const Logger = require('../util/logger');
const config = require('../config.json');
const auth = require('../modules/Chess/auth');

const betabot = process.env.INSTANCE === 'BETA';
const ext = process.env.INSTANCE ? '_' + process.env.INSTANCE.toLowerCase() : '';
const id = config.ids['lichess' + ext];
const secret = process.env['LICHESS' + ext];
const port = process.env['PORT' + ext];
const redirectUri = config.sources.lichess.url['redirect' + ext];

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
const cached = {};

if (betabot) app.use(express.static(path.join(__dirname, 'public')));

if (betabot) app.use('/commands', express.static(path.join(__dirname, '..', 'commands')));

app.use('/config', (req, res) => res.json({
	id,
	redirectUri,
	betabot
}));

app.get('/logs/debug.log', function (req, res) {
	try {
		const file = './src/logs/debug.log';
		const stats = fs.statSync(file);
		const bytes = stats.size;
		let stream = fsR(file, {
			matcher: /\n\S/,
			bufferSize: 3 * 1024,
			flags: 'r',
			start: bytes - 40 * 1024
		});
		stream.on('open', () => res.status(200));
		stream.on('data', (chunk) => {
			res.write(('\n2' + chunk));
		});
		stream.on('end', () => res.end());
		stream.on('error', res.send);
	} catch (e) {
		if (e) res.status(404).type('text/plain').send(e.message);
	}
});

app.get('/logs/error.log', function (req, res) {
	try {
		const file = './src/logs/error.log';
		const stats = fs.statSync(file);
		const bytes = stats.size;
		let stream = fsR(file, {
			matcher: /\n\S/,
			bufferSize: 3 * 1024,
			flags: 'r',
			start: bytes - 20 * 1024
		});
		stream.on('open', () => res.status(200));
		stream.on('data', (chunk) => {
			res.write('2' + chunk);
		});
		stream.on('end', () => res.end());
		stream.on('error', res.send);
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
		if (!cached[req.query.state]) await sendData(req.query.state, result);
		res.status(200).sendFile('./callback.html', {
			root: __dirname
		});
		cached[req.query.state] = true;
	} catch(e) {
		if (typeof e === 'object') res.status(500).type('text/plain').send(e.message);
		else res.status(500).json('Authentication failed');
	}
});

function sendData(state, result) {
	app.get('/profile/' + state, async function (req, res) {
		try {
			const access = oauth2.accessToken.create(result);
			const lila = new lichess().setPersonal(access.token.access_token);
			const userInfo = await lila.profile.get();
			let keys = DataManager.getFile('./src/modules/Chess/auth.json');
			if (keys[state]) {
				keys[state].data = userInfo;
				new auth().verifyRes(state, keys[state]);
			}
			res.status(200).json(userInfo);
		} catch (e) {
			if (e) res.status(400).json({
				message: e.message,
				stack: e.stack.replace(new RegExp(process.cwd().split(path.sep).join('\\\\'), 'g'), '.')
			});
		}
	});
}

app.get('/profile', function (req, res) {
	try {
		throw new Error('Invalid state');
	} catch (e) {
		if (e) res.status(400).json({
			message: 'Invalid state.',
			stack: e.stack.replace(new RegExp(process.cwd().split(path.sep).join('\\\\'), 'g'), '.')
		});
	}
});

app.get('/config.json', function (req, res) {
	res.status(200).json({
		callback: redirectUri,
		id
	});
});

app.get('/', function (req, res) {
	res.status(200).sendFile('./index.html', {
		root: __dirname
	});
});

app.listen(port);
Logger.info('Listening on port ' + port);
