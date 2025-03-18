// app.js

/**
 * Configuración del servidor y de la subida de archivos.
 * Con la nueva lógica para manejar archivos PDF, imágenes (JPEG, PNG) y videos (MP4, AVI).
 */
const express = require('express');
const morgan = require('morgan');
const exphbs = require('express-handlebars');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const fs = require('fs');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

// Importar módulos personalizados
const { validateUploadFolder, allowedFolders } = require('./middlewares/fileValidation');
const { notFoundHandler, globalErrorHandler } = require('./middlewares/errorHandler');
const { eliminarArchivo } = require('./utils/fileUtils');
const fileRoutes = require('./routes/fileRoutes');

const app = express();
const PORT = process.env.PORT || 2000;

/* =======================
   SETTINGS & MIDDLEWARES
========================== */

// Configuración de vistas y motor de plantillas
app.set('port', PORT);
app.set('views', path.join(__dirname, 'views'));
app.engine('.hbs', exphbs.create({
    defaultLayout: 'main',
    extname: '.hbs'
}).engine);
app.set('view engine', '.hbs');

// Middlewares generales
app.use(cors({ credentials: true }));         // Habilita CORS con soporte para cookies entre dominios
app.use(morgan('dev'));                       // Registra logs de peticiones HTTP en formato dev
app.use(express.urlencoded({ extended: true })); // Permite parsear datos de formularios URL-encoded
app.use(bodyParser.urlencoded({ extended: true })); // Permite parsear datos de formularios complejos
app.use(bodyParser.json());                   // Permite parsear datos JSON en el cuerpo de las peticiones
app.use(cookieParser());                      // Analiza las cookies HTTP en los objetos request

// Archivos estáticos en la carpeta "public"
app.use(express.static(path.join(__dirname, 'public')));

/**
 * VALIDAR PETICIONES PARA VER ARCHIVOS
 *
 * Middleware para validar que la carpeta solicitada dentro de /uploads
 * sea una de las permitidas y que la URL no contenga patrones maliciosos.
 */
app.use('/uploads/:folder', validateUploadFolder);

/**
 * Middleware para servir archivos estáticos.
 * Cada carpeta permitida (images, pdfs, videos) se mapea a su carpeta correspondiente.
 */
allowedFolders.forEach(folder => {
    app.use(`/uploads/${folder}`, express.static(path.join(__dirname, 'uploads', folder)));
});

// Rutas
app.use(require('./routes/routes'));
app.use(fileRoutes);

/* ============================
       HANDLING 404 Y ERRORES
=============================*/

// Middleware para rutas inexistentes
app.all('*', notFoundHandler);

// Middleware global de manejo de errores
app.use(globalErrorHandler);

module.exports = { app, eliminarArchivo };
