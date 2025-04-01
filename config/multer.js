// config/multer.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

/**
 * Función para determinar la categoría y carpeta de destino del archivo,
 * según su tipo (PDF, imagen o video).
 */
function getFileCategory(file) {
    const mime = file.mimetype;
    if (mime === 'application/pdf') {
        return { type: 'pdf', folder: path.join(__dirname, '..', 'uploads', 'pdfs') };
    } else if (mime === 'image/jpeg' || mime === 'image/png') {
        return { type: 'image', folder: path.join(__dirname, '..', 'uploads', 'images') };
    } else if (mime === 'video/mp4' || mime === 'video/x-msvideo') {
        return { type: 'video', folder: path.join(__dirname, '..', 'uploads', 'videos') };
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
});

/**
 * Filtro para permitir solo los tipos de archivos definidos y verificar tamaños máximos por tipo.
 */
const filtrarArchivos = (req, file, cb) => {
    const category = getFileCategory(file);
    if (!category) {
        return cb(new Error('Tipo de archivo no permitido'), false);
    }
    
    // Verificar tamaño del archivo según su tipo
    const fileSize = parseInt(req.headers['content-length']);
    
    if (file.mimetype.startsWith('image/')) {
        if (fileSize > 10 * 1024 * 1024) { // 10 MB para imágenes
            return cb(new Error('Las imágenes no deben exceder 10 MB'), false);
        }
    } else if (file.mimetype.startsWith('video/')) {
        if (fileSize > 40 * 1024 * 1024) { // 40 MB para videos
            return cb(new Error('Los videos no deben exceder 40 MB'), false);
        }
    } else if (file.mimetype === 'application/pdf') {
        if (fileSize > 10 * 1024 * 1024) { // 10 MB para PDFs
            return cb(new Error('Los archivos PDF no deben exceder 10 MB'), false);
        }
    }
    
    cb(null, true);
};

// Configuración de Multer con storage y filtro personalizado
const upload = multer({
    storage: storage,
    fileFilter: filtrarArchivos,
    // No establecemos límites globales aquí, ya que los manejamos en el filtro
});

module.exports = {
    upload,
    getFileCategory
};
