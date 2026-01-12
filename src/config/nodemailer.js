import nodemailer from "nodemailer"
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'


const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()


let transporter = nodemailer.createTransport({
    service: 'gmail',
    host: process.env.HOST_MAILTRAP,
    port: process.env.PORT_MAILTRAP,
    auth: {
        user: process.env.USER_MAILTRAP,
        pass: process.env.PASS_MAILTRAP,
    }
});

const sendMailToRegister = (userMail, token) => {
    let mailOptions = {
        from: 'my.delta.studio@gmail.com',
        to: userMail,
        subject: "Bienvenido a Wraith - Confirma tu cuenta",
        html: `
        <div style="font-family: Arial, sans-serif; background-color: #121212; color: #ffffff; padding: 30px; border-radius: 10px;">
            <div style="text-align: center;">
                <img src="cid:logo" alt="Delta Studio Logo" style="width: 120px; margin-bottom: 20px;" />
                <h1 style="color: #a0a0a0;">Bienvenido a Wraith</h1>
                <p style="font-size: 16px;">Has sido elegido para comenzar tu travesía en el mundo de Wraith. Antes de adentrarte en las mazmorras y descubrir los secretos que te esperan, debes activar tu vínculo haciendo clic en el botón.</p>
                <a href="${process.env.URL_BACKEND}confirmar/${token}" 
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

    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error)
        } else {
            console.log("Mensaje enviado satisfactoriamente: ", info.messageId)
        }
    })
}

const sendMailToRecoveryPassword = async(userMail, token) => {
    let info = await transporter.sendMail({
        from: 'my.delta.studio@gmail.com',
        to: userMail,
        subject: "Correo para reestablecer tu contraseña",
        html: `
        <div style="font-family: Arial, sans-serif; background-color: #121212; color: #ffffff; padding: 30px; border-radius: 10px;">
            <div style="text-align: center;">
                <img src="cid:logo" alt="Delta Studio Logo" style="width: 100px; margin-bottom: 20px;" />
                <h1 style="color: #a0a0a0;">Reestablecer contraseña</h1>
                <p style="font-size: 16px;">Haz clic en el botón para restablecer tu contraseña:</p>
                <a href="${process.env.URL_BACKEND}recuperarpassword/${token}" 
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
