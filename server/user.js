class User {
    constructor(username, ID) {
        this.username = username;
        this.ID = ID;
        this.currentChannel = null; //stores Channel class, not just name

    }

    joinChannel(channel) {
        if (this.currentChannel !== null) {this.leaveChannel();} 
        this.currentChannel = channel; //change the current channel
        this.currentChannel.activeUsers.push(this.ID); 
        this.currentChannel.activeUserCnt++;
        
    }

    leaveChannel() {
        var channelUsers =  this.currentChannel.activeUsers; 
        var index = channelUsers.indexOf(this.ID);
        if (index !== -1) {
            channelUsers.splice(index, 1);
        }
        this.currentChannel.activeUserCnt--;
    }
}

module.exports = User;