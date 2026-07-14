
/src
  /config          <-- (confuguracion de variables de entorno y entornos de desarrollo)
  archivo de configuracion para variables de entorno, tomar este como referencia
  ```
require('dotenv').config();

  

const config = {

env: process.env.NODE_ENV,

port: process.env.PORT || 3000,

dbUser: process.env.DB_USER,

dbPassword: process.env.DB_PASSWORD,

dbHost: process.env.DB_HOST,

dbName: process.env.DB_NAME,

dbPort: process.env.DB_PORT,

apiKey: process.env.API_KEY,

jwtSecret: process.env.JWT_SECRET,

smtpEmail: process.env.EMAIL,

smtpPassword: process.env.EMAIL_PASSWORD,

smtpHost: process.env.EMAIL_HOST,

smtpPort: parseInt(process.env.EMAIL_PORT, 10), // Convertimos el puerto a número

};

  

module.exports = { config };
  ```
  
  archivo de configuracion para entorno de desarrollo, tomar este como referencia:
  ```
  const {config }= require('../config/config')

const USER = encodeURIComponent(config.dbUser);

const PASSWORD= encodeURIComponent(config.dbPassword);

const URI = `postgres://${USER}:${PASSWORD}@${config.dbHost}:${config.dbPort}/${config.dbName}`

  

module.exports = {

development: {

url: URI,

dialect: 'postgres',

},

production: {

url: URI,

dialect: 'postgres',

},

}
  ```
  /db/migrations (con un archivo buildplate)
  /db/models(con un archivo buildplate)
  /db/seders(con un archivo buildplate)

  /libs <-- (Tu inicialización de Sequelize, conexión, etc.)
	  postgres.js (tomar este como referencia)
```
	const {Client} = require('pg');
			async function getConnection() {
			
			const client = new Client({
			
			host: 'localhost',
			
			port: '5432',
			
			user: 'mario',
			
			password: 'admin123',
			
			database: 'hydrolink'
			
			});
			
			await client.connect();
			
			return client;
			
			}
			
			  
			
			module.exports = getConnection;
```
		
		
		postgres.pool.js (tomar esto como referencia)
```
			const {Pool} = require('pg');

const {config }= require('./../config/config')

  

const USER = encodeURIComponent(config.dbUser);

const PASSWORD= encodeURIComponent(config.dbPassword);

const URI = `postgres://${USER}:${PASSWORD}@${config.dbHost}:${config.dbPort}/${config.dbName}`

  

//conexion de tipo pool

const pool = new Pool({ connectionString: URI});

  

module.exports = pool;
```


		sequelize.js (tomar esto como referencia)
```
			const { Sequelize } = require('sequelize');

const {config }= require('../config/config')

const setupModels = require('../db/models/index');

  
  

const USER = encodeURIComponent(config.dbUser);

const PASSWORD= encodeURIComponent(config.dbPassword);

const URI = `postgres://${USER}:${PASSWORD}@${config.dbHost}:${config.dbPort}/${config.dbName}`

  

//esto ya implementa la conexion de tipo pool

const sequelize = new Sequelize(URI , {

dialect: 'postgres',

logging: config.env === 'production' ? false : console.log

});

  

setupModels(sequelize);

  

//aqui sincroniza la estructura del schema de acuerdo a la estructura de la bd

//Esto no es recomendable en produccion

//sequelize.sync();

  

module.exports = sequelize;
```
		  
  /middlewares     <-- (Validadores, auth, manejo de errores)
	  auth.handler.js
```
	  const boom = require('@hapi/boom');

const { config } = require('../config/config');

  

function checkApiKey(req, res, next) {

const apiKey = req.headers['api'];

if (apiKey === config.apiKey) {

next();

}

else {

next(boom.unauthorized('apiKey is required'));

}

}

  

/* function checkAdminRole(req, res, next) {

console.log(req.user);

const user = req.user;

if (user.role === 'admin') {

next();

} else {

next(boom.unauthorized('Admin role is required'));

}

} */

  

function checkRoles(...roles) {

return (req, res, next) => {

const user = req.user;

if (roles.includes(user.role)) {

next();

} else {

next(boom.unauthorized('This role is not allowed'));

}

}

}

module.exports = { checkApiKey, checkRoles };
```
	error.handler.js:
```
const { ValidationError } = require('sequelize');

