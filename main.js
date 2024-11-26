const app = require('./app.js');
const AppError = require('./utils/AppError.js');
const pool = require('./config/config_mysql.js'); // Conexión a la base de datos    
const { Server } = require('socket.io'); // Websockets
const { callbackPromise } = require('nodemailer/lib/shared/index.js');

const server = app.listen(app.get('port'), () => {
    console.log(`Servidor inicializado en puerto ${app.get('port')}`);
});

const io = new Server(server);

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


// MARK: Administrador
io.of('/administrador').on('connection', (socket) => {
    console.log('Administrador conectado: ', socket.id);
    socket.on('disconnect', () => {
        console.log('Usuario desconectado: ', socket.id);
    });

    socket.on('UltimosIncidentes', async ({ offset = 0, limite = 5 }, callback) => {
        try {
            // Validar parámetros
            if (limite <= 0 || offset < 0) {
                return callback({ success: false, message: 'Parámetros inválidos' });
            }

            // Obtener total de registros
            const totalRegistros = await ejecutarConsulta(
                'SELECT COUNT(*) AS total FROM incidentes'
            );

            if (!totalRegistros || totalRegistros.length === 0) {
                return callback({ success: false, message: 'No se encontraron registros' });
            }

            const total = totalRegistros[0].total;

            // Obtener incidentes con paginación
            const incidentes = await ejecutarConsulta(
                'SELECT * FROM incidentes ORDER BY fecha_creacion DESC LIMIT ? OFFSET ?',
                [limite, offset]
            );

            // Respuesta exitosa
            callback({ success: true, data: incidentes, total });
        } catch (error) {
            console.error('Error al listar últimos incidentes:', error);
            callback({ success: false, message: 'Error al listar últimos incidentes.' });
        }
    });


    // Listar incidentes por tipo de incidente y con paginación
    socket.on('Incidentes', async ({ pagina, limite, estadoIncidente }, callback) => {
        try {
            const offset = (pagina - 1) * limite;
            const total = await ejecutarConsulta('SELECT COUNT(*) AS total FROM incidentes WHERE estado=?', [estadoIncidente]);
            const incidentes = await ejecutarConsulta(
                'SELECT * FROM incidentes WHERE estado=? ORDER BY fecha_creacion DESC LIMIT ? OFFSET ?',
                [estadoIncidente, limite, offset]
            );
            callback({ success: true, data: { incidentes, total: total[0].total } });
        } catch (error) {
            console.error('Error al listar incidentes:', error);
            callback({ success: false, error: 'Hubo un problema al listar incidentes.' });
        }
    });

    // Obtener cantidad de usuarios por rol
    socket.on('CantidadUsuariosPorRol', async (data, callback) => {
        try {
            // Realizamos la consulta para obtener la cantidad de usuarios por rol
            const resultados = await ejecutarConsulta(`
                SELECT 
                    roles.nombre AS rol, 
                    COUNT(personas.dni) AS cantidad
                FROM    
                    personas
                JOIN 
                    roles 
                ON 
                    personas.id_rol = roles.id_rol
                GROUP BY 
                    roles.nombre
            `);
    
            // Enviamos los resultados al cliente
            callback({ success: true, datos: resultados });
        } catch (error) {
            console.error('Error al obtener cantidad de usuarios por rol:', error);
            callback({ success: false, error: 'Hubo un problema al obtener los datos.' });
        }
    });
    

    // Listar usuarios por rol con paginación
    socket.on('Usuarios', async ({ pagina, limite, rolUsuario }, callback) => {
        try {
            const offset = (pagina - 1) * limite;
            const total = await ejecutarConsulta('SELECT COUNT(*) AS total FROM personas JOIN roles ON personas.id_rol = roles.id_rol WHERE nombre=?', [rolUsuario]);
            const usuarios = await ejecutarConsulta(
                'SELECT * FROM personas JOIN roles ON personas.id_rol = roles.id_rol  WHERE nombre=? LIMIT ? OFFSET ?',
                [rolUsuario, limite, offset]
            );
            callback({ success: true, data: { usuarios, total: total[0].total } });
        } catch (error) {
            console.error('Error al listar usuarios:', error);
            callback({ success: false, error: 'Hubo un problema al listar usuarios.' });
        }
    });


    // Registrar usuario
    socket.on('registrarUsuario', async () => {
        try {
            const result = await ejecutarConsulta('INSERT INTO usuarios SET ?', data);
            console.log('Usuario registrado exitosamente');
            socket.emit('registrarUsuarioRespuesta', { success: true, data: result });
        } catch (error) {
            console.error('Error al registrar usuario:', error);
            socket.emit('registrarUsuarioRespuesta', { success: false, error: 'Error al registrar el usuario.' });
        }
    });
});

io.of('/soporte').on('connection', (socket) => {
    console.log('Cliente conectado a /soporte');
});

io.of('/tecnico').on('connection', (socket) => {
    console.log('Cliente conectado a /tecnico');
});

// Cliente
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