const express = require('express');
const simpleOauth = require('simple-oauth2');
const axios = require('axios');
const DataManager = require("../../datamanager");
const config = DataManager.getFile("./src/config.json");
const Token = DataManager.getFile("./token.json");

const clientId = config.ids.lichess;
const clientSecret = Token.lichess;
const redirectUri = config.sources.lichess.url.redirect;

// list of scopes: https://lichess.org/api#section/Authentication
const scopes = [
    // 'game:read',
    'preference:read',
    // 'preference:write',
];

const tokenHost = 'https://oauth.lichess.org';
const authorizePath = '/oauth/authorize';
const tokenPath = '/oauth';

const oauth2 = simpleOauth.create({
    "client": {
        "id": clientId,
        "secret": clientSecret,
    },
    "auth": {
        tokenHost,
        tokenPath,
        authorizePath,
    },
});

//state is a key you generate which should be sent in the request and verified after to ensure that that request finished is the same as the one started
const state = Math.random().toString(36).substring(2); 
const authorizationUri = `${tokenHost}${authorizePath}?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes.join('%20')}&state=${state}`;

const app = express();

// Show the "log in with lichess" button
app.get('/', (req, res) => res.send('Hello<br><a href="/auth">Log in with lichess</a>'));

// Initial page redirecting to Lichess
app.get('/auth', (req, res) => {
    console.log(authorizationUri);
    res.redirect(authorizationUri);
});

// Redirect URI: parse the authorization token and ask for the access token
app.get('/callback', async (req, res) => {
    try {
        const result = await oauth2.authorizationCode.getToken({
            "code": req.query.code,
            "redirect_uri": redirectUri
        });
        console.log(result);
        const token = oauth2.accessToken.create(result);
        console.log(token);
        const userInfo = await getUserInfo(token.token);
        res.send(`<h1>Success!</h1>Your lichess user info: <pre>${JSON.stringify(userInfo.data)}</pre>`);
    } catch (e) {
        console.error('Access Token Error', e.message);
        res.status(500).json('Authentication failed');
    }
});

app.listen(3000, () => console.log('Express server started on port 3000'));

function getUserInfo(token) {
    return axios.get('/api/account', {
        "baseURL": 'https://lichess.org/',
        "headers": {
            'Authorization': 'Bearer ' + token.access_token
        }
    });
}