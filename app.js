/* Este archivo sirve para configurar el servidor o la aplicación*/
const express = require('express');
const morgan = require('morgan');
const exphbs = require('express-handlebars');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const fs = require('fs');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();


const app = express();

/* SETTINGS */
app.set('port', process.env.PORT || 2000);// Si es que existe un puerto definido para la app usalo, sino por defecto usa 2000
app.set('views', path.join(__dirname, 'views'));   // Node sabe la ruta completa de esa carpeta.

app.use(cors(
    {
        origin: '*', // Permitir cualquier origenn
        credentials: true // Habilita las cookies
    }
));

//Establecemos y configuramos el motor de plantillas.
app.engine('.hbs', exphbs.create({
    defaultLayout: 'main',
    extname: '.hbs'
}).engine);

app.set('view engine', '.hbs'); //Usa el motor que se cofiguro anteriormente.

/* MIDELWARE */
app.use(morgan('dev')); //Utilizamos el modulo de morgan
app.use(express.urlencoded({ extended: true })); //Acepta los datos de un formulario HTML

/* ROUTERS */
//Utilizamos las rutas definidas en la carpeta router
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(require('./routes/routes'));

/* STATIC FILES */
//Indicamos donde estan archivos públicos.
app.use(express.static(path.join(__dirname, 'public')));

/* CONFIGURATION */
//Definimos maximo de peso de json
app.use(express.json({ limit: '200mb' }));

// Middlewate
app.use('/uploads', (req, res, next) => {
    if (req.url.includes('..') || req.url.includes('null')) {
        return res.status(400).send('Solicitud inválida');
    }
    next();
});
// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.post('/upload-pdf', upload.single('pdfFile'), (req, res) => {
    const { link_pdf_anterior } = req.body;

    if (!req.file) {
        return res.status(400).json({ error: 'No se ha subido un archivo PDF.' });
    }

    if (link_pdf_anterior && link_pdf_anterior !== null && link_pdf_anterior !== 'null' && link_pdf_anterior !== 'undefined') {
        eliminarArchivo(link_pdf_anterior); // Eliminar el archivo antiguo
    }

    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    if (fileExtension !== '.pdf') {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: 'Solo se permiten archivos PDF.' });
    }

    // Sanitización mejorada del nombre
    const originalName = req.file.originalname || 'unnamed.pdf';
    const cleanName = originalName
        .normalize('NFD')  // Separar caracteres acentuados
        .replace(/[\u0300-\u036f]/g, '')  // Eliminar diacríticos
        .replace(/[^a-zA-Z0-9\-._]/g, '') // Eliminar caracteres especiales
        .substring(0, 100); // Limitar longitud

    const uniqueName = Date.now() + '-' + cleanName;
    const newFilePath = path.join(__dirname, 'uploads', uniqueName);

    fs.renameSync(req.file.path, newFilePath);

    const fileUrl = '/uploads/' + uniqueName;

    res.json({ success: true, message: 'Operación completada', urlPDF: fileUrl });
});


// delete file
app.post('/delete-pdf', (req, res) => {
    const { pdf } = req.body;

    try {
        const pdfSanitizado = pdf
            .split('/').pop()         // Obtener último segmento
            .split('?')[0]            // Quitar parámetros URL
            .replace(/[^a-zA-Z0-9\-._]/g, ''); // Eliminar caracteres especiales

        if (pdfSanitizado.includes('.') && pdfSanitizado.length > 3) {
            const filePath = path.join('uploads', pdfSanitizado);
            eliminarArchivo(filePath);
            res.json({ success: true, message: 'Operación completada' });
        } else {
            console.error('Nombre de archivo inválido:', pdfSanitizado);
        }
    } catch (error) {
        console.error('Error al eliminar archivo:', error);
        res.json({ success: false, message: 'Error al eliminar archivo' });
    }

});


// Función para eliminar archivo (usando Promesas para async/await)
async function eliminarArchivo(ruta) {
    try {
        // Validación robusta de la ruta
        if (!ruta ||
            typeof ruta !== 'string' ||
            ruta.includes('..') ||
            ruta.toLowerCase() === 'null' ||
            ruta.trim() === ''
        ) {
            console.log('Ruta inválida, no se elimina:', ruta);
            return;
        }

        // Verificar si el archivo existe
        await fs.promises.access(ruta, fs.constants.F_OK);

        // Eliminar el archivo
        await fs.promises.unlink(ruta);
        console.log('Archivo eliminado:', ruta);
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log('El archivo no existía:', ruta);
        } else {
            console.error('Error al eliminar archivo:', error);
            throw error;
        }
    }
}


module.exports = { app, eliminarArchivo };

