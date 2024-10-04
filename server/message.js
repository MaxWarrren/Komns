class Message {
    constructor(message, sender, time) {
        this.sender = sender;
        this.time = time;
        this.message = message;
    }
}

module.exports = Message;