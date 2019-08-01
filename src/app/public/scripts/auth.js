let uri = window.location.href;
const params = new URLSearchParams(uri.split('?').slice(1).join('?'));
const domain = window.location.hostname;

const tokenHost = 'https://oauth.lichess.org';
const authorizePath = '/oauth/authorize';
const clientId = domain === 'localhost' ? 'rPgWv3gsnvn1liOr' : '1nNYMjg2i4DvLXPw';
const redirectUri = domain === 'localhost' ? 'http://localhost:80/callback' : 'http://lazybot.co.uk/callback';
const scopes = [
	//'game:read',
	//'preference:read'
	// 'preference:write',
];
const state = params.get('state') || Math.random().toString(36).substring(2);
const scopeString = scopes.join('%20');

const authorizationUri = `${tokenHost}${authorizePath}?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopeString}&state=${state}`;
console.log(authorizationUri);
let button = document.getElementById('auth_button');
button.href = authorizationUri;