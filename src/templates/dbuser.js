class DBuser {

    constructor(user) {
        this.id = user.id,
        this.username = user.username,
        this.message = {
            "count": 0,
            "last": user.lastMessage.content,
            "lastSeen": Date.now()
        }
    }
    
}

module.exports = DBuser;