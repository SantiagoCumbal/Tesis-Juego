import {Schema, model} from 'mongoose'
import mongoose from "mongoose"

const donacionschema = new Schema({
    jugador: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Jugadores",
        required: true
    },
    cantidad: {
        type: Number,
        required: true
    },
    motivo: {
        type: String,
        default: "Donación al sistema",
        required: true
    },
    fecha: {
        type: Date,
        default: Date.now
    }

},{
    timestamps:true
})

export default model ("Donaciones",donacionschema)