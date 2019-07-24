//94.136.40.82

const express = require('express');
const path = require('path');
const app = express();
const DataManager = require('../util/datamanager');
const fs = require('fs');
const config = require('../config.json');

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
		//if (!req.query.id || !keys[req.query.id]) throw new Error('Invalid state.');
		res.status(200).sendFile('./auth.html', {
			root: __dirname
		});
	} catch (e) {
		if (typeof e === 'object') res.status(400).type('text/plain').send(e.message);
		else res.status(404);
	}
});

app.get('/callback', function (req, res) {
	try {
		res.status(200).sendFile('./callback.html', {
			root: __dirname
		});
	} catch (e) {
		if (typeof e === 'object') res.status(400).type('text/plain').send(e.message);
		else res.status(404);
	}
});

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
   
app.get('/callback', function (req, res) {
	res.status(200).send('good job.');
});

app.listen(80);