const boom = require('@hapi/boom');

const { func } = require('joi');

function logErrors(err, req, res, next) {

console.error(err);

next(err);

};

  

function errorHandler(err, req, res, next) {

res.status(500).json({

message: err.message,

//el stack permite saber donde sucedio el error

stack: err.stack,

});

};

  

function boomErrorHandler(err, req, res, next) {

if (err.isBoom) {

const { output } = err;

res.status(output.statusCode).json(output.payload);

}else{

next(err);

}

};

  

function ormErrorHandler (err, req, res, next) {

if(err instanceof ValidationError){

res.status(409).json({

statusCode: 409,

message: err.name,

errors: err.errors

});

}

next(err);

}

  

module.exports = { logErrors, errorHandler, boomErrorHandler, ormErrorHandler };

```

validator.handler.js
```
const boom = require('@hapi/boom');

  

function validatorHandler(schema, property) {

return (req, res, next) => {

//esto hace que sea dinamoico, y sirva para cualquier tipo de peticion, isn importar si es get, post, update o delete

const data = req[property]

const { error } = schema.validate(data, {abortEarly: false});

if (error){

next(boom.badRequest(error));

}

next();

}

};

  

module.exports = validatorHandler;
```

  /models          <-- (Aquí es donde van tus modelos de Sequelize - MVC: Modelo)
  ejModelo.js
  /services        <-- (Aquí vive toda tu lógica de negocio - 3 Capas: Negocio)
  ejServicio.js
  /utils
	  /auth
		  /stragegis
			  jwt.strategy.js
```
const { Strategy, ExtractJwt } = require('passport-jwt');

const { config } = require('../../../config/config');

const options = {

secretOrKey: config.jwtSecret,

jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()

}

  

//esta estrategia ya te entrega el payload del token

const JwtStrategy = new Strategy(options, async (payload, done) => {

return done(null, payload);

});

  

module.exports = JwtStrategy;
```

local.stratejy.js
```
const { Strategy } = require('passport-local');

const AuthService = require('../../../services/auth.service');

  

const service = new AuthService();

  

//esto es una validacion de usuario y contraseña en local

const LocalStrategy = new Strategy({

//estos son los alias de los campos que se van a validar

usernameField: 'email',

passwordField: 'password'

}, async (email, password, done) => {

try {

const user = await service.getUser(email,password);

//si todo esta bien

done(null, user);

  

} catch (error) {

//si hay un error

done(error, false);

}

  

});

  

module.exports = LocalStrategy;
```
index.js (de las strategys)
```
const passport = require('passport');

  

const LocalStrategy = require('./strategies/local.strategy');

const JwtStrategy = require('./strategies/jwt.strategy');

  

passport.use(LocalStrategy);

passport.use(JwtStrategy);
```
  /controllers     <-- (NUEVO: Aquí recibes la petición, llamas al Service, y renderizas la vista - MVC: Controlador)
  ejController.js
  /routes          <-- (NUEVO: Apuntan a los controllers - MVC: Puente)
  ejRoute
  /views           <-- (NUEVO: Tus archivos .ejs - MVC: Vista)
  ejVista.ejs
  /schemas         <-- (Validaciones de datos, ej: Joi)
  toma este como referencia para hacer las validaciones con joi
```
const Joi = require('joi');

  

// Definición de reglas para cada campo

const id = Joi.number().integer();

const user_id = Joi.number().integer().required();

const weather_id = Joi.number().integer().required();

const hectares_number = Joi.number().positive().required();

const location = Joi.string().max(255).required();

const nocturnal_irrigation = Joi.boolean().default(false);

const crop_type = Joi.string().max(100).required();

const icon = Joi.string().max(25).required();

const name = Joi.string().max(100).required();

const irrigation_frequency = Joi.string().max(50).required();

const irrigation_cycle = Joi.string().max(50).required();

const last_irrigation_cycle = Joi.date().required();

const createdAt = Joi.date().default(Date.now);

  

// Esquema para crear un riego

const createIrrigationSchema = Joi.object({

user_id: user_id.required(),

hectares_number: hectares_number.required(),

nocturnal_irrigation: nocturnal_irrigation.required(),

crop_type: crop_type.required(),

icon: icon.required(),

name: name.required(),

irrigation_frequency: irrigation_frequency.required(),

irrigation_cycle: irrigation_cycle.required(),

});

  

