import Administrador from "../models/Administrador.js";
import Jugadores from "../models/Jugador.js";
import Descargas  from "../models/Descarga.js";
import Donaciones from "../models/Donacion.js";
import Publicaciones from "../models/Publicaciones.js";

import { crearTokenJWT } from "../middlewares/JWT.js";
import fs from "fs-extra"
import mongoose from "mongoose"
import { v2 as cloudinary } from "cloudinary";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const login = async(req,res)=>{

    const {email,password} = req.body
    if (Object.values(req.body).includes("")) return res.status(400).json(
        {msg:"Lo sentimos, debes llenar todos los campos"}
    )
    const administradorBDD = await Administrador.findOne({email}).select("-status -__v -token -updatedAt -createdAt")

    if(!administradorBDD) return res.status(404).json(
        {msg:"Este administrador no existe"}
    )
    const verificarPassword = await administradorBDD.matchPassword(password)

    if(!verificarPassword)res.status(401).json(
        {msg:"Contraseña incorrecta"}
    )
    const {nombre,apellido,username,_id,rol} = administradorBDD
    const token = crearTokenJWT(administradorBDD._id,administradorBDD.rol)

    res.status(200).json({
        token,
        nombre,
        apellido,
        username,
        _id,
        rol,
        email:administradorBDD.email
    })

}
const perfil =(req,res)=>{
    const {token,confirmEmail,createdAt,updatedAt,__v,...datosPerfil} = req.administradorBDD
    res.status(200).json(datosPerfil)
}

const actualizarPerfil = async (req,res)=>{
    const {id} = req.params
    const {nombre,apellido,username,email} = req.body
    if( !mongoose.Types.ObjectId.isValid(id) ) return res.status(404).json(
        {msg:`Lo sentimos, debe ser un id válido`}
    )
    if (Object.values(req.body).includes("")) return res.status(400).json(
        {msg:"Lo sentimos, debes llenar todos los campos"}
    )

    const administradorBDD = await Administrador.findById(id)
    if(!administradorBDD) return res.status(404).json(
        {msg:`Lo sentimos, no existe el administrador ${id}`}
    )
    if (administradorBDD.email != email)
    {
        const administradorBDD = await Administrador.findOne({email})
        if (administradorBDD)
        {
            return res.status(404).json(
                {msg:`Lo sentimos, el email existe ya se encuentra registrado`}
            )  
        }
    }
    administradorBDD.nombre = nombre ?? administradorBDD.nombre
    administradorBDD.apellido = apellido ?? administradorBDD.apellido
    administradorBDD.username = username ?? administradorBDD.username
    administradorBDD.email = email ?? administradorBDD.email
    
    await administradorBDD.save()
    const {token,confirmEmail,createdAt,updatedAt,__v,password,...datosActualizados} = req.administradorBDD

    res.status(200).json(datosActualizados)
}
const actualizarPassword = async (req,res)=>{
    const administradorBDD = await Administrador.findById(req.administradorBDD._id)
    if(!administradorBDD) return res.status(404).json(
        {msg:`Alerta este administrador no existe`}
    )
    const{presentpassword,newpassword} = req.body
    if (Object.values(req.body).includes("")) {
        return res.status(400).json(
            { msg: "Lo sentimos, debes llenar todos los campos" }
        );
    }
    const verificarPassword = await administradorBDD.matchPassword(presentpassword)
    if(!verificarPassword) return res.status(404).json(
        {msg:"Lo sentimos, La contraseña actual no es correcta"}
    )
    administradorBDD.password = await administradorBDD.encrypPassword(newpassword)
    await administradorBDD.save()
    res.status(200).json(
        {msg:"Contraseña actualizada correctamente"}
    )
}

