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
 * Brevo SMTP:  host=smtp-relay.brevo.com  port=587 (STARTTLS)
 *              user=login/correo de la cuenta Brevo   pass=SMTP key (no la contraseña de la cuenta)
 *
 * Brevo permite usar como remitente un correo @gmail.com verificado (single
 * sender), por eso MAIL_FROM puede ser my.delta.studio@gmail.com. Como es SMTP
 * estándar, las mismas variables sirven para Resend/SendGrid cambiando solo el .env.
 */
const SMTP_PORT = Number(process.env.SMTP_PORT || process.env.PORT_MAILTRAP) || 587

let transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || process.env.HOST_MAILTRAP || "smtp-relay.brevo.com",
    port: SMTP_PORT,
    secure: SMTP_PORT === 465, // true solo para 465 (SSL); 587/2587 usan STARTTLS
    auth: {
        user: process.env.SMTP_USER || process.env.USER_MAILTRAP,
        pass: process.env.SMTP_PASS || process.env.PASS_MAILTRAP,
    }
});

/**
 * Remitente. Debe ser un sender verificado en Brevo. Brevo sí admite un correo
 * @gmail.com como single sender (lo confirmas con un clic desde ese Gmail), por
 * eso aquí el remitente es my.delta.studio@gmail.com.
 */
const MAIL_FROM = process.env.MAIL_FROM || "Wraith - Delta Studio <my.delta.studio@gmail.com>"

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
