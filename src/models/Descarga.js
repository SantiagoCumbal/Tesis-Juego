import {Schema, model} from 'mongoose'
import mongoose from "mongoose"

const descargaSchema = new Schema({
    numeroDescarga: { 
        type: Number, 
        required: true 
    },
    jugador: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Jugadores", 
        required: true 
    },
    fecha: { 
        type: Date, 
        default: Date.now 
    }
},{
    timestamps:true
});

export default model("Descargas", descargaSchema);
