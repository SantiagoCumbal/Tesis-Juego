import { sendMailToRegister, sendMailToRecoveryPassword } from "../config/nodemailer.js";
import Jugadores from "../models/Jugador.js";
import Donaciones from "../models/Donacion.js"
import Descarga from "../models/Descarga.js";
import Publicaciones from "../models/Publicaciones.js";
import { crearTokenJWT } from "../middlewares/JWT.js"
import { v2 as cloudinary } from "cloudinary";
import fs from "fs-extra"
import mongoose from "mongoose"
import path from "path";
import { fileURLToPath } from "url";
import { Stripe } from "stripe"
const stripe = new Stripe(`${process.env.STRIPE_PRIVATE_KEY}`)

// Rutas seguras
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const registro = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password || Object.values(req.body).includes("")) {
        return res.status(400).json({ msg: "Debes llenar todos los campos" });
    }

    const verificarEmailBDD = await Jugadores.findOne({ email });
    if (verificarEmailBDD) {
        return res.status(400).json({ msg: "El email ya está registrado" });
    }

    const nuevojugador = new Jugadores(req.body);

    const defaultImagePath = path.join(__dirname, '../config/images/new.jpg');
    const { secure_url, public_id } = await cloudinary.uploader.upload(
        defaultImagePath,
        { folder: "Jugadores" }
    );
    nuevojugador.avatarJugador = secure_url;
    nuevojugador.avatarJugadorID = public_id;

    // Encriptar contraseña
    nuevojugador.password = await nuevojugador.encrypPassword(password);

    // Crear token y enviar correo
    const token = nuevojugador.crearToken();
    await sendMailToRegister(email, token);

    
    await nuevojugador.save()
    res.status(200).json(
        {msg:"Revisa tu correo electrónico para confirmar tu cuenta"}
    )
};

const confirmarEmail = async (req,res)=>{
    if(!(req.params.token)) 
        return res.status(400).json({msg:"Lo sentimos, no se puede validar la cuenta"
    })

    const jugadorBDD = await Jugadores.findOne({token:req.params.token});

    if(!jugadorBDD?.token) 
        return res.status(404).json({msg:"La cuenta ya ha sido confirmada"
    })

    jugadorBDD.token = null
    jugadorBDD.confirmEmail=true

    await jugadorBDD.save()
    res.status(200).json({msg:"Token confirmado, ya puedes iniciar sesión"}) 
}

const recuperarPassword = async (req,res)=>{
    const {email} = req.body
    if (Object.values(req.body).includes("")) return res.status(404).json(
        {msg:"Lo sentimos, debes llenar todos los campos"}
    )
    const jugadorBDD = await Jugadores.findOne({email});
    if(!jugadorBDD) return res.status(404).json(
        {msg:"Lo sentimos, el usuario no se encuentra registrado"}
    )
    const token = jugadorBDD.crearToken()
    jugadorBDD.token=token
    await sendMailToRecoveryPassword(email,token)
    await jugadorBDD.save()
    res.status(200).json({
        msg:"Revisa tu correo electrónico para reestablecer tu cuenta"}
    )

}
const comprobarTokenPassword = async (req,res)=>{ 
    const {token} = req.params
    const jugadorBDD = await Jugadores .findOne({token})
    if(jugadorBDD?.token !== token) return res.status(404).json(
        {msg:"Lo sentimos, no se puede validar la cuenta"}
    )

    await jugadorBDD.save()
    res.status(200).json(
        {msg:"Token confirmado, ya puedes crear tu nuevo password"}
    ) 
}
const crearNuevaPassword = async (req,res)=>{
    const{password,confirmpassword} = req.body
    if (Object.values(req.body).includes("")) return res.status(404).json(
        {msg:"Lo sentimos, debes llenar todos los campos"}
    )
    if(password !== confirmpassword) return res.status(404).json(
        {msg:"Lo sentimos, los passwords no coinciden"}
    )
    const jugadorBDD = await Jugadores.findOne({token:req.params.token})
    if(jugadorBDD?.token !== req.params.token) return res.status(404).json(
        {msg:"Lo sentimos, no se puede validar la cuenta"}
    )
    jugadorBDD.token = null
    jugadorBDD.password = await jugadorBDD.encrypPassword(password)
    await jugadorBDD.save()
    res.status(200).json({msg:"Felicitaciones, ya puedes iniciar sesión con tu nuevo password"}) 
}

