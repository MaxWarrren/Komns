class Channel {
    constructor(name, admin, ID, chatHistory) {
        this.channelName = name;
        this.channelAdmin = admin;
        this.channelID = ID;
        this.chatHistory = chatHistory;
        
        //not stored in db, used for socketio routing
        this.activeUsers = new Array();
        this.activeUserCnt = 0;
    }

    logChannel() {
        console.log(this);
    }

    addChatToLog(msgObj) {
        this.chatHistory.push(msgObj);
    }

    
}

module.exports = Channel;