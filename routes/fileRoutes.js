// routes/fileRoutes.js
const express = require('express');
const router = express.Router();
const path = require('path');
const { upload } = require('../config/multer');
const { eliminarArchivo } = require('../utils/fileUtils');

/**
 * Endpoint genérico para subir archivos (PDF, imágenes, videos).
 * Se espera que el formulario o el archivo se envíe en el campo "file".
 * Si se envía ?replace=true, se reemplazarán los archivos existentes en la carpeta.
 */
router.post('/upload', upload.single('file'), (req, res) => {
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

/**
 * Endpoint para subir múltiples archivos (hasta 5) en una sola solicitud.
 * 
 * Utiliza multer para manejar la carga de archivos. 
 * Se espera que los archivos se envíen en el campo "files" del formulario.
 * 
 * Si no se suben archivos o el formato no es permitido, devuelve un error 400.
 * En caso exitoso, devuelve un mensaje y la información de los archivos subidos,
 * incluyendo nombre original, nombre guardado, destino, URL pública, ruta completa y tamaño.
 */
router.post('/upload-multiple', (req, res) => {
    upload.array('files', 5)(req, res, function(err) {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ 
                    error: 'Uno o más archivos exceden el tamaño máximo permitido (25 MB).' 
                });
            }
            return res.status(400).json({ error: 'Error al subir archivos: ' + err.message });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No se subieron archivos o formato no permitido.' });
        }

        // Construir la respuesta con la lista de archivos subidos
        const uploadedFiles = req.files.map(file => {
            const folderName = path.basename(file.destination); // Extraer la carpeta (images/videos)
            return {
                originalname: file.originalname,
                filename: file.filename,
                destination: file.destination,
                url: `/uploads/${folderName}/${file.filename}`,  // URL pública
                path: file.path,
                size: file.size
            };
        });

        res.json({
            message: 'Archivos subidos exitosamente.',
            files: uploadedFiles
        });
    });
});


/**
 * Elimina un archivo a partir de su URL. La URL debe comenzar con /uploads/ y
 * debe tener la siguiente estructura: /uploads/{carpeta}/{nombre_archivo}.{extensión}.
 * Las carpetas permitidas son: pdfs, images, videos.
 * El nombre del archivo debe ser un string que contenga solo caracteres alfanuméricos,
 * guiones, puntos y underscore.
 * Si la URL es inválida, se devuelve un error 400.
 * Si el archivo no existe o no se puede eliminar, se devuelve un error 500.
 * En caso exitoso, se devuelve un mensaje indicando que el archivo fue eliminado.
 */
router.post('/delete-file', async (req, res) => {
    const { url_file } = req.body;

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

        // Sanitizar el nombre del archivo
        const sanitizedFilename = filename.replace(/[^a-zA-Z0-9\-._]/g, '');
        if (!sanitizedFilename.includes('.') || sanitizedFilename.length < 3) {
            return res.status(400).json({ error: 'Nombre de archivo inválido' });
        }

        // Construir la ruta absoluta al archivo
        const filePath = path.join(__dirname, '..', 'uploads', folder, sanitizedFilename);

        // Intentar eliminar el archivo
        await eliminarArchivo(filePath);

        res.json({ success: true, message: `Archivo eliminado: ${filePath}` });
    } catch (error) {
        console.error('Error al eliminar archivo:', error);
        res.status(500).json({ success: false, message: 'Error al eliminar archivo' });
    }
});

/**
 * Servir un archivo desde la carpeta /uploads/{folder}/{filename}
 * @param {string} folder - carpeta dentro de /uploads
 * @param {string} filename - nombre del archivo
 * @returns {Response} - archivo servido o error 400/404
 */
router.get('/uploads/:folder/:filename', (req, res) => {
    const { folder, filename } = req.params;
    
    // Validar que la carpeta es permitida
    if (!allowedFolders.includes(folder)) {
        return res.status(400).send('Carpeta no permitida');
    }

    // Construir la ruta absoluta del archivo
    const filePath = path.join(__dirname, '..', 'uploads', folder, filename);

    // Verificar si el archivo existe antes de enviarlo
    if (!fs.existsSync(filePath)) {
        return res.status(404).send('Archivo no encontrado');
    }

    res.sendFile(filePath);
});


module.exports = router;
