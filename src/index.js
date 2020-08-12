const express = require('express')
const path = require('path')
const http = require('http')
const bad = require('bad-words')
const socketio = require('socket.io')
const { generateMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT||9876
const publicDirPath = path.join(__dirname, '../public')

app.use(express.static(publicDirPath))

io.on('connection', (socket) => {
    console.log('connected')

    socket.on('sendMessage', (data, callback) => {
        const user = getUser(socket.id)
        const filter = new bad()
        if(filter.isProfane(data)){
            return callback('Profanity is not allowed')
        }
        io.to(user.room).emit('message', generateMessage(user.username, data))
        callback()
    })
    
    socket.on('location', (data, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('onLocation', generateMessage(user.username, `https://google.com/maps/?q=${data.lat},${data.long}`))
        callback('ACK')
    })

    socket.on('join', (data, callback) => {
        const {error, user} = addUser({id: socket.id,
                username : data.username,
                room: data.room})

        if(error){
            return callback(error)
        }

        socket.join(user.room)
        socket.emit('message', generateMessage('Server', 'Welcome'))
        socket.broadcast.to(user.room).emit('message', generateMessage('Server', `${user.username} has joined`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        callback()
    })

    socket.on('disconnect', ()=> {
        const user = removeUser(socket.id)
        if(user){
            io.to(user.room).emit('message', generateMessage('Server', `${user.username} left`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
        
    })
})

server.listen(port, () => {
    console.log(`Server has started on ${port}`)
})