import { Room } from './room.mjs'

export class Sockets {
    constructor(io) {
        this.io = io
        this.clients = [] // All clients (sockets)
        this.rooms = [] // All rooms

        this.socketEvents()
    }

    createRoom(owner) {
        const newRoom = new Room(owner)
        this.rooms.push(newRoom)
        return newRoom
    }

    generateCalculation() {
        return { calculo: `${Math.floor(Math.random() * 99)} + ${Math.floor(Math.random() * 99)} =`}
    }

    socketEvents() {
        // User connect
        this.io.on('connection', (socket) => {
            console.log(`Usuario ${socket.id} conectado.`)
            this.clients.push(socket.id)

            
            // Client requests the creation of a room
            socket.on('create_room', (data) => {
                // Create a new room
                console.log('Creating room...', data)
                const room = this.createRoom(socket.id)

                // Join socket to room channel
                console.log('Joining the room: ', room.id)
                socket.join(room.id)

                // Report the creation
                socket.emit('room_created', {room})
            })


            // Client requests to join a room
            socket.on('join_room', (data) => {
                const {pin, nickname} = data

                // ¿Existe el room al cual intenta unirse?
                const room = this.rooms.find( room => room.pin == pin)
                if (!room) {
                    console.log('El pin es inválido (room no existe)')
                    socket.emit('join_status', {
                        status: 'error',
                        msg: `Incorrect pin: the room you are trying to join does not exist.`,
                    })
                    return
                }
                
                socket.join(room.id)
                console.log(`User ${nickname} joined to ${room.id} (${room.pin}) room channel`)

                room.addPlayer({id: socket.id, nickname: nickname})

                // Añade los datos del player a la lista de jugadores del room
                // this.rooms = this.rooms.map(room => {
                //     if(room.pin == pin) {
                //         return {...room, players: [...room.players, {id: socket.id, nickname: nickname}]}
                //     }

                //     return room
                // })

                // Report the result
                socket.in(room.id).emit('join_status', {
                    status: 'success',
                    msg: `Successfully joined`,
                    room,
                })

            })


            // start_game
            socket.on('start_game', () => {
                console.log('starting game prro!!!', socket.id)

                // enviar un calculo
                socket.in(socket.id).emit('new_calc', {
                    calc: '1+1'
                })
            })

            // User disconnect
            socket.on('disconnect', () => {
                console.log(`Usuario ${socket.id} desconectado.`)

                // Elimino de la lista de clientes el socket desconectado
                this.clients = this.clients.filter( client => client !== socket.id)

                // (?) Si el socket desconectado ha creado una sala, elimino dicha sala
                // (?) ¿Qué sucede en el caso de re-conexión - (tener en cuenta que el id se regenera)
                if(this.rooms.find( room => room.owner === socket.id)) {
                    this.rooms = this.rooms.filter( room => room.owner !== socket.id)
                }

                // Si el socket estaba unido a una sala, lo elimino
                this.rooms.forEach( room => {
                    if (room.players.find(player => player.id == socket.id)) {
                        //room.players = room.players.filter(player => player.id != socket.id )
                        room.removePlayer(socket.id)
                    }
                })
            })
        })
    }
}