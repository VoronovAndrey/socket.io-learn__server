const express = require("express");
const cors = require("cors");
const http = require("http")
const { Server } = require("socket.io")

const app = express();
app.use(cors())

const server = http.createServer(app)

const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ["GET", "POST"],
    }
})

let users = []
let rooms = []

io.on("connection", (socket) => {
    console.log(`user connected: ${socket.id}`);

    socket.on('new_user', (data) => {
        console.log('new_user', data);
        users.push(data)
        io.emit('new_user_response', users);
    })

    socket.on('send_message', (data) => {
        // console.log('send_message: ',data);

        socket.emit('recive_message', data)
        socket.broadcast.emit('recive_message', data)
    })

    socket.on('create_room', (data) => {
        rooms.push(data)
        console.log('room added', rooms);
        
        let tmp = [] 
        data.members.map(item => {
            let userInfo = users.filter(_user => _user._id === item)
            if (userInfo.length > 0) {
                tmp.push(userInfo[0])
            }
        })
        tmp.map(user => {
            io.to(user.socket_id).emit('new_chat_response', rooms)
        })
    })

    socket.on('disconnect', () => {
        console.log('🔥: A user disconnected');
        //Updates the list of users when a user disconnects from the server
        users = users.filter((user) => user.socket_id !== socket.id);
        //Sends the list of users to the client
        io.emit('new_user_response', users);
        socket.disconnect();
      });
})


server.listen(3001, () => {
    console.log("Server is run on the *:3001");
})