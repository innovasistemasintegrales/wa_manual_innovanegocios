// middlewares/fileValidation.js
const path = require('path');

// Define las carpetas permitidas
const allowedFolders = ['images', 'pdfs', 'videos'];

/**
 * Middleware para validar que la carpeta solicitada dentro de /uploads
 * sea una de las permitidas y que la URL no contenga patrones maliciosos.
 */
const validateUploadFolder = (req, res, next) => {
    const { folder } = req.params;
    // Verificar que la carpeta solicitada esté en la lista de permitidas
    if (!allowedFolders.includes(folder) || req.url.includes('..') || req.url.includes('null')) {
        return res.status(400).send('Solicitud inválida');
    }
    next();
};

module.exports = {
    validateUploadFolder,
    allowedFolders
};
