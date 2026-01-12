import {Router} from 'express'
import {actualizarImagenPerfil, actualizarPassword, actualizarPerfil, baneoJugador, crearPublicacion, listarPublicaciones, actualizarPublicacion, eliminarPublicacion, login, perfil, verDescargas, verDonaciones, verJugadores} from '../controllers/Administrador_controller.js'
import { verificarTokenJWT } from '../middlewares/JWT.js'

const router = Router()
router.post('/login/administrador',login)
router.get('/perfil/administrador',verificarTokenJWT,perfil)
router.put('/administrador/:id',verificarTokenJWT,actualizarPerfil)
router.put('/administrador/actualizarpassword/:id',verificarTokenJWT,actualizarPassword)
router.put('/administrador/imagen/:id',verificarTokenJWT, actualizarImagenPerfil);
router.delete('/administrador/banear/:id',verificarTokenJWT,baneoJugador)
router.get("/administrador/jugadores", verificarTokenJWT, verJugadores);
router.get("/administrador/donaciones", verificarTokenJWT, verDonaciones);
router.get("/administrador/descargas", verificarTokenJWT, verDescargas);
router.post("/administrador/publicar", verificarTokenJWT, crearPublicacion);
router.get("/administrador/publicaciones", verificarTokenJWT, listarPublicaciones);
router.put("/administrador/publicaciones/:id", verificarTokenJWT, actualizarPublicacion);
router.delete("/administrador/publicaciones/eliminar/:id", verificarTokenJWT, eliminarPublicacion);



export default router