import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors';
import routerJugadores from './routers/Jugador_routes.js'
import routerAdministrador from './routers/Administrador_routes.js'
import fileUpload from 'express-fileupload'
import cloudinary  from 'cloudinary'

const app = express()
dotenv.config()

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: './uploads',
}))

app.use(cors())
app.use(express.json())

app.set('port', process.env.PORT || 3000)

app.get('/', (req,res)=> res.send("Server on"))
app.use('/api', routerJugadores)
app.use('/api', routerAdministrador)

app.use((req,res)=> res.status(404).json({msg:"Endpoint no encontrado - 404"}))

export default app