const login = async(req,res)=>{

    const {email,password} = req.body
    if (Object.values(req.body).includes("")) return res.status(400).json(
        {msg:"Lo sentimos, debes llenar todos los campos"}
    )
    const jugadorBDD = await Jugadores.findOne({email}).select("-__v -token -updatedAt -createdAt")

    if(jugadorBDD?.confirmEmail === false) return res.status(401).json(
        {msg:"Lo sentimos tu cuenta aun no ha sido verificada"}
    )

    if(jugadorBDD?.status === false){
        return res.status(403).json(
            { msg: "Tu cuenta ha sido suspendida por mal comportamiento" }
        )
    }

    if(!jugadorBDD) return res.status(404).json(
        {msg:"Usuario o contraseña incorrecta"}
    )
    const verificarPassword = await jugadorBDD.matchPassword(password)

    if(!verificarPassword)res.status(401).json(
        {msg:"Usuario o contraseña incorrecta"}
    )
    const {nombre,apellido,username,_id,rol} = jugadorBDD
    const token = crearTokenJWT(jugadorBDD._id,jugadorBDD.rol)

    res.status(200).json({
        token,
        nombre,
        apellido,
        username,
        _id,
        rol,
        email:jugadorBDD.email
    })

}

const perfil =(req,res)=>{
    if (!req.jugadorBDD || req.jugadorBDD.rol !== "jugador") {
        return res.status(403).json({ msg: "Acceso denegado: solo jugadores" });
    }
    const {token,confirmEmail,createdAt,updatedAt,__v,...datosPerfil} = req.jugadorBDD
    res.status(200).json(datosPerfil)
}

const actualizarPerfil = async (req,res)=>{
    const {id} = req.params
    
    if (!req.jugadorBDD || req.jugadorBDD.rol !== "jugador") {
        return res.status(403).json({ msg: "Acceso denegado: solo jugadores" });
    }
    
    // Validar que el jugador solo pueda actualizar su propio perfil
    if (req.jugadorBDD._id.toString() !== id) {
        return res.status(403).json({ msg: "No tienes permisos para modificar este perfil" });
    }
    
    const {nombre,apellido,username,email} = req.body
    if( !mongoose.Types.ObjectId.isValid(id) ) return res.status(404).json(
        {msg:`Lo sentimos, debe ser un id válido`}
    )
    if (Object.values(req.body).includes("")) return res.status(400).json(
        {msg:"Lo sentimos, debes llenar todos los campos"}
    )

    const jugadorBDD = await Jugadores.findById(id)
    if(!jugadorBDD) return res.status(404).json(
        {msg:`Lo sentimos, no existe el jugador ${id}`}
    )
    if (jugadorBDD.email != email)
    {
        const jugadorBDDMail = await Jugadores.findOne({email})
        if (jugadorBDDMail)
        {
            return res.status(404).json(
                {msg:`Lo sentimos, el email existe ya se encuentra registrado`}
            )  
        }
    }
    jugadorBDD.nombre = nombre ?? jugadorBDD.nombre
    jugadorBDD.apellido = apellido ?? jugadorBDD.apellido
    jugadorBDD.username = username ?? jugadorBDD.username
    jugadorBDD.email = email ?? jugadorBDD.email
    
    await jugadorBDD.save()
    const {token,confirmEmail,createdAt,updatedAt,__v,password,...datosActualizados} = req.jugadorBDD

    res.status(200).json(datosActualizados)
}

