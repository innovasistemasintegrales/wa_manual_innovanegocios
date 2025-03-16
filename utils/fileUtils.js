// utils/fileUtils.js
const fs = require('fs');
const path = require('path');

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

module.exports = {
    eliminarArchivo
};
