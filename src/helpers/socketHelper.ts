import colors from 'colors'
import { Server } from 'socket.io'

const socket = (io: Server) => {
  io.on('connection', socket => {
    console.log(colors.blue('A user connected'), socket.id)

    // Join stream room
    socket.on('join-stream', (streamId: string) => {
      if (streamId) {
        socket.join(`stream:${streamId}`)
        console.log(colors.green(`User ${socket.id} joined stream:${streamId}`))
      }
    })

    // Leave stream room
    socket.on('leave-stream', (streamId: string) => {
      if (streamId) {
        socket.leave(`stream:${streamId}`)
        console.log(colors.yellow(`User ${socket.id} left stream:${streamId}`))
      }
    })

    //disconnect
    socket.on('disconnect', () => {
      console.log(colors.red('A user disconnect'), socket.id)
    })
  })
}

export const socketHelper = { socket }
