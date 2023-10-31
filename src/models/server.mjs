import express from 'express'
import { createServer } from 'node:http'
import { Server as io} from 'socket.io'
import { instrument } from "@socket.io/admin-ui"
import { Sockets } from './sockets.mjs'
import cors from 'cors'
import 'dotenv/config'
import boom from '@hapi/boom'
import { logErrors, errorHandler, boomErrorHandler } from '../middlewares/error.handler.mjs'

export class Server {
    constructor() {
        this.app = express() // Creates an Express application.
        this.router = express.Router()
        this.app.disable('x-powered-by') // Do not send the X-Powered-By response header banner. It can help to provide an extra layer of obsecurity to reduce server fingerprinting.
        this.app.set('view engine', 'ejs') // The default engine extension to use when omitted. index -> index.ejs
        this.app.set('views', './views') // A directory or an array of directories for the application's views. If an array, the views are looked up in the order they occur in the array.
        this.port = process.env.PORT ?? PORT
        this.server = createServer(this.app)
        this.io = new io(this.server, {
            cors: {
                origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:1234', 'https://admin.socket.io/#/sockets'],
                credentials: true
            }
        })

        instrument(this.io, {
            auth: false,
            mode: "development",
        })
    }

    middlewares() {
        this.app.use(cors())
        this.app.use(express.static('public')) // It serves static files.
        this.app.use(express.json()) // It parses incoming requests with JSON payloads.
        this.app.use(logErrors)
        this.app.use(boomErrorHandler)
        this.app.use(errorHandler)
    }

    routes() {
        this.app.get('/', (req, res) => {
            console.log('GET /')
            const payload = {
                data: 'some data...',
                clients: this.socketConnections.clients,
                rooms: this.socketConnections.rooms,
            }
            res.render('index', payload)
        })

        // Crear sala
        this.app.get('/create_room', (req, res) => {
            res.render('create_room')
        })

        // Unirse a sala
        this.app.get('/join_room', (req, res) => {
            res.render('join_room')
        })

        // Show realtime server stats
        this.app.get('/stats', (req, res) => {
            const payload = {
                clients: this.socketConnections.clients,
                rooms: this.socketConnections.rooms,
            }
            res.render('stats', payload)
        })
    }

    socketsConfig() {
        this.socketConnections = new Sockets(this.io)
    }

    initialize() {
        this.middlewares()

        this.routes()

        this.socketsConfig()
        
        this.server.listen(this.port, () => {
            console.log(`Server running at http://localhost:${this.port}`)
        })
    }
}