# Tesis-Videojuego Backend

Este repositorio contiene el código fuente del backend para el sistema de gestión de videojuegos, desarrollado como parte de la tesis "DESARROLLO DE UN VIDEOJUEGO IMPLEMENTADO CON MOTOR GODOT
VIDEOJUEGO Y BACKEND DE LA PLATAFORMA WEB".

## Descripción

El backend proporciona la lógica y funcionalidad necesarias para la gestión de administradores, jugadores y publicaciones dentro del sistema. Está desarrollado con Node.js, utilizando una base de datos no relacional (MongoDB) y siguiendo la arquitectura RESTful.

## Características principales

- Registro e inicio de sesión de usuarios.
- Gestión de perfiles de usuarios.
- Publicación y gestión de contenido.
- Sistema de donaciones.
- Gestión de descargas.

## Requisitos previos

- Node.js v14 o superior.
- MongoDB.
- Dependencias del proyecto (instaladas con `npm install`).

## Instalación

1. Clona este repositorio:
```bash
git clone https://github.com/SantiagoCumbal/Tesis-Juego.git
```

2. Instala las dependencias:
```bash
npm install
```

3. Configura las variables de entorno: Crea un archivo `.env` en la raíz del proyecto y define las siguientes variables:
```env
PORT =3000
MONGODB_ATLAS =tu_url_de_mongodb_atlas
JWT_SECRET =tu_secreto_jwt
CLOUDINARY_URL =tu_url_de_cloudinary
STRIPE_KEY =clave_de_stripe
```

4. Inicia el servidor:
```bash
npm run dev
```

## Documentación de la API

La documentación completa de los endpoints del backend se encuentra disponible en Postman. Puedes consultarla desde el siguiente enlace:
https://documenter.getpostman.com/view/45783866/2sBXVihpyQ 


## Manual de usuario

Para entender cómo utilizar el sistema, consulta el siguiente video que explica su uso:
https://youtu.be/nBH_bdbRgKs?si=0aBVrAoqLEzG2K2x 


## Autor

Santiago Paul Cumbal Suarez 

## Contribuciones

¡Las contribuciones son bienvenidas! Si deseas contribuir, sigue estos pasos:

1. Haz un fork del repositorio.
2. Crea una rama con la funcionalidad o corrección de errores que desees agregar.
3. Realiza un pull request describiendo tus cambios.

## Estado del proyecto

Este backend está en constante desarrollo. Para cualquier duda o problema, no dudes en abrir un issue.

## Despliegue

El backend está desplegado en Render y puedes acceder a él en la siguiente URL:

https://tesis-juego.onrender.com

## Contacto

Si tienes preguntas, sugerencias o problemas, puedes contactarme a través de:

- **Email:** santiago.cumbal@epn.edu.ec
- **GitHub:** SantiagoCumbal
