const app = require('./app.js');
const AppError = require('./utils/AppError.js');
const pool = require('./config/config_mysql.js'); // Conexión a la base de datos    
const { Server } = require('socket.io'); // Websockets
const { callbackPromise } = require('nodemailer/lib/shared/index.js');
const Joi = require('joi');

const server = app.listen(app.get('port'), () => {
    console.log(`Servidor inicializado en puerto ${app.get('port')}`);
});

const io = new Server(server, {
    connectionStateRecovery: {}
});

server.on('error', (err) => { // Manejo de errores
    if (err.code === 'EADDRINUSE') {
        console.error(`El puerto ${app.get('port')} está en uso. Intenta otro puerto.`);
    } else {
        console.error('Error al iniciar el servidor:', err);
    }
});

// Función genérica para consultas a la base de datos
const ejecutarConsulta = async (query, params = []) => {
    try {
        const [results] = await pool.query(query, params);
        return results;
    } catch (error) {
        console.error('Error al ejecutar la consulta:', error);
        throw error;
    }
};

// Espacios de nombres para cada tipo de usuario
io.of('/index').on('connection', (socket) => {
    console.log('Cliente conectado a /index');
});

io.of('/login').on('connection', (socket) => {
    console.log('Cliente conectado a /login');
});

io.of('/administrador').on('connection', (socket) => {
    console.log('Administrador conectado: ', socket.id);
    socket.on('disconnect', () => {
        console.log('Usuario desconectado: ', socket.id);
    });

    // async () => {
    //     try {
    //         const listadoGeneralUsuario = await ejecutarConsulta('SELECT * FROM personas');
    //         io.of('/administrador').to(socket.id).emit('listadoGeneralUsuarios', listadoGeneralUsuario);
    //     } catch (error) {
    //         console.error('Error al listar usuarios:', error);
    //         io.of('/administrador').to(socket.id).emit('listadoGeneralUsuarios', { error: 'Hubo un problema al listar usuarios.' });
    //     }
    // }

    socket.on('listadoGeneralUsuarios', async (data, callback) => {
        try {
            const listadoGeneralUsuarios = await ejecutarConsulta(
                'SELECT * FROM personas',
            );
            callback({ success: true, data: listadoGeneralUsuarios });
        } catch (error) {
            console.error('Error al listar usuarios:', error);
            callback({ success: false, error: 'Hubo un problema al listar usuarios.' });
        }
    });
});

io.of('/soporte').on('connection', (socket) => {
    console.log('Cliente conectado a /soporte');
});

io.of('/tecnico').on('connection', (socket) => {
    console.log('Cliente conectado a /tecnico');
});

io.of('/cliente').on('connection', (socket) => {
    console.log('Cliente conectado');

    // Listar títulos
    async () => {
        let listadoGeneralTitulos = await ejecutarConsulta('SELECT * from titulos');

        for (let i = 0; i < results.length; i++) {
            listadoGeneralTitulos = results[i];
        }

        io.of('/cliente').to(socket.id).emit('/cliente/listarTitulo', listadoGeneralTitulos)
    }
    /* Editar titulos */

    /* Resgitrar titulos */
})


io.of('/invitado').on('connection', (socket) => {
    console.log('Cliente conectado a /invitado');
});


app.all('*', (req, res, next) => { // Middleware para manejar rutas inexistentes
    next(new AppError(`No se encontró ${req.originalUrl} en este servidor.`, 404));
});