const actualizarPassword = async (req,res)=>{
    if (!req.jugadorBDD || req.jugadorBDD.rol !== "jugador") {
        return res.status(403).json({ msg: "Acceso denegado: solo jugadores" });
    }
    
    const jugadorBDD = await Jugadores.findById(req.jugadorBDD._id)
    if(!jugadorBDD) return res.status(404).json(
        {msg:`Lo sentimos, no existe el jugador ${id}`}
    )
    const{presentpassword,newpassword} = req.body
    if (Object.values(req.body).includes("")) {
        return res.status(400).json(
            { msg: "Lo sentimos, debes llenar todos los campos" }
        );
    }
    const verificarPassword = await jugadorBDD.matchPassword(presentpassword)
    if(!verificarPassword) return res.status(404).json(
        {msg:"Lo sentimos, La contraseña actual no es correcta"}
    )
    jugadorBDD.password = await jugadorBDD.encrypPassword(newpassword)
    await jugadorBDD.save()
    res.status(200).json(
        {msg:"Contraseña actualizada correctamente"}
    )
}

const actualizarImagenPerfil = async (req, res) => {
    const { id } = req.params;
    
    if (!req.jugadorBDD || req.jugadorBDD.rol !== "jugador") {
        return res.status(403).json({ msg: "Acceso denegado: solo jugadores" });
    }
    
    // Validar que el jugador solo pueda actualizar su propia imagen
    if (req.jugadorBDD._id.toString() !== id) {
        return res.status(403).json({ msg: "No tienes permisos para modificar esta imagen" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ msg: "ID inválido" });
    }

    const jugador = await Jugadores.findById(id);
    if (!jugador) {
        return res.status(404).json({ msg: "Jugador no encontrado" });
    }

    try {
        // Si ya tiene imagen previa en Cloudinary, eliminarla
        if (jugador.avatarJugadorID) {
            await cloudinary.uploader.destroy(jugador.avatarJugadorID);
        }

        let secure_url, public_id;

        // Caso 1: Imagen subida como archivo
        if (req.files?.imagen) {
            const { tempFilePath } = req.files.imagen;
            ({ secure_url, public_id } = await cloudinary.uploader.upload(tempFilePath, {
                folder: "Jugadores",
            }));
            await fs.unlink(tempFilePath);
            jugador.avatarJugador = secure_url;
            jugador.avatarJugadorID = public_id;
        } else {
            return res.status(400).json({ msg: "No se envió ninguna imagen" });
        }

        await jugador.save();

        res.status(200).json({
            msg: "Imagen actualizada correctamente",
            avatar: secure_url
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Error al subir imagen" });
    }
}

const donarJugador = async (req, res) => {
    if (!req.jugadorBDD || req.jugadorBDD.rol !== "jugador") {
        return res.status(403).json({ msg: "Acceso denegado: solo jugadores" });
    }
    
    const { paymentMethodId, cantidad, motivo } = req.body;

    if (!paymentMethodId || !cantidad || cantidad <= 1) {
        return res.status(400).json(
            { msg: "Datos incompletos o inválidos" }
        )
    }

    try {
        const jugador = req.jugadorBDD;
        if (!jugador) return res.status(401).json(
            { msg: "No autorizado" }
        )

        let [cliente] = (
        await stripe.customers.list({ email: jugador.email, limit: 1 })
        ).data || []

        if (!cliente) {
        cliente = await stripe.customers.create({
            name: `${jugador.nombre} ${jugador.apellido}`,
            email: jugador.email,
        });
        }

        const pago = await stripe.paymentIntents.create({
            amount: cantidad, 
            currency: "usd",
            description: motivo || "Donación al sistema",
            payment_method: paymentMethodId,
            confirm: true,
            customer: cliente.id,
            automatic_payment_methods: {
                enabled: true,
                allow_redirects: "never",
            }
        })

        if (pago.status === "succeeded") {
            const cantidadConvertida = (cantidad/100)
            const nuevaDonacion = new Donaciones({
                jugador: jugador._id,             
                cantidad: cantidadConvertida,                         
                motivo: motivo || "Donación al sistema",
            });
            await nuevaDonacion.save()
            return res.status(200).json(
                { msg: "¡Gracias por tu donación!" }
            )
        } else {
            return res.status(400).json(
                { msg: "No se pudo procesar el pago" }
            )
        }
    } catch (error) {
        console.error("Error de Stripe:", error.message)
        return res.status(500).json(
            { msg: "Error al procesar la donación" }
        )
    }
}
const descargarJuego = async (req, res) => {
    try {
        if (!req.jugadorBDD || req.jugadorBDD.rol !== "jugador") {
            return res.status(403).json({ msg: "Acceso denegado: solo jugadores" });
        }
        
        const jugador = req.jugadorBDD;
        if (!jugador) return res.status(401).json({ msg: "No autorizado" });

        const nombreArchivo = req.params.nombreArchivo;
        const rutaArchivo = path.join(__dirname, "../archive", nombreArchivo);
        if (!fs.existsSync(rutaArchivo)) return res.status(404).json({ msg: "Archivo no encontrado" });

        // Obtener el número de descarga actual
        const ultimaDescarga = await Descarga.findOne().sort({ numeroDescarga: -1 });
        const numeroDescarga = ultimaDescarga ? ultimaDescarga.numeroDescarga + 1 : 1;

        // Guardar descarga
        const nuevaDescarga = new Descarga({
            numeroDescarga,
            jugador: jugador._id
            
        });
        await nuevaDescarga.save();

        // Enviar archivo
        res.download(rutaArchivo, nombreArchivo, (err) => {
            if (err) {
                console.error("Error al enviar archivo:", err);
            }
        });
    } catch (error) {
        console.error(error);
        if (!res.headersSent) {
            res.status(500).json({ msg: "Error interno del servidor" });
        }
    }
};
const eliminarCuentaJugador = async (req, res) => {
    const { id } = req.params;
    
    if (!req.jugadorBDD || req.jugadorBDD.rol !== "jugador") {
        return res.status(403).json({ msg: "Acceso denegado: solo jugadores" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json(
            { msg: `ID inválido` }
        )
    }

    if (req.jugadorBDD._id.toString() !== id) {
        return res.status(403).json(
            { msg: "No tienes permisos para eliminar esta cuenta" }
        )
    }

    if (req.jugadorBDD.avatarJugadorID) {
        await cloudinary.uploader.destroy(req.jugadorBDD.avatarJugadorID);
    }

    await Jugadores.findByIdAndDelete(id);
    res.status(200).json(
        { msg: "Tu cuenta ha sido eliminada correctamente" }
    )
}

const verPublicaciones = async (req, res) => {
    try {
        if (!req.jugadorBDD || req.jugadorBDD.rol !== "jugador") {
            return res.status(403).json({ msg: "Acceso denegado: solo jugadores" });
        }
        
        const publicaciones = await Publicaciones.find()
            .populate("administrador", "nombre apellido username")
            .sort({ createdAt: -1 });

        res.status(200).json(publicaciones);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Error al obtener publicaciones" });
    }
};

const verDetallePublicacion = async (req, res) => {
    try {
        if (!req.jugadorBDD || req.jugadorBDD.rol !== "jugador") {
            return res.status(403).json({ msg: "Acceso denegado: solo jugadores" });
        }
        
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ msg: "ID inválido" });
        }

        const publicacion = await Publicaciones.findById(id)
            .populate("administrador", "nombre apellido username avatarAdministrador");

        if (!publicacion) {
            return res.status(404).json({ msg: "Publicación no encontrada" });
        }

        res.status(200).json(publicacion);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Error al obtener la publicación" });
    }
};

export { 
    registro,
    confirmarEmail,
    recuperarPassword,
    comprobarTokenPassword,
    crearNuevaPassword,
    login,
    perfil,
    actualizarPerfil,
    actualizarPassword,
    actualizarImagenPerfil,
    donarJugador,
    descargarJuego,
    eliminarCuentaJugador,
    verPublicaciones,
    verDetallePublicacion
};
