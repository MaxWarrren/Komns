class User {
    constructor(username, ID) {
        this.username = username;
        this.userSocketID = ID;
        this.currentChannel = null; //stores Channel class, not just name

    }

    joinChannel(channel) {
        if (this.currentChannel !== null) {this.leaveChannel();} 
        this.currentChannel = channel; //change the current channel
        this.currentChannel.activeUsers.push(this.userSocketID); 
        this.currentChannel.activeUserCnt++;
        
    }

    leaveChannel() {
        var channelUsers =  this.currentChannel.activeUsers; 
        var index = channelUsers.indexOf(this.userSocketID);
        if (index !== -1) {
            channelUsers.splice(index, 1);
        }
        this.currentChannel.activeUserCnt--;
    }
}

module.exports = User;