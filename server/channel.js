class Channel {
    constructor(name, memberLimit, admin) {
        this.channelName = name;
        this.memberLimit = memberLimit;
        this.channelAdmin = admin;
        this.ID = Channel.generateID(8);

        this.activeUsers = new Array();
        this.activeUserCnt = 0;

        this.chatHistory = new Array();
        
        
    }

    logChannel() {
        console.log(this);
    }

    addChatToLog(msgObj) {
        this.chatHistory.push(msgObj);
    }

    static generateID(len) {
        var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var str = '';
        for (var i = 0; i < len; i++) {
            str += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return str;
    }
}

module.exports = Channel;