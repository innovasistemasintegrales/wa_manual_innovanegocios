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

const AppError = require('./utils/AppError.js'); // Asegúrate de tener esta clase de error personalizada

// Módulos para la subida de archivos
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

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
app.use(cors({ credentials: true }));
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

// Archivos estáticos en la carpeta "public"
app.use(express.static(path.join(__dirname, 'public')));

// Define las carpetas permitidas
const allowedFolders = ['images', 'pdfs', 'videos'];

/**
 * Middleware para validar que la carpeta solicitada dentro de /uploads
 * sea una de las permitidas y que la URL no contenga patrones maliciosos.
 */
app.use('/uploads/:folder', (req, res, next) => {
    const { folder } = req.params;
    // Verificar que la carpeta solicitada esté en la lista de permitidas
    if (!allowedFolders.includes(folder) || req.url.includes('..') || req.url.includes('null')) {
        return res.status(400).send('Solicitud inválida');
    }
    next();
});

// Servir archivos estáticos para cada carpeta permitida
allowedFolders.forEach(folder => {
    app.use(`/uploads/${folder}`, express.static(path.join(__dirname, 'uploads', folder)));
});

// Si hay rutas definidas en otro archivo incluirlas aquí
app.use(require('./routes/routes'));

/* ============================
   CONFIGURACIÓN DE MULTER
=============================*/

/**
 * Función para determinar la categoría y carpeta de destino del archivo,
 * según su tipo (PDF, imagen o video).
 */
function getFileCategory(file) {
    const mime = file.mimetype;
    if (mime === 'application/pdf') {
        return { type: 'pdf', folder: path.join(__dirname, 'uploads', 'pdfs') };
    } else if (mime === 'image/jpeg' || mime === 'image/png') {
        return { type: 'image', folder: path.join(__dirname, 'uploads', 'images') };
    } else if (mime === 'video/mp4' || mime === 'video/x-msvideo') {
        return { type: 'video', folder: path.join(__dirname, 'uploads', 'videos') };
    }
    return null;
}

/**
 * Storage engine personalizado para Multer:
 * - Determina la carpeta destino según el tipo de archivo.
 * - Si se envía ?replace=true, elimina archivos existentes en esa carpeta.
 * - Sanitiza el nombre original, limitándolo a 100 caracteres y añade un UUID.
 */
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const category = getFileCategory(file);
        if (!category) {
            return cb(new Error('Tipo de archivo no permitido'), false);
        }
        // Asegurarse de que la carpeta exista
        fs.mkdirSync(category.folder, { recursive: true });

        // Si se desea reemplazar archivos existentes (query ?replace=true)
        if (req.query.replace && req.query.replace === 'true') {
            fs.readdir(category.folder, (err, files) => {
                if (err) {
                    console.error('Error leyendo la carpeta:', err);
                } else {
                    files.forEach(fileName => {
                        try {
                            fs.unlinkSync(path.join(category.folder, fileName));
                            console.log(`Archivo ${fileName} eliminado para reemplazo.`);
                        } catch (error) {
                            console.error('Error al eliminar archivo:', error);
                        }
                    });
                }
                // Continuar con la asignación de la carpeta destino
                cb(null, category.folder);
            });
        } else {
            cb(null, category.folder);
        }
    },
    filename: (req, file, cb) => {
        // Extraer el nombre base y sanitizarlo
        const originalName = path.parse(file.originalname).name;
        let sanitized = originalName.replace(/[^a-z0-9_\-]/gi, '_');
        if (sanitized.length > 100) {
            sanitized = sanitized.slice(0, 100);
        }
        // Obtener la extensión en minúsculas y concatenar con un UUID
        const extension = path.extname(file.originalname).toLowerCase();
        const finalName = `${sanitized}_${uuidv4()}${extension}`;
        cb(null, finalName);
    },
    filenameUpload: (req, file, cb) => {
        // filenameUpload es la url tipo /uploads/pdfs/filename.pdf o /uploads/images/filename.jpg o /uploads/videos/filename.mp4
        const filenameUpload = path.parse(file.originalname).name;
        cb(null, filenameUpload);
    },
});

