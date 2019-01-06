class DBuser {

    constructor(user) {
        this.id = user.id,
        this.username = user.username,
        this.messages = {
            "count": 0,
            "last": user.lastMessage ? user.lastMessage.content : "",
            "lastSeen": Date.now()
        }
    }
    
}

module.exports = DBuser;