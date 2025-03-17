// middlewares/errorHandler.js
const AppError = require('../utils/AppError');


/**
 * Middleware para rutas inexistentes.
 *
 * Crea un error AppError con código 404 y lo pasa al middleware global de
 * manejo de errores.
 *
 * @param {Object} req - Objeto de solicitud (request) de Express.
 * @param {Object} res - Objeto de respuesta (response) de Express.
 * @param {Function} next - Función next() de Express.
 */
const notFoundHandler = (req, res, next) => {
    next(new AppError(`No se encontró ${req.originalUrl} en este servidor.`, 404));
};


/**
 * Middleware global de manejo de errores
 *
 * Recibe el objeto de error (err) que se produjo en alguna parte de la
 * aplicación y lo maneja de la siguiente forma:
 *
 * 1. Lo imprime en la consola con console.error()
 * 2. Establece el estado de la respuesta (res) con el código de estado del
 *    error, o 500 si no se especifica.
 * 3. Envia una respuesta en formato JSON con un objeto que contiene la
 *    propiedad "error" con el mensaje del error.
 *
 * @param {Object} err - Objeto de error (error) thrown by the application.
 * @param {Object} req - Objeto de solicitud (request) de Express.
 * @param {Object} res - Objeto de respuesta (response) de Express.
 * @param {Function} next - Función next() de Express.
 */
const globalErrorHandler = (err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message });
};

module.exports = {
    notFoundHandler,
    globalErrorHandler
};
