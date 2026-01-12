import {Router} from 'express'
import {confirmarEmail, registro, recuperarPassword, comprobarTokenPassword, crearNuevaPassword, login, perfil, actualizarPerfil, actualizarPassword, donarJugador, actualizarImagenPerfil, descargarJuego, eliminarCuentaJugador, verPublicaciones, verDetallePublicacion} from '../controllers/Jugador_controller.js'
import { verificarTokenJWT } from '../middlewares/JWT.js'

const router = Router()

router.post('/registro',registro)
router.get('/confirmar/:token',confirmarEmail)
router.post('/recuperarpassword',recuperarPassword)
router.get('/recuperarpassword/:token',comprobarTokenPassword)
router.post('/nuevopassword/:token',crearNuevaPassword)
router.post('/login',login)
router.get('/perfil',verificarTokenJWT,perfil)
router.put('/jugador/:id',verificarTokenJWT,actualizarPerfil)
router.put('/jugador/actualizarpassword/:id',verificarTokenJWT,actualizarPassword)
router.put('/jugador/imagen/:id',verificarTokenJWT,actualizarImagenPerfil)
router.post('/jugador/donar',verificarTokenJWT, donarJugador)
router.get("/descargar/:nombreArchivo", verificarTokenJWT, descargarJuego);
router.delete('/jugador/eliminar/:id', verificarTokenJWT, eliminarCuentaJugador)
router.get("/jugador/publicaciones", verificarTokenJWT, verPublicaciones);
router.get("/jugador/publicaciones/:id", verificarTokenJWT, verDetallePublicacion);

export default router