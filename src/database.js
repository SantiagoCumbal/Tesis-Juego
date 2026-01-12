import mongoose from 'mongoose'
mongoose.set('strictQuery', true)
const connection = async () =>{
    try {
        await mongoose.connect(process.env.MONGODB_ATLAS) 
        console.log("Database conectada")
    } catch (error) {
        console.log(error)
    }
}
export default connection