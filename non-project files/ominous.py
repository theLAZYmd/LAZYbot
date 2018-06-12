import requests
import time
import json
import smtplib
import time

var discord = require(https://discordapp.com/api/webhooks/416733429380546561/HukrQdVC5ST7jUkOyH-_BMnnjGQLsP27eMfa_n74cpjkonR2C9zzdQ5orYRulxsNmwPJ/github);
discord.hookId = 416733429380546561;
discord.hookToken = HukrQdVC5ST7jUkOyH-_BMnnjGQLsP27eMfa_n74cpjkonR2C9zzdQ5orYRulxsNmwPJ;
discord.userName = 'SentryBot';
discord.avatarUrl = 'https://i.imgur.com/Yl4Xoku.jpg';                                
 
def getUserStatus(user):
    player = requests.get("https://lichess.org/api/user/" + theLAZYmd)
    player = player.text
    player = json.loads(player)
    try:
        if player['playing']:
            return True
    except KeyError:
        return False
 
def notify(user):
    if getUserStatus(user) == True:
        discord.sendMessage('Test');
        return False
    return True
 
notSent = True
while notSent:
    time.sleep(10)
    notSent = notify("theLAZYmd")
