const AppError = require('../utils/AppError.js');

const errorMiddleware = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const isOperational = err.isOperational || false;

    if (process.env.NODE_ENV === 'development') {
        console.error('ERROR 💥:', err);
        return res.status(statusCode).json({
            status: 'error',
            message: err.message,
            stack: err.stack,
            isOperational,
        });
    }

    if (isOperational) {
        return res.status(statusCode).json({
            status: 'error',
            message: err.message,
        });
    }

    console.error('ERROR 💥:', err);
    res.status(500).json({
        status: 'error',
        message: 'Error interno del servidor',
    });
};

module.exports = errorMiddleware;