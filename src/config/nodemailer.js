import nodemailer from "nodemailer"
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'


const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()


/**
 * Transporte SMTP genérico (Resend recomendado).
 *
 * Antes se usaba `service: 'gmail'`, lo que enrutaba TODO el correo por el SMTP
 * de Gmail. Google rate-limita y marca como spam el correo transaccional enviado
 * desde una IP de datacenter (Render), por eso los correos de verificación dejaban
 * de llegar. Con un proveedor transaccional (Resend) la entrega es fiable porque
 * usa SPF/DKIM propios y no depende de los límites de Gmail.
 *
 * Resend SMTP:  host=smtp.resend.com  port=465 (SSL) ó 587/2587 (STARTTLS)
 *               user="resend"         pass=API key (re_...)
 *
 * Como es SMTP estándar, las mismas variables sirven para Brevo o SendGrid sin
 * tocar código (solo cambian los valores en el .env).
 */
const SMTP_PORT = Number(process.env.SMTP_PORT || process.env.PORT_MAILTRAP) || 465

let transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || process.env.HOST_MAILTRAP || "smtp.resend.com",
    port: SMTP_PORT,
    secure: SMTP_PORT === 465, // true para 465 (SSL); false para 587/2587 (STARTTLS)
    auth: {
        user: process.env.SMTP_USER || process.env.USER_MAILTRAP,
        pass: process.env.SMTP_PASS || process.env.PASS_MAILTRAP,
    }
});

/**
 * Remitente. IMPORTANTE: Resend NO permite enviar desde una dirección @gmail.com.
 * El `from` debe ser un dominio verificado en Resend, p. ej.
 *   MAIL_FROM="Wraith - Delta Studio <no-reply@tudominio.com>"
 * Sin dominio propio, `onboarding@resend.dev` solo entrega al dueño de la cuenta
 * Resend (no a usuarios arbitrarios), por lo que NO sirve para producción.
 */
const MAIL_FROM = process.env.MAIL_FROM || "Wraith - Delta Studio <onboarding@resend.dev>"

const sendMailToRegister = async (userMail, token) => {
    let mailOptions = {
        from: MAIL_FROM,
        to: userMail,
        subject: "Bienvenido a Wraith - Confirma tu cuenta",
        html: `
        <div style="font-family: Arial, sans-serif; background-color: #121212; color: #ffffff; padding: 30px; border-radius: 10px;">
            <div style="text-align: center;">
                <img src="cid:logo" alt="Delta Studio Logo" style="width: 120px; margin-bottom: 20px;" />
                <h1 style="color: #a0a0a0;">Bienvenido a Wraith</h1>
                <p style="font-size: 16px;">Has sido elegido para comenzar tu travesía en el mundo de Wraith. Antes de adentrarte en las mazmorras y descubrir los secretos que te esperan, debes activar tu vínculo haciendo clic en el botón.</p>
                <a href="${process.env.URL_FRONTEND}confirmar/${token}"
                    style="display: inline-block; padding: 12px 25px; margin-top: 20px; font-size: 16px; background-color: #4b4b4b; color: #ffffff; text-decoration: none; border-radius: 5px;">
                    Confirmar Cuenta
                </a>
            </div>
            <hr style="margin: 30px 0; border: 0; border-top: 1px solid #333;">
            <footer style="text-align: center; font-size: 14px; color: #aaaaaa;">
                Delta Studio © 2025 — El juego comienza ahora.
            </footer>
        </div>
        `,
        attachments: [
            {
                filename: 'logo.jpg',
                path: path.join(__dirname, '../config/images/logo.jpg'),
                cid: 'logo' // ID usado en el src del HTML
            }
        ]
    }

    // await: si el envío falla, lanza el error para que el controlador lo capture
    // y avise al usuario (antes el error se tragaba en un callback y se perdía).
    const info = await transporter.sendMail(mailOptions)
    console.log("Correo de registro enviado: ", info.messageId)
}

const sendMailToRecoveryPassword = async(userMail, token) => {
    let info = await transporter.sendMail({
        from: MAIL_FROM,
        to: userMail,
        subject: "Correo para reestablecer tu contraseña",
        html: `
        <div style="font-family: Arial, sans-serif; background-color: #121212; color: #ffffff; padding: 30px; border-radius: 10px;">
            <div style="text-align: center;">
                <img src="cid:logo" alt="Delta Studio Logo" style="width: 100px; margin-bottom: 20px;" />
                <h1 style="color: #a0a0a0;">Reestablecer contraseña</h1>
                <p style="font-size: 16px;">Haz clic en el botón para restablecer tu contraseña:</p>
                <a href="${process.env.URL_FRONTEND}recuperarpassword/${token}"
                    style="display: inline-block; padding: 12px 25px; margin-top: 20px; font-size: 16px; background-color: #4b4b4b; color: #ffffff; text-decoration: none; border-radius: 5px;">
                    Reestablecer Contraseña
                </a>
            </div>
            <hr style="margin: 30px 0; border: 0; border-top: 1px solid #333;">
            <footer style="text-align: center; font-size: 14px; color: #aaaaaa;">
                El equipo de Delta Studio está aquí para ayudarte.
            </footer>
        </div>
        `,
        attachments: [
            {
                filename: 'logo.jpg',
                path: path.join(__dirname, '../config/images/logo.jpg'),
                cid: 'logo'
            }
        ]
    })
    console.log("Mensaje enviado satisfactoriamente: ", info.messageId)
}



export
{
    sendMailToRegister,
    sendMailToRecoveryPassword
}
