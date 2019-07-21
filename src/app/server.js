//https://discordapp.com/api/oauth2/authorize?client_id=602327372372377642&redirect_uri=ec2-3-8-123-0.eu-west-2.compute.amazonaws.com%3A80%2Fredirect&response_type=code&scope=identify

const express = require('express');
const app = express();

app.get('/', function (req, res) {
	res.send('Hello World');
});
   
app.listen(3000);