import {Schema, model} from 'mongoose'
import mongoose from "mongoose"

const publicacionesschema = new Schema({
    administrador: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Administrador",
        required: true
    },
    titulo: {
        type: String,
        required: true
    },
    informacion: {
        type: String,
        required: true
    },
    fecha: {
        type: Date,
        default: Date.now
    }

},{
    timestamps:true
})

export default model ("Publicaciones",publicacionesschema)