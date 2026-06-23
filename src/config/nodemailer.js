import nodemailer from "nodemailer"
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'


const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()


/**
 * Envío de correo con dos caminos:
 *
 * 1) API HTTP de Brevo (preferido si existe BREVO_API_KEY).
 *    En Render el SMTP saliente (puerto 587/465) suele colgarse o ser bloqueado,
 *    lo que provoca que la petición tarde mucho y termine en 500. La API HTTP va
 *    por HTTPS (443), que siempre está abierto, así que es rápida y fiable.
 *    Doc: https://developers.brevo.com/reference/sendtransacemail
 *
 * 2) SMTP (fallback con nodemailer) si no hay BREVO_API_KEY. Se añaden timeouts
 *    cortos para fallar rápido en vez de colgar la petición ~2 minutos.
 *
 * Brevo SMTP:  host=smtp-relay.brevo.com  port=587 (STARTTLS) ó 465 (SSL)
 *              user=Login de Brevo   pass=SMTP key (xsmtpsib-...)
 * Brevo API :  BREVO_API_KEY = clave de API v3 (xkeysib-...), distinta de la SMTP key.
 */
const SMTP_PORT = Number(process.env.SMTP_PORT || process.env.PORT_MAILTRAP) || 587

let transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || process.env.HOST_MAILTRAP || "smtp-relay.brevo.com",
    port: SMTP_PORT,
    secure: SMTP_PORT === 465, // true solo para 465 (SSL); 587/2587 usan STARTTLS
    auth: {
        user: process.env.SMTP_USER || process.env.USER_MAILTRAP,
        pass: process.env.SMTP_PASS || process.env.PASS_MAILTRAP,
    },
    connectionTimeout: 10000, // 10s para abrir el socket
    greetingTimeout: 10000,   // 10s para el saludo del servidor
    socketTimeout: 20000,     // 20s de inactividad máx.
});

const BREVO_API_KEY = process.env.BREVO_API_KEY

// Remitente: debe ser un sender verificado en Brevo (admite Gmail como single sender).
const extraerEmail = (s) => {
    const m = /<([^>]+)>/.exec(s || "")
    return m ? m[1].trim() : (s || "").trim()
}
const MAIL_FROM = process.env.MAIL_FROM || "Wraith - Delta Studio <my.delta.studio@gmail.com>"
const MAIL_FROM_NAME = "Wraith - Delta Studio"
const MAIL_FROM_EMAIL = process.env.MAIL_FROM_EMAIL || extraerEmail(MAIL_FROM) || "my.delta.studio@gmail.com"

// Base del frontend para los enlaces de los correos. Se normaliza a una sola
// barra final, sin importar cómo esté la variable. Incluye /api porque el
// frontend define las rutas api/confirmar/:token y api/recuperarpassword/:token.
// Default = producción por si falta. OJO: si en Render URL_FRONTEND apunta a
// localhost, los enlaces saldrán a localhost; hay que ponerla con la URL pública.
const FRONTEND_URL = (process.env.URL_FRONTEND || "https://wraith-web.vercel.app/api/")
    .trim()
    .replace(/\/+$/, "") + "/"

/**
 * Envío central. Lanza si falla, para que el controlador lo capture.
 */
const enviarCorreo = async ({ to, subject, html }) => {
    if (BREVO_API_KEY) {
        const resp = await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: {
                "api-key": BREVO_API_KEY,
                "Content-Type": "application/json",
                "accept": "application/json",
            },
            body: JSON.stringify({
                sender: { name: MAIL_FROM_NAME, email: MAIL_FROM_EMAIL },
                to: [{ email: to }],
                subject,
                htmlContent: html,
            }),
        })
        if (!resp.ok) {
            const detalle = await resp.text()
            throw new Error(`Brevo API ${resp.status}: ${detalle}`)
        }
        const data = await resp.json().catch(() => ({}))
        console.log("Correo enviado (Brevo API):", data?.messageId ?? "ok")
        return
    }

    const info = await transporter.sendMail({ from: MAIL_FROM, to, subject, html })
    console.log("Correo enviado (SMTP):", info.messageId)
}

const sendMailToRegister = async (userMail, token) => {
    const html = `
        <div style="font-family: Arial, sans-serif; background-color: #121212; color: #ffffff; padding: 30px; border-radius: 10px;">
            <div style="text-align: center;">
                <h1 style="color: #a0a0a0;">Bienvenido a Wraith</h1>
                <p style="font-size: 16px;">Has sido elegido para comenzar tu travesía en el mundo de Wraith. Antes de adentrarte en las mazmorras y descubrir los secretos que te esperan, debes activar tu vínculo haciendo clic en el botón.</p>
                <a href="${FRONTEND_URL}confirmar/${token}"
                    style="display: inline-block; padding: 12px 25px; margin-top: 20px; font-size: 16px; background-color: #4b4b4b; color: #ffffff; text-decoration: none; border-radius: 5px;">
                    Confirmar Cuenta
                </a>
            </div>
            <hr style="margin: 30px 0; border: 0; border-top: 1px solid #333;">
            <footer style="text-align: center; font-size: 14px; color: #aaaaaa;">
                Delta Studio © 2025 — El juego comienza ahora.
            </footer>
        </div>
    `
    await enviarCorreo({
        to: userMail,
        subject: "Bienvenido a Wraith - Confirma tu cuenta",
        html,
    })
}

const sendMailToRecoveryPassword = async (userMail, token) => {
    const html = `
        <div style="font-family: Arial, sans-serif; background-color: #121212; color: #ffffff; padding: 30px; border-radius: 10px;">
            <div style="text-align: center;">
                <h1 style="color: #a0a0a0;">Reestablecer contraseña</h1>
                <p style="font-size: 16px;">Haz clic en el botón para restablecer tu contraseña:</p>
                <a href="${FRONTEND_URL}recuperarpassword/${token}"
                    style="display: inline-block; padding: 12px 25px; margin-top: 20px; font-size: 16px; background-color: #4b4b4b; color: #ffffff; text-decoration: none; border-radius: 5px;">
                    Reestablecer Contraseña
                </a>
            </div>
            <hr style="margin: 30px 0; border: 0; border-top: 1px solid #333;">
            <footer style="text-align: center; font-size: 14px; color: #aaaaaa;">
                El equipo de Delta Studio está aquí para ayudarte.
            </footer>
        </div>
    `
    await enviarCorreo({
        to: userMail,
        subject: "Correo para reestablecer tu contraseña",
        html,
    })
}



export
{
    sendMailToRegister,
    sendMailToRecoveryPassword
}
