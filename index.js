const express = require('express');
require('dotenv').config();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const cors = require('cors');
const path = require("path");
const fs = require("fs");
var webpayPlusRouter = require("./routes/webpay_plus");



// Crear el servidor de express
const app = express();
app.use(bodyParser.json());

// Base de datos

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

// CORS
app.use(cors());

// Directorio Público
app.use( express.static('public') );
// app.use('/', (req, res)=> res.sendFile(path.join(__dirname,"public/index.html")) );

// Lectura y parseo del body
app.use( express.json() );

// Cookies
app.use(cookieParser());

// Rutas
app.use('/webpay_plus', webpayPlusRouter );



// Escuchar peticiones
app.listen( process.env.PORT, () => {
    console.log(`Servidor corriendo en puerto ${ process.env.PORT }`);
});