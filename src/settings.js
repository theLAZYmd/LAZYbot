module.exports = {
    //bot owners who can maintain and use administration commands
    "owners": [
        "185412969130229760",
        "155688951066132480"
    ],
    //token for the bot
    "token": "Mzc1NTk3ODUwNTA0OTg2NjI0.DTorSQ.QZf6gmBAWmdTTq7Qxaeue4dvn_A",
    //millis between posting and deleting
    "deleteDelay": 900000,
    //location and name of the data file
    "updateDelay": 15000,
    //don't update someone again if they were updated this long ago
    "minimumUpdate": 1800000,
    //location and name of the data file
    "dataFile": __dirname + "\\data.dat",
    //Rating categories. In discord, first one should end with "-", last ends with "++", rest end with "+"
    "ratings": [1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000, 2100, 2200, 2300, 2400, 2500], //First is below, rest are above
    //Channel name where bot will say stuff
    "botChannelName": "support",
    //Channel name where bot will say secrets
    "modChannelName": "moderation",
    //Role which will be given to newly joined users
    "unrankedRoleName": "Unranked",
    //Role for the league
    "leagueRoleName": "League",
    //Role for the arena
    "arenaRoleName": "Arena",
    //Role for study
    "studyRoleName": "Study",
    //Lichess profile url. "|" is replaced with username
    "lichessProfileURL": "https://lichess.org/@/|",
    //Chess.com profile url. "|" is replaced with username
    "chesscomProfileURL": "https://www.chess.com/member/|",
    //Color that appears on the embed messages
    "embedColor": 0xDD3333,
    //Fen board
    "fenBoard": "icy_sea",
    //Fen board pieces
    "fenBoardPieces": "alpha",
    //Fen board show coordinates
    "fenBoardCoords": 0,
    //Fen board size 1-3
    "fenBoardSize": 2,
    //Mods role name
    "modRoleName": "Staff"
};