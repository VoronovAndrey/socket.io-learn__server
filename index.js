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

io.on("connection", (socket) => {
    console.log(`user connected: ${socket.id}`);

    socket.on('send_message', (data) => {
        // console.log('send_message: ',data);

        socket.emit('recive_message', data)
        socket.broadcast.emit('recive_message', data)
    })
})


server.listen(3001, () => {
    console.log("Server is run on the *:3001");
})