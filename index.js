const express = require('express')
const path = require('path')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const port = process.env.PORT || 8080

server.listen(port)

const clients = [], rooms = []

io.on('connection', function (socket) {
  const roomId = socket.handshake.query.roomId || socket.id
  socket.send(`Bienvenido ${socket.handshake.query.server ? 'Servidor' : 'Cliente' } C:`)

  if (socket.handshake.query.server) {
    socket.join('server-' + socket.id)

    socket
      .on('new-room', function (room) {
        if(typeof room === 'object') {
          rooms.push({ nama: room.name, isPublic: room.isPublic || false, host: roomId })
          socket.join('server-' + roomId)
          socket.send({
            status: 200,
            data: {
              action: 'new-room',
              message: 'Room creaado',
              roomId
            }
          })
        } else {
          socket.send({
            status: 400,
            data: {
              action: 'new-room',
              message: 'Informacion incompleta',
            }
          })
        }
      })
  } else {
    if (!io.sockets.adapter.rooms['server-' + roomId]) {
      socket.send('Error :v')
    } else {
      socket.join('server-' + roomId)
      socket.send({
        status: 200,
        data: {
          room: 'server-' + roomId,
          action: 'join-server',
          message: 'Conectado a sevidor',
        }
      })

      socket
        .on('move', function (shape) { // { shape [String], typeMove [Integer[0-4]] }
          io.to(roomId).emit('move-shape', shape) // Send to Serer
        })
    }
  }
})

app.use(express.static(path.join(__dirname, 'static')))

app
  .get('/', (req, res) => {
    res.sendFile(__dirname + '/dsp.html')
  })
  .get('/client', (req, res) => {
    res.sendFile(__dirname + '/client.html')
  })
  .get('/api/servers', (req, res) => {
    console.log(rooms)
    res.status(200).json({ data: rooms.filter(room => room.isPublic )}).end()
  })
  .get('/server', (req, res) => {
    res.sendFile(__dirname + '/server.html')
  })
