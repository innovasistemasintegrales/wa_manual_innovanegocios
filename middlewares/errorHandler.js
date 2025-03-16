// middlewares/errorHandler.js
const AppError = require('../utils/AppError');

/**
 * Middleware para rutas inexistentes
 */
const notFoundHandler = (req, res, next) => {
    next(new AppError(`No se encontró ${req.originalUrl} en este servidor.`, 404));
};

/**
 * Middleware global de manejo de errores
 */
const globalErrorHandler = (err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message });
};

module.exports = {
    notFoundHandler,
    globalErrorHandler
};
