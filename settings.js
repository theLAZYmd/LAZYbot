module.exports = {
	//token for the bot
	"token": "NDIyODQ3MDg2MTQ1NTY4NzY5.DYhukg.ufLcCpYSHZlfh-eepWyCkXqq0c4", 
	//millis between each single user update
	"updateDelay": 15000, 
	//location and name of the data file
	"dataFile": __dirname + "\\data.dat", 
	//Rating categories. In discord, first one should end with "-", last ends with "++", rest end with "+"
	"ratings": [1000, 1000, 1300, 1500, 1700, 1900, 2000, 2100, 2200, 2300, 2400, 2500], //First is below, rest are above
	//Channel name where bot will say stuff
	"botChannelName": "spam",
	//Channel name where bot will say secrets
	"modChannelName": "test-channel-in-use",
	//Role which will be given to newly joined users
	"unrankedRoleName": "Unranked",
	//Role for the league
	"leagueRoleName": "League",
	//Role for the arena
	"arenaRoleName": "Arena",
	//Lichess profile url. "|" is replaced with username
	"lichessProfileURL": "https://lichess.org/@/|",
	//Chess.com profile url. "|" is replaced with username
	"chesscomProfileURL": "https://www.chess.com/member/|",
	//Color that appears on the embed messages
	"embedColor": 9359868
};

