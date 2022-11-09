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
let messages = {}

io.on("connection", (socket) => {
    console.log(`user connected: ${socket.id}`);

    socket.on('new_user', (data) => {
        let curr_user = data
        let isChanged = false
        users.map((user) => {
            if (user.username === data.username) {
                user.socket_id = socket.id
                // console.log('user socket id change', user.name);
                curr_user = user
                isChanged = true
            }
        })
        if (!isChanged) {
            // console.log('new_user', data);
            users.push(data)
        }
        io.emit('new_user_response', users);
        let user_rooms = []
        rooms.map(room => {
            let isMember = room.members.find(m => m === curr_user._id)
            if (isMember) user_rooms.push(room)
        })

        io.to(curr_user.socket_id).emit('new_chat_response', user_rooms)
    })

    socket.on('send_message', (data) => {
        // console.log('send_message: ',data);
        if (!messages[data.room_id]) {
            messages[data.room_id] = [data]
        } else {
            messages[data.room_id].push(data)
        }

        socket.to(data.room_id).emit('recive_message', data)
        socket.emit('recive_message', data)
    })

    socket.on('create_room', (data) => {
        rooms.push(data)
        // console.log('room added', data.name);

        let tmp = []
        data.members.map(item => {
            let userInfo = users.filter(_user => _user._id === item)
            if (userInfo.length > 0) {
                tmp.push(userInfo[0])
            }
        })
        tmp.map(user => {
            let user_rooms = []
            rooms.map(room => {
                let isMember = room.members.find(m => m === user._id)
                if (isMember) user_rooms.push(room)
            })

            io.to(user.socket_id).emit('new_chat_response', user_rooms)
            // io.to(user.socket_id).join(data.room_id)
        })
    })

    socket.on('join_room', (data) => {
        // console.log('join_room', messages[data.room_id]);
        socket.join(data.room_id)
        let mess = messages[data.room_id] ? messages[data.room_id] : []
        socket.emit('join_room_response', mess)
    })


    socket.on('disconnect', () => {
        // console.log('🔥: A user disconnected');
        //Updates the list of users when a user disconnects from the server
        // users = users.filter((user) => user.socket_id !== socket.id);
        //Sends the list of users to the client
        // io.emit('new_user_response', users);
        socket.disconnect();
    });
})


server.listen(3001, () => {
    console.log("Server is run on the *:3001");
})