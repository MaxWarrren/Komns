const express = require('express');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const port = 3000;

const winston = require("winston");
const readline = require("readline");
const uri = "mongodb+srv://Admin_Maxwell:Mizzou2024@KomnsAppData.bsxpq.mongodb.net/?retryWrites=true&w=majority&appName=KomnsAppData"; 

//import classes
const Channel = require("./channel.js");
const User = require("./user.js");
const Message = require("./message.js");
const { channel } = require('diagnostics_channel');
var db;

app.use(express.static(path.join(__dirname, '../public')));

//database for live routing with socket.io
var liveAppData = {
    activeChannels: {
        //"Channel Name": {channelClass}
    },
    activeUsers: {
        //"Unique Socket ID": {userClass}
    }
}

//connect db
async function connectDb() {
    try {
        await mongoose.connect(uri);
        db = mongoose.connection.useDb("appdata");
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error(error);
    }
}
connectDb();
//------

//define strucutre for channel document
const channelSchema = new mongoose.Schema({
    channelName: { type: String, required: true },
    channelID: { type: String, required: true },
    channelAdmin: { type: String, required: true },
    chatHistory: { type: Array, default: [] }
});
const ChannelDoc = mongoose.model('ChannelDoc', channelSchema, "channelData");
//--------

//various db handlers
async function fetchData(collectionName, _channelName) {
    try {
        // Access the collection directly
        const channelDoc = await db.collection(collectionName).findOne({channelName: _channelName});
        console.log("Channel:", channelDoc);
    } catch (err) {
        console.error("Error fetching document:", err);
    }
}

//add a message object to our mongodb
async function addMessageToDB(msgObj, _channelName) {
    try {
        const updatedDoc = await db.collection("channelData").findOneAndUpdate(
            { channelName: _channelName}, 
            { $push: { chatHistory: { sender: msgObj.sender, time: msgObj.time, message: msgObj.message } } },
            { new: true }
        );
    } catch (err) {
        console.error("Error fetching document:", err);
    }
}

async function createNewChannelInDB(channelObj) {
    try {
        const newChannelDoc = {
            channelName: channelObj.channelName,
            channelID: channelObj.channelID,
            channelAdmin: channelObj.channelAdmin,
            chatHistory: channelObj.chatHistory
        };
        await db.collection("channelData").insertOne(newChannelDoc);
    } catch (err) {
        console.log(err);
    }
}
//retrieve all of the channel documents from our mongodb
async function getStoredChannels() {
    try {
        const cursor = await db.collection("channelData").find();
        const allChannels = await cursor.toArray();
        //console.log(allChannels);
        return allChannels;
    } catch (err) {
        console.error("Error fetching document:", err);
    }
}

io.on('connection', (socket) => {
    const username = 'User' + Math.floor(1000 + Math.random() * 9000);
    const socketID = socket.id;

    var self = new User(username, socketID);
    liveAppData.activeUsers[socketID] = self;

    loadAndBuildChannels();

    console.log('\n'+username + ' connected\n');

    //processing new chat from the client
    socket.on('processNewChat', (userMessage) => {
        if (self.currentChannel !== null) {
            var newMessageObj = new Message(userMessage, username, new Date().toLocaleTimeString());

            addMessageToDB(newMessageObj, self.currentChannel.channelName);
            
            //send message to all clients in the same channel to update chatroom
            io.to(self.currentChannel.channelName).emit('updateClientChat', newMessageObj);
    
            self.currentChannel.addChatToLog(newMessageObj);
        } else {
            console.log("Trying to send chat without being in a room")
        }
    });

    //when user clicks on sidenav button to join a new channel
    socket.on("userJoinChannelRequest", (channelName) => {
        var channelRef = liveAppData.activeChannels[channelName];

        if (self.currentChannel !== null) {
            socket.leave(self.currentChannel.channelName);
            //console.log(`Leaving ${self.currentChannel}`);
        }

        self.joinChannel(channelRef); 

        socket.join(channelName);

        socket.emit("userJoinChannelRes", {
            channelName: channelName,
            channelChatHistory: self.currentChannel.chatHistory
        });
    });

    //process channel creation request
    socket.on("createNewChannelReq", (channelName) => {
        var newChannel = new Channel(channelName, self.username, generateID(8), []);
        liveAppData.activeChannels[channelName] = newChannel;
        createNewChannelInDB(newChannel);
        socket.emit("renderChannelBtn", channelName);
    })

    //for when user leaves
    socket.on('disconnect', () => {
        console.log(username + ' disconnected');
        if (self.currentChannel !== null) {self.leaveChannel()};
        delete liveAppData.activeUsers[socketID];
    });

    //unpack each channel from our db, and add it to live db and send it the client for rendering
    async function loadAndBuildChannels() {
        var allChannels = await getStoredChannels();
        
        //cd = channel document
        for (var cd of allChannels) {
            console.log("loop running");
            var channelObj = new Channel(cd.channelName, cd.channelAdmin, cd.channelID, cd.chatHistory);
            liveAppData.activeChannels[cd.channelName] = channelObj; //add to live db

            socket.emit("renderChannelBtn", cd.channelName);
        }
        
    }
});

function generateID(len) {
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var str = '';
    for (var i = 0; i < len; i++) {
        str += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return str;
}

server.listen(port, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${port}`);


    
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
                    console.log(liveAppData);
                } else if (param === "channel") {
                    try {
                        liveAppData.activeChannels[argument].logChannel();
                    } catch (error) {
                        console.log(`Channel ${argument} not found`);
                    }
                } else if (param === "user") {
                    try {
                        console.log(liveAppData.activeUsers[argument]);
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