const actualizarImagenPerfil = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ msg: "ID inválido" });
    }

    const administradorBDD = await Administrador.findById(id);
    if (!administradorBDD) {
        return res.status(404).json({ msg: "Administrador no encontrado" });
    }

    try {
        // Si ya tiene imagen previa en Cloudinary, eliminarla
        if (administradorBDD.avatarAdministradorID) {
            await cloudinary.uploader.destroy(administradorBDD.avatarAdministradorID);
        }

        let secure_url, public_id;

        // Caso 1: Imagen subida como archivo
        if (req.files?.imagen) {
            const { tempFilePath } = req.files.imagen;
            ({ secure_url, public_id } = await cloudinary.uploader.upload(tempFilePath, {
                folder: "Administrador",
            }));
            await fs.unlink(tempFilePath);
            administradorBDD.avatarAdministrador = secure_url;
            administradorBDD.avatarAdministradorID = public_id;
        } else {
            return res.status(400).json({ msg: "No se envió ninguna imagen" });
        }

        await administradorBDD.save();

        res.status(200).json({
            msg: "Imagen actualizada correctamente",
            avatar: secure_url
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Error al subir imagen" });
    }
}

const baneoJugador = async (req, res) => {
    const { id } = req.params
    if (!req.administradorBDD ||req.administradorBDD.rol !== "administrador") {
        return res.status(403).json(
            { msg: "Acceso denegado: solo administradores pueden banear jugadores" }
        )
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json(
            { msg: "Lo sentimos, debe ser un id válido" }
        )
    }
    const jugadorBDD = await Jugadores.findById(id);
    if (!jugadorBDD) {
        return res.status(404).json(
            { msg: "Jugador no encontrado" }
        )
    }

    if(jugadorBDD.status === false){
        return res.status(404).json(
            { msg: "Este Jugador ya se encuentra Baneado por comportamiento inapropiado" }
        )
    }

    jugadorBDD.status = false;
    await jugadorBDD.save();

    res.status(200).json(
        { msg: `El jugador ${jugadorBDD.username} ha sido baneado por comportamiento inapropiado` }
    )
}

const verJugadores = async (req, res) => {
    try {
        if (!req.administradorBDD || req.administradorBDD.rol !== "administrador") {
        return res.status(403).json({ msg: "Acceso denegado" });
        }

        const jugadores = await Jugadores.find().select("nombre apellido username email status createdAt").sort({ createdAt: -1 });

        res.status(200).json(jugadores);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Error al obtener jugadores" });
    }
};

const verDonaciones = async (req, res) => {
    try {
        if (!req.administradorBDD || req.administradorBDD.rol !== "administrador") {
        return res.status(403).json({ msg: "Acceso denegado: solo administradores" });
        }

        const donaciones = await Donaciones.find().populate("jugador", "_id nombre apellido username email")
        .sort({ createdAt: -1 }); 

        res.status(200).json(donaciones);
    } catch (error) {
        console.error("Error al obtener donaciones:", error);
        res.status(500).json({ msg: "Error al obtener donaciones" });
    }
};


const verDescargas = async (req, res) => {
    try {
        if (!req.administradorBDD || req.administradorBDD.rol !== "administrador") {
        return res.status(403).json({ msg: "Acceso denegado" });
        }

        const descargas = await Descargas.find()
        .populate("jugador", "username email")
        .sort({ createdAt: -1 });

        res.status(200).json(descargas);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Error al obtener descargas" });
    }
};

const crearPublicacion = async (req, res) => {
    try {
        
        if (!req.administradorBDD || req.administradorBDD.rol !== "administrador") {
        return res.status(403).json({ msg: "Acceso denegado: solo administradores" });
        }
        
        const { titulo, informacion } = req.body;

        if (Object.values(req.body).includes("")) {
            return res.status(400).json({ msg: "Todos los campos son obligatorios" });
        }

        const nuevaPublicacion = new Publicaciones({
            administrador: req.administradorBDD._id,
            titulo,
            informacion,
        });

        await nuevaPublicacion.save();

        res.status(201).json({ msg: "Publicación creada correctamente", publicacion: nuevaPublicacion });

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Error al crear la publicación" });
    }
};

const listarPublicaciones = async (req, res) => {
    try {
        if (!req.administradorBDD || req.administradorBDD.rol !== "administrador") {
            return res.status(403).json({ msg: "Acceso denegado" });
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

const actualizarPublicacion = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!req.administradorBDD || req.administradorBDD.rol !== "administrador") {
            return res.status(403).json({ msg: "Acceso denegado" });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ msg: "ID inválido" });
        }

        const { titulo, informacion } = req.body;

        if (!titulo || !informacion) {
            return res.status(400).json({ msg: "Todos los campos son obligatorios" });
        }

        const publicacion = await Publicaciones.findByIdAndUpdate(
            id,
            { titulo, informacion },
            { new: true }
        );

        if (!publicacion) {
            return res.status(404).json({ msg: "Publicación no encontrada" });
        }

        res.status(200).json({ msg: "Publicación actualizada correctamente", publicacion });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Error al actualizar la publicación" });
    }
};

const eliminarPublicacion = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!req.administradorBDD || req.administradorBDD.rol !== "administrador") {
            return res.status(403).json({ msg: "Acceso denegado" });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ msg: "ID inválido" });
        }

        const publicacion = await Publicaciones.findByIdAndDelete(id);

        if (!publicacion) {
            return res.status(404).json({ msg: "Publicación no encontrada" });
        }

        res.status(200).json({ msg: "Publicación eliminada correctamente" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Error al eliminar la publicación" });
    }
};


export {
    login,
    perfil,
    actualizarPerfil,
    actualizarPassword,
    actualizarImagenPerfil,
    baneoJugador,
    verJugadores,
    verDonaciones,
    verDescargas,
    crearPublicacion,
    listarPublicaciones,
    actualizarPublicacion,
    eliminarPublicacion
}