// Esquema para actualizar un riego

const updateIrrigationSchema = Joi.object({

user_id: user_id.optional(),

weather_id: weather_id.optional(),

hectares_number: hectares_number.optional(),

location: location.optional(),

nocturnal_irrigation: nocturnal_irrigation.optional(),

crop_type: crop_type.optional(),

icon: icon.optional(),

name: name.optional(),

irrigation_frequency: irrigation_frequency.optional(),

irrigation_cycle: irrigation_cycle.optional(),

last_irrigation_cycle: last_irrigation_cycle.optional(),

});

  

// Esquema para obtener un riego por ID

const getIrrigationSchema = Joi.object({

id: id.required(),

});

  

const getIrrigationsByIdSchema = Joi.object({

id: id.required(),

});

  

module.exports = { createIrrigationSchema, updateIrrigationSchema, getIrrigationSchema, getIrrigationsByIdSchema };
```

en el archivo principal puedes usar algo como esto:
```
const express = require('express');

const cors = require('cors');

const routerApi = require('./routes');

const { checkApiKey } = require('./middlewares/auth.handler');

const { logErrors, errorHandler, boomErrorHandler, ormErrorHandler } = require('./middlewares/error.handler')

  

const app = express();

//con esto el puerto es dinamico, se asigna segun el puerto que heroku diga

const port = process.env.PORT || 3000;

  

app.use(express.json());

  

//solucionar el problema de CORS, y gestionar los accesos a la api

const whitelist = ['http://localhost:8080'];

const options = {

origin: (origin, callback) => {

if (whitelist.includes(origin) || !origin){

callback(null, true);

}else{

callback(new Error('no permitido'))

}

}

};

  

app.use(cors());

  

//aqui ejecuta las estregegias de validacion

require('./utils/auth');

  

app.get('/', (req, res) => {

res.send('Hola mi server en express');

});

  
  

app.get('/nueva-ruta', checkApiKey, (req, res) => {

res.send('Hola soy un nuevo endpoint');

});

  

routerApi(app)

  

//se ejecutan en este orden

app.use(logErrors);

app.use(ormErrorHandler);

app.use(boomErrorHandler);

app.use(errorHandler);

  

app.listen(port, () => {

console.log("Mi port " + port)

});
```

dockerizar el proyecto, tomando en cuenta que la api debe ser un proyecto, la base de datos otro y pgadmin
docker-compose.yml de ejemplo
```
version: '3.8'

services:
  postgres:
    image: postgres:13
    container_name: my_postgres
    environment:
      - POSTGRES_DB=hydrolink
      - POSTGRES_USER=mario
      - POSTGRES_PASSWORD=admin123
    ports:
      - "5432:5432"  # Cambia el puerto host si es necesario
    volumes:
      - ./postgres_data:/var/lib/postgresql/data
    networks:
      - my_network  # Conecta el servicio a la red

  pgadmin:
    image: dpage/pgadmin4
    environment:
      - PGADMIN_DEFAULT_EMAIL=admin@mail.com
      - PGADMIN_DEFAULT_PASSWORD=root
    ports:
      - "5050:80"
    networks:
      - my_network

  my_api:
    image: my_api:latest  # <-- Aquí defines el nombre de la imagen
    build: .
    ports:
      - "3000:3000"
    volumes:
      - .:/usr/src/app
      - /usr/src/app/node_modules
    networks:
      - my_network
    depends_on:
      - postgres
    environment:
      - NODE_ENV=development

  mosquitto:
    image: eclipse-mosquitto
    ports:
      - "1883:1883"
      - "8000:8000"
    volumes:
      - ./mosquitto.conf:/mosquitto/config/mosquitto.conf
    networks:
      - my_network

networks:
  my_network:
    driver: bridge  # Usa la configuración predeterminada de Docker para la red
```


Dockerfile de ejemplo:
```
# Usa una imagen base de Node.js
FROM node:16

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# Copia solo los archivos necesarios para instalar dependencias
COPY package.json package-lock.json ./

# Instala las dependencias del proyecto
RUN npm install

# Copia el resto del código
COPY . .

# Expone el puerto en el que la API escuchará
EXPOSE 3000

CMD ["npx", "nodemon", "--legacy-watch", "server.js"]
```

