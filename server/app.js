const express = require('express');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const port = 3000;
const ip = "127.0.0.1";
//http://localhost:3000/ for a local visits
//http://{IP address of host computer}:3000/ for visits from other device on same network

const readline = require('readline');
const winston = require('winston');

const Channel = require("./channel.js");
const User = require("./user.js");
const Message = require("./message.js");

app.use(express.static(path.join(__dirname, '../public')));

//mock database since I don't want to implement Mongo yet
var appData = {
    activeChannels: {
        //"Channel Name": {channelObj}
    },
    activeUsers: {
        //"Unique Socket ID": {userObj}
    }
}

//manually create channels
appData.activeChannels["Mike's Channel"] = new Channel("Mike's Channel", 10, "System");
appData.activeChannels["Pubert's Channel"] = new Channel("Pubert's Channel", 10, "System");
appData.activeChannels["Jojo's Channel"] = new Channel("Jojo's Channel", 10, "System");
appData.activeChannels["Jamal's Channel"] = new Channel("Jamal's Channel", 10, "System");


io.on('connection', (socket) => {
    const username = 'User' + Math.floor(1000 + Math.random() * 9000);
    const socketID = socket.id;

    var self = new User(username, socketID);
    appData.activeUsers[socketID] = self;

    console.log('\n'+username + ' connected\n');

    socket.on('clientChatEvent', (userMessage) => {
        var newMessageObj = new Message(userMessage, username, new Date().toLocaleTimeString());

        io.to(self.currentChannel.channelName).emit('serverChatEvent', newMessageObj);

        self.currentChannel.addChatToLog(newMessageObj);
    });

    socket.on("userJoinChannelRequest", (channelName) => {
        var channelRef = appData.activeChannels[channelName];

        if (self.currentChannel !== null) {
            socket.leave(self.currentChannel.channelName);
            //console.log(`Leaving ${self.currentChannel}`);
        }

        self.joinChannel(channelRef); //add ourselves to our own database

        socket.join(channelName);

        socket.emit("userJoinChannelRes", {
            channelName: channelName,
            channelChatHistory: self.currentChannel.chatHistory
        });
    });


    socket.on('disconnect', () => {
        console.log(username + ' disconnected');
        self.leaveChannel();
        delete appData.activeUsers[socketID];
    });

    function createChannel(name, userLimit, admin, ID) {
        var newChannel = new Channel(name, userLimit, admin, ID);
        appData[ID] = newChannel;
        io.emit("channelCreated", {
            channelName: name,
            userLimit: userLimit
        });
        console.log(`Channel ${name} created successfully.`);
    }

    function systemMessage(sysMsg) {
        io.emit('serverChatEvent', {
            message: sysMsg,
            sender: "System",
            time: new Date().toLocaleTimeString()
        });
    }
});


server.listen(port, ip, () => {
    console.log(`Server running at http://${ip}:${port}`);

    const logger = winston.createLogger({
        format: winston.format.simple(),
        transports: [
            new winston.transports.Console()
        ]
    });
    
    // Setup readline
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    rl.prompt(true);

    rl.on('line', (line) => {
        const [command, param, ...args] = line.trim().split(' ');
        const argument = args.join(' ');

        console.log(argument);
        switch(command) {
            case '-log':
                if (param === "global") {
                    console.log(appData);
                } else if (param === "channel") {
                    try {
                        appData.activeChannels[argument].logChannel();
                    } catch (error) {
                        console.log(`Channel ${argument} not found`);
                    }
                } else if (param === "user") {
                    try {
                        console.log(appData.activeUsers[argument]);
                    } catch (error) {
                        console.log(`User ID ${argument} not found`);
                    }
                }
                
                break;
            
            case '-shutdown':
                console.log("Server shutting down");
                process.exit(0);

            case '-raw':
                if (param === "99804") {
                    try {
                        eval(argument);
                    } catch (error) {
                        console.log("Dawg ts is NOT valid JS");
                    }
                } else {
                    console("Invalid passkey dumbahh");
                }

                break;

            default:
                console.log(`Command '${line.trim()}' not recognized`);
                break;
        }
        rl.prompt(true);
    }).on('close', () => {
        console.log('Exiting...');
        process.exit(0);
    });
});
