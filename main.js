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

    socket.on('/administrador/listadoGeneralUsuarios', async (data, callback) => {
        try {
            const listadoGeneralUsuarios = await ejecutarConsulta(
                'SELECT dni, nombres, apellidos, correo, telefono, direccion, fecha_nacimiento, id_rol, foto_perfil, estado FROM personas ORDER BY nombres ASC'
            );
            callback({ success: true, data: listadoGeneralUsuarios });
        } catch (error) {
            console.error('Error al listar usuarios:', error);
            callback({ success: false, error: 'Hubo un problema al listar usuarios.' });
        }
    });

    socket.on('/administrador/registrarUsuario', async (data, callback) => {
        try {
            const { dni, id_rol, nombres, apellidos, estado, nacimiento, usuario, password, foto_perfil, telefono, direccion, correo } = data;
            await ejecutarConsulta('INSERT INTO personas (dni, id_rol, nombres, apellidos, fecha_nacimiento, usuario, contrasena, foto_perfil, telefono, direccion, correo, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [dni, id_rol, nombres, apellidos, nacimiento, usuario, password, foto_perfil, telefono, direccion, correo, estado]);
            callback({ success: true });
        } catch (error) {
            console.error('Error al registrar usuario:', error);
            callback({ success: false, error: error });
        }
    });

    socket.on('/administrador/eliminarUsuario', async (id, callback) => {
        try {
            await ejecutarConsulta('UPDATE personas SET estado = ? WHERE id = ?', ['Inactivo', id]);
            callback({ success: true });
        } catch (error) {
            console.error('Error al actualizar el estado del usuario:', error);
            callback({ success: false, error: 'Hubo un problema al actualizar el estado del usuario.' });
        }
    });

    socket.on('/administrador/listadoPreguntasFrecuentes', async (callback) => {
        try {
            let totalPreguntasFrecuentes;
            let listadoPreguntasFrecuentes;
            totalPreguntasFrecuentes = await ejecutarConsulta('SELECT COUNT(*) FROM frecuentes');
            listadoPreguntasFrecuentes = await ejecutarConsulta(
                'SELECT * FROM frecuentes',
            );
            const total = parseInt(totalPreguntasFrecuentes[0].count);
            callback({ success: true, data: listadoPreguntasFrecuentes, total });
        } catch (error) {
            console.error('Error al listar preguntas frecuentes:', error);
            callback({ success: false, error: 'Hubo un problema al listar preguntas frecuentes.' })
        }
    });

    // Guardar nueva pregunta frecuente
    socket.on('/administrador/guardarPreguntaFrecuente', async (data, callback) => {
        try {
            const { pregunta, respuesta } = data;

            // Validación de los datos
            if (!pregunta || !respuesta) {
                return callback({
                    success: false,
                    error: "Los campos 'pregunta' y 'respuesta' son obligatorios.",
                });
            }

            // Insertar registro en la DB
            const result = await ejecutarConsulta(
                'INSERT INTO frecuentes (pregunta, respuesta) VALUES (?, ?)',
                [pregunta, respuesta]
            );

            // Obtener el ID generado
            const id_pfrecuente = result.insertId;

            // Notificar a todos los clientes sobre la nueva pregunta frecuente
            io.of('/administrador').emit('/administrador/nuevaPreguntaFrecuente', {
                id_pfrecuente,
                pregunta,
                respuesta,
            });

            // Responder al cliente que realizó la operación
            callback({
                success: true,
                data: { id_pfrecuente },
            });
        } catch (error) {
            console.error('Error al guardar pregunta frecuente:', error);
            callback({
                success: false,
                error: 'Hubo un problema al guardar la pregunta frecuente.',
            });
        }
    });

    // Eliminar pregunta frecuente
    socket.on('/administrador/eliminarPreguntaFrecuente', async (data, callback) => {
        try {
            const { id_pfrecuente, pregunta, respuesta } = data;

            // Validación
            if (!id_pfrecuente) {
                return callback({
                    success: false,
                    error: "El ID de la pregunta frecuente es obligatorio.",
                });
            }

            // Eliminar registro de la DB
            const result = await ejecutarConsulta(
                'DELETE FROM frecuentes WHERE id_pfrecuente = ?',
                [id_pfrecuente]
            );

            // Notificar a todos los clientes sobre la eliminación
            io.of('/administrador').emit('/administrador/eliminacionPreguntaFrecuente', {
                id_pfrecuente: id_pfrecuente,
                pregunta: pregunta,
                respuesta: respuesta,
            });

            // Responder al cliente que realizó la operación
            callback({ success: true });
        } catch (error) {
            console.error('Error al eliminar pregunta frecuente:', error);
            callback({
                success: false,
                error: 'Hubo un problema al eliminar la pregunta frecuente.',
            });
        }
    });

    socket.on('/administrador/editarPreguntaFrecuente', async (data, callback) => {
        try {
            const { id_pfrecuente, pregunta, respuesta } = data;

            // Validar los datos recibidos
            if (!id_pfrecuente || !pregunta || !respuesta) {
                return callback({
                    success: false,
                    error: 'Todos los campos son obligatorios para editar la pregunta frecuente.',
                });
            }

            // Ejecutar la consulta para actualizar la pregunta frecuente
            const resultado = await ejecutarConsulta(
                'UPDATE frecuentes SET pregunta = ?, respuesta = ? WHERE id_pfrecuente = ?',
                [pregunta, respuesta, id_pfrecuente]
            );

            if (resultado.affectedRows === 0) {
                return callback({
                    success: false,
                    error: 'No se encontró una pregunta frecuente con el ID proporcionado.',
                });
            }

            // Notificar a todos los clientes conectados sobre la actualización
            io.of('/administrador').emit('/administrador/edicionPreguntaFrecuente', {
                id_pfrecuente,
                pregunta,
                respuesta,
            });

            // Enviar respuesta al cliente que realizó la solicitud
            callback({ success: true });
        } catch (error) {
            console.error('Error al editar pregunta frecuente:', error);
            callback({
                success: false,
                error: 'Hubo un problema al editar la pregunta frecuente.',
            });
        }
    });

    socket.on('/administrador/listadoIncidentes', async ({ pagina, limite, estado = 'Todos' }, callback) => {
        try {
            let totalIncidentes;
            let listadoIncidentes;

            // Asegurarse de que limite y pagina sean números válidos
            limite = parseInt(limite, 10);
            pagina = parseInt(pagina, 10);

            if (isNaN(limite) || isNaN(pagina)) {
                callback({ success: false, error: 'El límite o la página no son válidos.' });
                return;
            }

            const offset = (pagina - 1) * limite;

            if (estado === 'Todos') {
                totalIncidentes = await ejecutarConsulta('SELECT COUNT(*) AS count FROM incidentes');
                listadoIncidentes = await ejecutarConsulta(
                    'SELECT * FROM incidentes JOIN empresas ON incidentes.ruc_empresa = empresas.ruc ORDER BY incidentes.fecha_creacion DESC LIMIT ? OFFSET ? ',
                    [limite, offset]
                );
            } else {
                totalIncidentes = await ejecutarConsulta('SELECT COUNT(*) AS count FROM incidentes WHERE estado = ?', [estado]);
                listadoIncidentes = await ejecutarConsulta(
                    'SELECT * FROM incidentes JOIN empresas ON incidentes.ruc_empresa = empresas.ruc WHERE estado = ? BY incidentes.fecha_creacion DESC LIMIT ? OFFSET ? ORDER ',
                    [estado, limite, offset]
                );
            }

            const total = parseInt(totalIncidentes[0].count);
            let hayMasIncidentes = listadoIncidentes.length < total;
            callback({ success: true, data: listadoIncidentes, total, hayMasIncidentes, estado });

        } catch (error) {
            console.error('Error al listar incidentes:', error);
            callback({ success: false, error: 'Hubo un problema al listar incidentes.' });
        }
    });

    socket.on('/administrador/crearNuevoIncidente', async (data, callback) => {
        try {
            const { titulo, descripcion_incidente, cliente_dni, ruc_empresa, dni_soporte } = data;

            // Crear el nuevo incidente
            const result = await ejecutarConsulta('INSERT INTO incidentes (titulo, descripcion_incidente, cliente, ruc_empresa, dni_soporte) VALUES (?, ?, ?, ?, ?)', [titulo, descripcion_incidente, cliente_dni, ruc_empresa, dni_soporte]);

            const id_incidente = result.insertId;

            // Obtener los detalles de la empresa
            const empresa = await ejecutarConsulta('SELECT razon_social FROM empresas WHERE ruc = ?', [ruc_empresa]);

            // Obtener la fecha de creación del incidente
            const fecha_creacion = new Date().toISOString(); // la fecha se obtiene de la base de datos

            // Emitir el evento de nuevo incidente a los administradores, tecnicos y soporte menos a los clientes
            io.of('/administrador').emit('/administrador/nuevoIncidente', {
                id_incidente: id_incidente,
                titulo: titulo,
                descripcion_incidente: descripcion_incidente,
                cliente_dni: cliente_dni,
                ruc_empresa: ruc_empresa,
                dni_soporte: dni_soporte,
                estado: 'Pendiente',
                razon_social:  empresa[0].razon_social,
                fecha_creacion: fecha_creacion
            });

            callback({ success: true });

        } catch (error) {
            console.error('Error al crear nuevo incidente:', error);
            callback({ success: false, error: error });
        }
    });

    socket.on('/administrador/listadoValoraciones', async ({ }, callback) => {
        try {
            let totalValoraciones;
            let listadoValoraciones;
            totalValoraciones = await ejecutarConsulta('SELECT COUNT(*) FROM calificacion');
            listadoValoraciones = await ejecutarConsulta(
                'SELECT * FROM calificacion',
            );
            const total = parseInt(totalValoraciones[0].count);
            callback({ success: true, data: listadoValoraciones, total });
        } catch (error) {
            console.error('Error al listar valoraciones:', error);
            callback({ success: false, error: 'Hubo un problema al listar valoraciones.' })
        }
    });
});

