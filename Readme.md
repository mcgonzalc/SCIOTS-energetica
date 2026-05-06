# API Proyecto de drones
## Descripción

API para gestion de datos de aplicacion de drones, desarrollada en Node.js con TypeScript usando Express y Mongoose para la gestion de base de datos en MongoDB.

## Requisitos previos
Es necesario tener instalado
- Node.js
- MongoDB

## Instalación
Clona el repositorio y ejecuta el siguiente comando para instalar las dependencias:
```sh
npm install
```
## Configuración
Crea un fichero `.env` en la raíz del proyecto y define las siguientes variables de entorno
```sh
MONGO_URI=mongodb://localhost:27017/tu_base_de_datos
PORT=9000
```

## Ejecución
Para iniciar la API (tsc + cd ./dist + node server.js) o usar:
```sh
npm start
```

## Documentación
Scalar está disponible en:
```
http://localhost:Puerto-configurado-dotenv/docs
```

## Dependencies Principales
- `dotenv`: Gestión de variables de entorno.
- `mongodb` i `mongoose`: Base de datos MongoDB.
- `@scalar/express-api-reference`: Generación de documentación.
- `express`: Framework para la API.
- `bigint-crypto-utils`: Configuraciones de RSA

## Dependencies de Desarrollo
- `typescript`: Suport per a TypeScript.