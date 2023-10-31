import { v4 as uuid} from 'uuid'
import { uuidToPin } from '../utils/uuidToPin.mjs'

export class Room {
    constructor(owner) {
        this.id = uuid()
        this.pin = uuidToPin(this.id)
        this.owner = owner
        this.players = [] // (?)
        this.started = false
        this.game = null
    }

    addPlayer(newPlayer) {
        
        // Si no existe, lo agrego.
        const user = this.players.find( player => player.id === newPlayer.id)
        if(!user) {
            this.players.push(newPlayer)
            console.log(`Player ${newPlayer.nickname} (${newPlayer.id}) was joined at room ${this.id} (${this.pin})`)
        }
    }

    removePlayer(playerId) {
        this.players = this.players.filter( player => player.id != playerId )
        console.log(`Player ${playerId} was removed from the room ${this.id} (${this.pin})`)
    }

    start() {
        this.started = true

    }

    newCalc() {
        return { calculo: `${Math.floor(Math.random() * 99)} + ${Math.floor(Math.random() * 99)} =`}
    }
}