io.of('/soporte').on('connection', (socket) => {
    console.log('Usuario Soporte conectado: ', socket.id);
    socket.on('disconnect', () => {
        console.log('Usuario Soporte desconectado: ', socket.id);
    });

    socket.on('/soporte/listadoIncidentes', async ({ pagina, limite, estado = 'Todos' }, callback) => {
        try {
            let totalIncidentes;
            let listadoIncidentes;

            // Asegurarse de que limite y pagina sean números válidos
            limite = parseInt(limite, 10);
            pagina = parseInt(pagina, 10);

            if (isNaN(limite) || isNaN(pagina)) {
                callback({ success: false, error: 'El límite o la página no son válidos.' });
                return;
            }

            const offset = (pagina - 1) * limite;

            if (estado === 'Todos') {
                totalIncidentes = await ejecutarConsulta('SELECT COUNT(*) AS count FROM incidentes');
                listadoIncidentes = await ejecutarConsulta(
                    'SELECT * FROM incidentes JOIN empresas ON incidentes.ruc_empresa = empresas.ruc ORDER BY incidentes.fecha_creacion DESC LIMIT ? OFFSET ? ',
                    [limite, offset]
                );
            } else {
                totalIncidentes = await ejecutarConsulta('SELECT COUNT(*) AS count FROM incidentes WHERE estado = ?', [estado]);
                listadoIncidentes = await ejecutarConsulta(
                    'SELECT * FROM incidentes JOIN empresas ON incidentes.ruc_empresa = empresas.ruc WHERE estado = ? BY incidentes.fecha_creacion DESC LIMIT ? OFFSET ? ORDER ',
                    [estado, limite, offset]
                );
            }

            const total = parseInt(totalIncidentes[0].count);
            let hayMasIncidentes = listadoIncidentes.length < total;
            callback({ success: true, data: listadoIncidentes, total, hayMasIncidentes, estado });

        } catch (error) {
            console.error('Error al listar incidentes:', error);
            callback({ success: false, error: 'Hubo un problema al listar incidentes.' });
        }
    });
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