/**
 * Filtro para permitir solo los tipos de archivos definidos.
 */
const filtrarArchivos = (req, file, cb) => {
    const category = getFileCategory(file);
    if (category) {
        cb(null, true);
    } else {
        cb(new Error('Tipo de archivo no permitido'), false);
    }
};

// Configuración de Multer: límite de 25 MB, storage y filtro
const upload = multer({
    storage: storage,
    limits: { fileSize: 25 * 1024 * 1024 },
    fileFilter: filtrarArchivos,
});

/* ============================
       ENDPOINTS DE UPLOAD
=============================*/

/**
 * Endpoint genérico para subir archivos (PDF, imágenes, videos).
 * Se espera que el formulario envíe el archivo en el campo "file".
 * Si se envía ?replace=true, se reemplazarán los archivos existentes en la carpeta.
 */
app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res
            .status(400)
            .json({ error: 'No se subió ningún archivo o el archivo no es permitido.' });
    }

    // Extraer el nombre de la carpeta por ejemplo (pdfs, images, videos)
    const folderName = path.basename(req.file.destination);
    const urlFile = `/uploads/${folderName}/${req.file.filename}`;
    res.json({
        message: 'Archivo subido exitosamente.',
        file: {
            originalname: req.file.originalname,
            filename: req.file.filename,
            destination: req.file.destination,
            url: urlFile,
            path: req.file.path,
            size: req.file.size,
        },
    });
});

/* ============================
         ENDPOINT DELETE
=============================*/

/**
 * Endpoint para eliminar un archivo PDF a partir de su URL.
 * Se sanitiza el nombre extraído de la URL y se elimina el archivo.
 */
// Endpoint para eliminar un archivo a partir de su URL
app.post('/delete-file', async (req, res) => {
    const {  url_file } = req.body;

    try {
        // Validar que la URL empiece con /uploads/
        if (!url_file || !url_file.startsWith('/uploads/')) {
            return res.status(400).json({ error: 'URL inválida' });
        }

        // Remover posibles parámetros de consulta
        const cleanUrl = url_file.split('?')[0];

        // Ejemplo de URL esperada: /uploads/pdfs/filename.pdf
        const parts = cleanUrl.split('/').filter(Boolean); // elimina elementos vacíos
        // parts debería ser: ['uploads', 'pdfs', 'filename.pdf']
        if (parts.length !== 3) {
            return res.status(400).json({ error: 'URL con formato incorrecto' });
        }

        const [uploadsSegment, folder, filename] = parts;

        // Validar que la carpeta sea una de las permitidas
        const allowedFolders = ['pdfs', 'images', 'videos'];
        if (!allowedFolders.includes(folder)) {
            return res.status(400).json({ error: 'Carpeta no permitida' });
        }

        // Sanitizar el nombre del archivo (similar a la lógica de subida)
        const sanitizedFilename = filename.replace(/[^a-zA-Z0-9\-._]/g, '');
        if (!sanitizedFilename.includes('.') || sanitizedFilename.length < 3) {
            return res.status(400).json({ error: 'Nombre de archivo inválido' });
        }

        // Construir la ruta absoluta al archivo
        const filePath = path.join(__dirname, 'uploads', folder, sanitizedFilename);

        // Intentar eliminar el archivo
        await eliminarArchivo(filePath);

        res.json({ success: true, message: `Archivo eliminado: ${filePath}` });
    } catch (error) {
        console.error('Error al eliminar archivo:', error);
        res.status(500).json({ success: false, message: 'Error al eliminar archivo' });
    }
});


/**
 * Función asíncrona para eliminar un archivo de forma segura.
 */
async function eliminarArchivo(ruta) {
    try {
        // Validación robusta de la ruta
        if (
            !ruta ||
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


/* ============================
       HANDLING 404 Y ERRORES
=============================*/

// Middleware para rutas inexistentes
app.all('*', (req, res, next) => {
    next(new AppError(`No se encontró ${req.originalUrl} en este servidor.`, 404));
});

// Middleware global de manejo de errores
app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message });
});

module.exports = { app, eliminarArchivo };
