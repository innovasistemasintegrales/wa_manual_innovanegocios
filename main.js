// main.js

const { app, eliminarArchivo } = require('./app.js');
const path = require('path');
const fs = require('fs');
const AppError = require('./utils/AppError.js');
const { Server } = require('socket.io'); // Websockets
const jwt = require('jsonwebtoken');
// const { callbackPromise } = require('nodemailer/lib/shared/index.js');
const Joi = require('joi');
const { hashPassword, comparePassword } = require('./utils/hash.js');

const ejecutarConsulta = require('./utils/consultasDB.js');

/* ======================================
        INICIAR SERVER Y SOCKETS
=======================================*/
const server = app.listen(app.get('port'), () => {
    console.log(`Servidor inicializado en puerto ${app.get('port')}`);
});

// Inicio de websockets
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

// Middleware para verificar tokens de sesión en los sockets
const verificarTokenSocket = (socket, next) => {

    // Obtener el token del cliente innovanegocios
    const tokenCliente = socket.handshake.headers.cookie
        ?.split('; ')
        .find(row => row.startsWith('jwtCliente='))
        ?.split('=')[1];

    // Obtener el token 
    const token = socket.handshake.headers.cookie
        ?.split('; ')
        .find(row => row.startsWith('jwt='))
        ?.split('=')[1];

    if (!token && !tokenCliente) {
        return next(new Error('Token inválido o expirado.'));
    }

    if (token) {
        try {
            const payload = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = payload; // Adjunta los datos del usuario al socket
            next();
        } catch (err) {
            console.error('Error al verificar el token:', err.message);
            next(new Error('Token inválido o expirado.'));
        }
    }

    if (tokenCliente) {
        try {
            const payloadCliente = jwt.verify(tokenCliente, process.env.CLIENTE_JWT_SECRET);
            socket.user = payloadCliente; // Adjunta los datos del cliente al socket
            next();
        } catch (err) {
            console.error('Error al verificar el token:', err.message);
            next(new Error('Token inválido o expirado.'));
        }
    }
};

// PROBANDO SOCKET GENERALES
io.on('connection', (socket) => {


});

// Espacios de nombres para cada tipo de usuario
io.of('/index').on('connection', (socket) => {
    console.log('Cliente conectado a /index');
});

io.of('/login').on('connection', (socket) => {
    console.log('Usuario conectado a /login', socket.id);
    socket.on('disconnect', () => {
        console.log('Usuario desconectado de /login: ', socket.id);
    })

    socket.on('/login/verificarDNI', async (data, callback) => {
        try {
            const { dni } = data;

            // Validar que los datos obligatorios estén presentes
            if (!dni) {
                return callback({ success: false, error: 'Datos incompletos o inválidos' });
            }

            // Validar que el teléfono tenga 9 dígitos (además de la validación del frontend)
            if (dni.length !== 8) {
                return callback({ success: false, error: 'El DNI debe tener 8 dígitos' });
            }

            const usuario = await ejecutarConsulta("SELECT * FROM invitado WHERE dni = ?", [dni]);

            if (usuario.length === 0) {
                return callback({ success: false, error: 'El DNI no está registrado' });
            }

            return callback({ success: true });
        } catch (error) {
            console.log(error);
            return callback({ success: false, error: 'Error al validar DNI' });
        }
    });

    socket.on('/login/registrarInvitado', async (data, callback) => {
        try {
            const { dni, nombres, telefono } = data;

            // Validar que los datos obligatorios estén presentes
            if (!dni || !nombres || !telefono) {
                return callback({ success: false, error: 'Datos incompletos o inválidos' });
            }

            // Validar que el teléfono tenga 9 dígitos (además de la validación del frontend)
            if (telefono.length !== 9) {
                return callback({ success: false, error: 'El número de teléfono debe tener 9 dígitos' });
            }

            // Se define el rol asignado al invitado.
            // Nota: Asegúrate de que el id_rol asignado corresponda a un rol válido en tu tabla "roles".
            // Por ejemplo, si el rol "invitado" en tu sistema es el de id 2, se asigna de esta forma:
            const id_rol = 4;

            // Insertar el invitado en la tabla "invitado"
            await ejecutarConsulta(
                'INSERT INTO invitado (dni, nombre, telefono, id_rol) VALUES (?, ?, ?, ?)',
                [dni, nombres, telefono, id_rol]
            );

            // Construir el objeto del nuevo invitado (con la propiedad "nombre" en singular, de acuerdo a la tabla)
            const nuevoInvitado = {
                dni,
                nombre: nombres,
                telefono,
                id_rol
            };

            // Notificar a los administradores que se ha registrado un nuevo invitado
            io.of('/administrador').emit('/administrador/nuevoInvitado', nuevoInvitado);

            return callback({ success: true });
        } catch (error) {
            console.error('Error al registrar invitado:', error);
            return callback({
                success: false,
                error: "Ha ocurrido un error interno en el servidor al registrar al invitado."
            });
        }
    });

});

io.of('/administrador').use(verificarTokenSocket).on('connection', (socket) => {
    if (socket.user.id_rol !== 1) {
        console.log('Acceso denegado al socket de Administrador: Rol no autorizado.');
        return socket.disconnect(true);
    }

    if (socket.user.usuario) {
        console.log(`ADMINISTRADOR autenticado y conectado: ${socket.user.usuario}`);
    }

    // Conectar a los administradores a la sala 'admin' para recibir todas las notificaciones correspondientes
    socket.join('admin');

    socket.on('disconnect', () => {
        console.log(`Administrador desconectado:  ${socket.user.usuario}`);
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

    //? USUARIOS

    socket.on('/administrador/listadoGeneralUsuarios', async (data, callback) => {
        try {
            const listadoGeneralUsuarios = await ejecutarConsulta(
                'SELECT dni, nombres, apellidos, correo, telefono, direccion, fecha_nacimiento, id_rol, foto_perfil, estado FROM personas ORDER BY nombres ASC'
            );
            return callback({ success: true, data: listadoGeneralUsuarios });
        } catch (error) {
            console.error('Error al listar usuarios:', error);
            return callback({ success: false, error: 'Hubo un problema al listar usuarios.' });
        }
    });

    socket.on('/administrador/registrarUsuario', async (data, callback) => {
        try {
            const { dni, id_rol, nombres, apellidos, estado, fecha_nacimiento, usuario, password, foto_perfil, telefono, direccion, correo } = data;

            // Validación de campos obligatorios
            if (![dni, id_rol, nombres, apellidos, usuario, password, telefono, direccion, correo].every(Boolean)) {
                return callback({ success: false, error: 'Todos los campos obligatorios deben ser proporcionados.' });
            }

            // Validar que el rol no sea cliente (id_rol === 4)
            if (id_rol === 4) {
                return callback({ success: false, error: 'No se puede registrar un usuario de tipo cliente.' });
            }

            // 🔍 Verificar si el DNI ya existe
            const usuarioExistente = await ejecutarConsulta('SELECT dni FROM personas WHERE dni = ?', [dni]);
            if (usuarioExistente.length > 0) {
                return callback({ success: false, error: `El usuario con DNI ${dni} ya está registrado.` });
            }

            // Hashear la contraseña
            const passwordHash = await hashPassword(password);

            // Insertar el nuevo usuario
            await ejecutarConsulta(`
                INSERT INTO personas (dni, id_rol, nombres, apellidos, fecha_nacimiento, usuario, contrasena, foto_perfil, telefono, direccion, correo, estado)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [dni, id_rol, nombres, apellidos, fecha_nacimiento, usuario, passwordHash, foto_perfil || null, telefono, direccion, correo, estado || 'Activo']
            );

            // Usuario registrado exitosamente
            const nuevoUsuario = { dni, id_rol, nombres, apellidos, estado: estado || 'Activo', fecha_nacimiento, foto_perfil, telefono, direccion, correo };

            // Emitir el nuevo usuario a los administradores
            io.of('/administrador').emit('/administrador/nuevoUsuario', nuevoUsuario);

            return callback({ success: true, message: 'Usuario registrado correctamente.' });

        } catch (error) {
            // Manejo de errores específicos y generales
            if (error.code === 'ER_DUP_ENTRY') {
                console.warn(`⚠️ Error: El DNI ${data.dni} ya existe.`);
                return callback({ success: false, error: `El usuario con DNI ${data.dni} ya está registrado.` });
            }

            console.error('❌ Error inesperado al registrar usuario:', error);
            return callback({ success: false, error: 'Ha ocurrido un error interno en el servidor al registrar al usuario.' });
        }
    });


    socket.on('/administrador/inactivarUsuario', async (data, callback) => {
        try {

            const { dni, nombres, apellidos } = data;

            await ejecutarConsulta('UPDATE personas SET estado = ? WHERE dni = ?', ['Inactivo', dni]);

            // Notificar al administador emitiendo un socket
            socket.emit('/administrador/inactivacionUsuario', { dni, nombres, apellidos, estado: 'Inactivo' });

            return callback({ success: true });
        } catch (error) {
            console.error('Error al actualizar el estado del usuario:', error);
            return callback({ success: false, error: 'Hubo un problema al actualizar el estado del usuario.' });
        }
    });


    //? PREGUNTAS FRECUENTES

    socket.on('/administrador/listadoPreguntasFrecuentes', async (callback) => {
        try {
            let totalPreguntasFrecuentes;
            let listadoPreguntasFrecuentes;
            totalPreguntasFrecuentes = await ejecutarConsulta('SELECT COUNT(*) FROM frecuentes');
            listadoPreguntasFrecuentes = await ejecutarConsulta(
                'SELECT * FROM frecuentes',
            );
            const total = parseInt(totalPreguntasFrecuentes[0].count);
            return callback({ success: true, data: listadoPreguntasFrecuentes, total });
        } catch (error) {
            console.error('Error al listar preguntas frecuentes:', error);
            return callback({ success: false, error: 'Hubo un problema al listar preguntas frecuentes.' })
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
            return callback({
                success: true,
                data: { id_pfrecuente },
            });
        } catch (error) {
            console.error('Error al guardar pregunta frecuente:', error);
            return callback({
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
            return callback({ success: true });
        } catch (error) {
            console.error('Error al eliminar pregunta frecuente:', error);
            return callback({
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
            return callback({ success: true });
        } catch (error) {
            console.error('Error al editar pregunta frecuente:', error);
            return callback({
                success: false,
                error: 'Hubo un problema al editar la pregunta frecuente.',
            });
        }
    });


    //? MANUAL DE USUARIO

    socket.on('/administrador/listadoManuales', async (callback) => {
        try {
            // Obtener el total de manuales (la tabla "menu" representa los manuales)
            const totalManualesResult = await ejecutarConsulta('SELECT COUNT(*) AS count FROM menu');
            const total = parseInt(totalManualesResult[0].count);

            // Consulta para obtener los manuales junto con información multimedia (si la hay)
            const listadoManualesResult = await ejecutarConsulta(`
                    SELECT 
                        me.id_menu,
                        me.titulo,
                        me.eventos,
                        ma.id_manual,
                        ma.subtitulo,
                        ma.introduccion,
                        ma.guia,
                        m.link_video,
                        m.link_pdf,
                        m.id_multimedia
                    FROM 
                        menu me
                    LEFT JOIN 
                        manual ma ON me.id_menu = ma.id_menu
                    LEFT JOIN
                        multimedia m ON ma.id_manual = m.id_manual
                `);

            // Agrupar los resultados por manual (id_menu)
            const manualsMap = {};
            listadoManualesResult.forEach(row => {
                // Desestructuramos las columnas con los nuevos nombres
                const {
                    id_menu,
                    titulo,
                    eventos,
                    id_manual,
                    subtitulo,
                    introduccion,
                    guia,
                    link_video,
                    link_pdf,
                    id_multimedia
                } = row;

                // Si aún no se ha agregado el manual, se inicializa en el mapa
                if (!manualsMap[id_menu]) {
                    manualsMap[id_menu] = {
                        id_menu,
                        titulo,
                        eventos,
                        manuales: []
                    };
                }

                // Si existe un contenido (manual) para este manual, se agrega al array "manuales"
                if (id_manual) {
                    manualsMap[id_menu].manuales.push({
                        id_manual,
                        subtitulo,
                        introduccion,
                        guia,
                        link_video: link_video || null,
                        link_pdf: link_pdf || null,
                        id_multimedia
                    });
                }
            });

            // Convertir el mapa a un arreglo
            const listadoManualesAgrupado = Object.values(manualsMap);

            // Devolver los datos agrupados
            return callback({ success: true, data: listadoManualesAgrupado, total });
        } catch (error) {
            console.error('Error al listar manuales:', error);
            return callback({ success: false, error: 'Hubo un problema al listar el manual.' });
        }
    });

    socket.on('/administrador/guardarNuevoTituloManual', async (data, callback) => {
        try {
            const { titulo } = data;

            // Validate the data
            if (!titulo) {
                return callback({
                    success: false,
                    error: "El campo 'titulo' es obligatorio.",
                });
            }

            // Insert the new title into the database
            const result = await ejecutarConsulta(
                'INSERT INTO menu (titulo) VALUES (?)',
                [titulo]
            );

            // Get the generated ID
            const id_menu = result.insertId;

            // Notify all clients about the new title
            io.of('/administrador').emit('/administrador/nuevoTituloManual', {
                id_menu,
                titulo,
            });

            // Respond to the client that performed the operation
            return callback({
                success: true,
                data: { id_menu },
            });
        } catch (error) {
            console.error('Error al guardar título:', error);
            return callback({
                success: false,
                error: 'Hubo un problema al guardar el título.',
            });
        }
    });
    socket.on('/administrador/editarTitulo', async (data, callback) => {
        try {
            const { id_menu, nuevoTitulo } = data;

            // Validación de los datos
            if (!id_menu || !nuevoTitulo) {
                return callback({
                    success: false,
                    error: "El ID del manual y el nuevo título son obligatorios.",
                });
            }

            await ejecutarConsulta(
                'UPDATE menu SET titulo = ? WHERE id_menu = ?',
                [nuevoTitulo, id_menu]
            );

            io.of('/administrador').emit('/administrador/edicionTituloManual', {
                id_menu,
                titulo: nuevoTitulo,
            });

            return callback({ success: true });
        } catch (error) {
            console.error('Error al editar manual:', error);
            return callback({ success: false, error: 'Hubo un problema al editar el manual.' });
        }
    });
    socket.on('/administrador/eliminarTituloManual', async (data, callback) => {
        try {
            // Renombramos id_manual a id_menu para adecuarlo a la nueva estructura.
            const { id_menu, titulo } = data;

            if (!id_menu || !titulo) {
                return callback({
                    success: false,
                    error: "El ID y el título del manual son obligatorios.",
                });
            }

            // 1. Obtener IDs de multimedia asociados al manual.
            // Se buscan los registros de multimedia cuyo id_manual pertenezca a algún manual del menú (manual)
            const listaMultimedia = await ejecutarConsulta(
                `SELECT id_multimedia 
                    FROM multimedia 
                    WHERE id_manual IN (
                        SELECT id_manual FROM manual WHERE id_menu = ?
                    )`,
                [id_menu]
            );

            const multimediaIds = listaMultimedia.map(m => m.id_multimedia);

            // 2. Si existen registros de multimedia, eliminar archivos físicos y sus registros
            if (multimediaIds.length > 0) {
                // Obtener rutas de archivos (link_pdf, link_imagen, link_video) de los registros de multimedia
                const multimediaRecords = await ejecutarConsulta(
                    'SELECT link_pdf, link_imagen, link_video FROM multimedia WHERE id_multimedia IN (?)',
                    [multimediaIds]
                );

                // Eliminar archivos físicos
                for (const record of multimediaRecords) {
                    try {
                        if (record.link_pdf) {
                            await eliminarArchivo(path.join(__dirname, record.link_pdf));
                        }
                        if (record.link_imagen) {
                            await eliminarArchivo(path.join(__dirname, record.link_imagen));
                        }
                        if (record.link_video) {
                            await eliminarArchivo(path.join(__dirname, record.link_video));
                        }
                    } catch (error) {
                        console.error('Error procesando multimedia:', error);
                    }
                }

                // Eliminar registros de multimedia
                await ejecutarConsulta(
                    'DELETE FROM multimedia WHERE id_multimedia IN (?)',
                    [multimediaIds]
                );
            }

            // 3. Eliminar los manualres (manuales) asociados al manual
            await ejecutarConsulta(
                'DELETE FROM manual WHERE id_menu = ?',
                [id_menu]
            );

            // 4. Finalmente, eliminar el manual de la tabla menu
            await ejecutarConsulta(
                'DELETE FROM menu WHERE id_menu = ?',
                [id_menu]
            );

            // Notificar a los clientes de la eliminación
            io.of('/administrador').emit('/administrador/eliminacionTituloManual', {
                id_menu,
                titulo,
            });

            return callback({ success: true });
        } catch (error) {
            console.error('Error al eliminar título:', error);
            return callback({
                success: false,
                error: 'Hubo un problema al eliminar el título.',
            });
        }
    });

    socket.on('/administrador/agregarSubtituloManual', async (data, callback) => {
        try {

            const { id_menu, subtitulo } = data;

            // Validate the data
            if (!id_menu || !subtitulo) {
                return callback({
                    success: false,
                    error: "El ID del manual y el subtítulo son obligatorios.",
                });
            }

            // Insert the new subtitle into the database
            const result = await ejecutarConsulta(
                'INSERT INTO manual (id_menu, subtitulo) VALUES (?, ?)',
                [id_menu, subtitulo]
            );

            // Get the generated ID
            const id_manual = result.insertId;

            // Notify all clients about the new subtitle
            io.of('/administrador').emit('/administrador/nuevoSubtituloManual', {
                id_menu,
                id_manual,
                subtitulo,
            });

            // Respond to the client that performed the operation
            return callback({
                success: true,
                data: { id_manual, subtitulo },
            });
        } catch (error) {
            console.error('Error al guardar subtítulo:', error);
            return callback({
                success: false,
                error: 'Hubo un problema al guardar el subtítulo.',
            });
        }
    });

    socket.on('/administrador/editarContenidoManual', async (data, callback) => {
        try {
            // Se asume que para editar el manual se envía el id_manual (de la tabla manual)
            // junto con el nuevo subtítulo, introducción y opcionalmente los enlaces multimedia.
            let { id_manual, subtitulo, introduccion, link_video, link_pdf, id_multimedia } = data;

            console.log('Datos para editar el manual:', data);

            // Validar que se haya enviado el id_manual y el subtítulo
            if (!id_manual || !subtitulo) {
                return callback({
                    success: false,
                    error: "El ID del manual y el subtítulo son obligatorios.",
                });
            }

            // 1. Intentar obtener el registro de multimedia existente (si se envía id_multimedia)
            let existingMultimedia = null;
            if (id_multimedia) {
                const multimediaRecords = await ejecutarConsulta(
                    'SELECT * FROM multimedia WHERE id_manual = ?',
                    [id_manual]
                );
                if (multimediaRecords.length > 0) {
                    existingMultimedia = multimediaRecords[0];
                }
            }

            console.log(`Link Video: ${link_video} - Link PDF: ${link_pdf} - Existe multimedia: ${existingMultimedia !== null}`);

            // 2. Si ya existe un registro multimedia, actualizarlo
            if (existingMultimedia) {
                const updateQuery = 'UPDATE multimedia SET link_video = ?, link_pdf = ? WHERE id_manual = ?';
                await ejecutarConsulta(updateQuery, [link_video, link_pdf, id_manual]);

            }

            // 3. Si no existe registro multimedia y se han enviado links, crear uno nuevo.
            // Aquí se inserta un nuevo registro en multimedia asignándole el id_manual y dejando id_incidente en NULL.
            if ((link_video !== null || link_pdf !== null) && !existingMultimedia) {

                // id_incidente es NULL ya que el archivo pertenece a un manual
                const result = await ejecutarConsulta('INSERT INTO multimedia (link_video, link_pdf, id_incidente, id_manual) VALUES (?, ?, ?, ?)', [link_video, link_pdf, null, id_manual]);
                id_multimedia = result.insertId;

                console.log(`Nuevo id_multimedia creado: ${id_multimedia}`);
            }

            // 4. Actualizar el registro del manual en la tabla manual
            // Se actualizan el subtítulo y la introducción, y si se gestionó multimedia, también se actualiza el campo id_multimedia.
            await ejecutarConsulta('UPDATE manual SET subtitulo = ?, introduccion = ? WHERE id_manual = ?', [subtitulo, introduccion, id_manual]);

            // 5. Notificar a los clientes sobre la actualización
            io.of('/administrador').emit('/administrador/edicionContenidoManual', {
                id_manual,
                subtitulo,
                introduccion,
                id_multimedia: id_multimedia || null,
                link_pdf: link_pdf || null,
                link_video: link_video || null,
            });

            return callback({ success: true });
        } catch (error) {
            console.error('Error al editar el manual:', error);
            return callback({
                success: false,
                error: 'Hubo un problema al editar el manual.',
            });
        }
    });
    socket.on('/administrador/eliminarSubtituloManual', async (data, callback) => {
        try {
            const { id_manual, subtitulo, id_multimedia } = data;

            // Validate the data
            if (!id_manual || !subtitulo) {
                return callback({
                    success: false,
                    error: "El ID del contenido y el subtítulo son obligatorios.",
                });
            }

            if (id_multimedia) {

                // Si hay multimedia, eliminar archivos físicos y registros
                const multimediaRecords = await ejecutarConsulta(
                    'SELECT link_pdf, link_imagen, link_video FROM Multimedia WHERE id_manual = ?',
                    [id_manual]
                );

                // Eliminar archivos
                for (const record of multimediaRecords) {
                    try {
                        await eliminarArchivo(path.join(__dirname, record.link_pdf));
                        // await eliminarArchivo(path.join(__dirname, record.link_imagen));
                        // await eliminarArchivo(path.join(__dirname, record.link_video));
                    } catch (error) {
                        console.error('Error procesando multimedia:', error);
                    }
                }

                // Eliminar la multimedia asociada
                await ejecutarConsulta('DELETE FROM multimedia WHERE id_manual = ?', [id_manual]);
            }

            // Delete the content from the database
            await ejecutarConsulta(
                'DELETE FROM manual WHERE id_manual = ?',
                [id_manual]
            );

            // Notify all clients about the deletion
            console.log(data);
            io.of('/administrador').emit('/administrador/eliminarSubtituloManual', {
                id_manual,
                subtitulo
            });

            // Respond to the client that performed the operation
            return callback({ success: true });
        } catch (error) {
            console.error('Error al eliminar subtítulo:', error);
            return callback({
                success: false,
                error: 'Hubo un problema al eliminar el subtítulo.',
            });
        }
    });

    // ? CONFIGURACIÓN

    socket.on('/administrador/miInfoUsuario', async (callback) => {
        try {
            const dni = socket.user.dni;

            const usuario = await ejecutarConsulta(`
                    SELECT  dni, nombres, apellidos, fecha_nacimiento, usuario, foto_perfil, telefono, direccion, correo, estado
                    FROM personas 
                    WHERE dni = ?`, [dni]);
            console.log(`DNI: ${dni} infoUSuario: ${usuario}`);

            return callback({ success: true, data: usuario[0] });

        } catch (error) {
            console.error('Error al obtener información del usuario:', error);
            return callback({ success: false, error: 'Hubo un problema al obtener la información del usuario.' });
        }
    });

    //? INCIDENTES

    socket.on('/administrador/listadoIncidentes', async ({ pagina, limite, estado = 'Todos' }, callback) => {
        try {
            // ✅ Validar autenticación del usuario
            if (!socket.user || !socket.user.dni) {
                return callback({ success: false, error: 'No estás autenticado.' });
            }

            // ✅ Convertir parámetros
            limite = parseInt(limite, 10);
            pagina = parseInt(pagina, 10);
            if (isNaN(limite) || isNaN(pagina)) {
                return callback({ success: false, error: 'El límite o la página no son válidos.' });
            }

            const offset = (pagina - 1) * limite;

            // ✅ Consultar el total de incidentes asignados al soporte
            const totalIncidentes = await ejecutarConsulta(
                `SELECT COUNT(*) AS count 
                FROM personas_incidentes 
                WHERE id_persona = ?`,
                [socket.user.dni]
            );

            // ✅ Obtener incidentes asignados al soporte, con info del técnico si existe
            const listadoIncidentes = await ejecutarConsulta(
                `
                SELECT 
                    i.id_incidente, 
                    i.titulo, 
                    i.descripcion_incidente, 
                    i.ruc_empresa,
                    i.fecha_creacion,
                    i.fecha_resolucion,
                    i.fecha_asignacion,
                    i.fecha_cierre,
                    i.estado,
                    i.respuesta_soporte,  
                    i.comentarios_soporte,  
                    i.respuesta_tecnico,  

                    -- Datos del soporte (actual usuario)
                    p.dni AS soporte_dni,
                    p.nombres AS soporte_nombres,
                    p.apellidos AS soporte_apellidos,
                    p.telefono AS soporte_telefono,
                    p.correo AS soporte_correo,
                    p.foto_perfil AS soporte_foto,

                    -- Lista de técnicos asignados (si hay)
                    COALESCE((
                        SELECT CONCAT('[', GROUP_CONCAT(
                            JSON_OBJECT(
                                'dni', t.dni,
                                'nombres', t.nombres,
                                'apellidos', t.apellidos,
                                'telefono', t.telefono,
                                'correo', t.correo,
                                'foto', t.foto_perfil
                            )
                        ), ']') 
                        FROM personas_incidentes pi_tec
                        JOIN personas t ON pi_tec.id_persona = t.dni AND t.id_rol = 3 -- Filtrar técnicos
                        WHERE pi_tec.id_incidente = i.id_incidente
                    ), '[]') AS tecnico_asignado

                FROM personas_incidentes pi
                JOIN incidentes i ON pi.id_incidente = i.id_incidente
                JOIN personas p ON pi.id_persona = p.dni AND p.id_rol = 2  -- Filtrar solo roles de soporte

                ${estado !== 'Todos' ? 'AND i.estado = ?' : ''}

                GROUP BY i.id_incidente
                ORDER BY i.fecha_creacion DESC
                LIMIT ? OFFSET ?

                `,
                estado !== 'Todos'
                    ? [estado, limite, offset]
                    : [limite, offset]
            );

            const total = parseInt(totalIncidentes[0].count);
            let hayMasIncidentes = listadoIncidentes.length < total;

            // ✅ Convertir tecnico_asignado de string a JSON Array
            const incidentesProcesados = listadoIncidentes.map(incidente => ({
                ...incidente,
                tecnico_asignado: JSON.parse(incidente.tecnico_asignado || '[]') // Convertir a array o vacío
            }));

            // ✅ Enviar datos al frontend
            return callback({ success: true, data: incidentesProcesados, total, hayMasIncidentes, estado });

        } catch (error) {
            console.error('Error al listar incidentes:', error);
            return callback({ success: false, error: 'Hubo un problema al listar incidentes.' });
        }
    });

    socket.on('/administrador/crearNuevoIncidente', async (nuevoIncidente, callback) => {
        try {
            const { titulo, descripcion_incidente, links_imagenes, links_videos, links_pdfs, id_asesor } = nuevoIncidente;

            // Validar los datos del nuevo incidente
            if (!titulo || !descripcion_incidente || !id_asesor) {
                return callback({ success: false, error: 'El título, la descripción del incidente y el ID del asesor son obligatorios para crear un nuevo incidente.' });
            }

            // Obtener la fecha de creación del incidente
            const fecha_creacion = new Date().toISOString(); // la fecha se obtiene de la base de datos

            // Cómo el usuario que crea el incidente es el administrador del sistema (por lo que no tiene ruc_empresa)
            let ruc_empresa = 'Innova';

            // Crear el nuevo incidente
            const insertIncidente = await ejecutarConsulta('INSERT INTO incidentes (titulo, descripcion_incidente, fecha_creacion, ruc_empresa) VALUES (?, ?, ?, ?)', [titulo, descripcion_incidente, fecha_creacion, ruc_empresa]);

            const id_incidente = insertIncidente.insertId;

            // Crear el registro Personas-Incidentes
            const insertPersonasIncidentes = await ejecutarConsulta('INSERT INTO personas_incidentes (id_incidente, id_persona) VALUES (?, ?)', [id_incidente, id_asesor]);

            // Crear los registros Multimedia si se envió alguno o varios
            // Insertar registros en "multimedia" para cada tipo de archivo, utilizando 0 en id_manual (ya que no aplica)
            if (links_imagenes && links_imagenes.length > 0) {
                for (const link_imagen of links_imagenes) {
                    await ejecutarConsulta(
                        "INSERT INTO multimedia (link_imagen, id_incidente, id_manual) VALUES (?, ?, ?)",
                        [link_imagen, id_incidente]
                    );
                }
            }
            if (links_videos && links_videos.length > 0) {
                for (const link_video of links_videos) {
                    await ejecutarConsulta(
                        "INSERT INTO multimedia (link_video, id_incidente, id_manual) VALUES (?, ?, ?)",
                        [link_video, id_incidente]
                    );
                }
            }
            if (links_pdfs && links_pdfs.length > 0) {
                for (const link_pdf of links_pdfs) {
                    await ejecutarConsulta(
                        "INSERT INTO multimedia (link_pdf, id_incidente, id_manual) VALUES (?, ?, ?)",
                        [link_pdf, id_incidente]
                    );
                }
            }


            let dataIncidente = {
                id_incidente: id_incidente,
                id_persona_incidente: insertPersonasIncidentes.insertId,
                titulo: titulo,
                descripcion_incidente: descripcion_incidente,
                estado: 'Pendiente',
                fecha_creacion: fecha_creacion,
                ruc_empresa: ruc_empresa,
                // Multimedias
                links_imagenes: links_imagenes,
                links_videos: links_videos,
                links_pdfs: links_pdfs,
            };

            // Emitir el evento de nuevo incidente a los administradores, tecnicos y soporte menos a los clientes
            io.of('/soporte').to(`soporte_${id_asesor}`).emit('/soporte/nuevoIncidente', dataIncidente);
            io.of('/administrador').to(`admin`).emit('/administrador/nuevoIncidente', dataIncidente);
            return;

        } catch (error) {
            console.error('Error al crear nuevo incidente:', error);
            return callback({ success: false, error: error });
        }
    });

    //? VALORAICONES

    socket.on('/administrador/listadoValoraciones', async ({ }, callback) => {
        try {
            let totalValoraciones;
            let listadoValoraciones;
            totalValoraciones = await ejecutarConsulta('SELECT COUNT(*) FROM calificacion');
            listadoValoraciones = await ejecutarConsulta(
                'SELECT * FROM calificacion',
            );
            const total = parseInt(totalValoraciones[0].count);
            return callback({ success: true, data: listadoValoraciones, total });
        } catch (error) {
            console.error('Error al listar valoraciones:', error);
            return callback({ success: false, error: 'Hubo un problema al listar valoraciones.' })
        }
    });
});

io.of('/soporte').use(verificarTokenSocket).on('connection', (socket) => {
    if (socket.user.id_rol !== 2) {
        console.log('Acceso denegado al Socket de Soporte: Rol no autorizado.');

        return socket.disconnect(true);
    }
    if (socket.user.usuario) {
        console.log(`Usuario de Soporte autenticado y conectado: ${socket.user.usuario}`);
    }

    // Agregar al asesor a su propia sala para que pueda recibir los incidentes de sus clientes
    socket.join(`soporte_${socket.user.dni}`);

    socket.on('disconnect', () => {
        console.log(`Usuario de Soporte desconectado: ${socket.user.usuario}`);
    });

    //? SOCKETS PARA LOS INCIDENTES
    socket.on('/soporte/listadoIncidentes', async ({ pagina, limite, estado = 'Todos' }, callback) => {
        try {
            // ✅ Validar autenticación del usuario
            if (!socket.user || !socket.user.dni) {
                return callback({ success: false, error: 'No estás autenticado.' });
            }

            // ✅ Convertir parámetros
            limite = parseInt(limite, 10);
            pagina = parseInt(pagina, 10);
            if (isNaN(limite) || isNaN(pagina)) {
                return callback({ success: false, error: 'El límite o la página no son válidos.' });
            }

            const offset = (pagina - 1) * limite;

            // ✅ Consultar el total de incidentes asignados al soporte
            const totalIncidentes = await ejecutarConsulta(
                `SELECT COUNT(*) AS count 
                FROM personas_incidentes 
                WHERE id_persona = ?`,
                [socket.user.dni]
            );

            // ✅ Obtener incidentes asignados al soporte, con info del técnico si existe
            const listadoIncidentes = await ejecutarConsulta(
                `
                SELECT 
                    i.id_incidente, 
                    i.titulo, 
                    i.descripcion_incidente, 
                    i.ruc_empresa,
                    i.fecha_creacion,
                    i.fecha_resolucion,
                    i.fecha_asignacion,
                    i.fecha_cierre,
                    i.estado,
                    i.respuesta_soporte,  
                    i.comentarios_soporte,  
                    i.respuesta_tecnico,  

                    -- Datos del soporte (actual usuario)
                    p.dni AS soporte_dni,
                    p.nombres AS soporte_nombres,
                    p.apellidos AS soporte_apellidos,
                    p.telefono AS soporte_telefono,
                    p.correo AS soporte_correo,
                    p.foto_perfil AS soporte_foto,

                    -- Lista de técnicos asignados (si hay)
                    COALESCE((
                        SELECT CONCAT('[', GROUP_CONCAT(
                            JSON_OBJECT(
                                'dni', t.dni,
                                'nombres', t.nombres,
                                'apellidos', t.apellidos,
                                'telefono', t.telefono,
                                'correo', t.correo,
                                'foto', t.foto_perfil
                            )
                        ), ']') 
                        FROM personas_incidentes pi_tec
                        JOIN personas t ON pi_tec.id_persona = t.dni AND t.id_rol = 3 -- Filtrar técnicos
                        WHERE pi_tec.id_incidente = i.id_incidente
                    ), '[]') AS tecnico_asignado

                FROM personas_incidentes pi
                JOIN incidentes i ON pi.id_incidente = i.id_incidente
                JOIN personas p ON pi.id_persona = p.dni AND p.id_rol = 2  -- Filtrar solo roles de soporte

                WHERE pi.id_persona = ?
                ${estado !== 'Todos' ? 'AND i.estado = ?' : ''}

                GROUP BY i.id_incidente
                ORDER BY i.fecha_creacion DESC
                LIMIT ? OFFSET ?

                `,
                estado !== 'Todos'
                    ? [socket.user.dni, estado, limite, offset]
                    : [socket.user.dni, limite, offset]
            );

            const total = parseInt(totalIncidentes[0].count);
            let hayMasIncidentes = listadoIncidentes.length < total;

            // ✅ Convertir tecnico_asignado de string a JSON Array
            const incidentesProcesados = listadoIncidentes.map(incidente => ({
                ...incidente,
                tecnico_asignado: JSON.parse(incidente.tecnico_asignado || '[]') // Convertir a array o vacío
            }));

            // ✅ Enviar datos al frontend
            return callback({ success: true, data: incidentesProcesados, total, hayMasIncidentes, estado });

        } catch (error) {
            console.error('Error al listar incidentes:', error);
            return callback({ success: false, error: 'Hubo un problema al listar incidentes.' });
        }
    });
    socket.on('/soporte/listadoTecnicos', async (callback) => {
        try {
            // Obtener el dni, nombres y apellidos de los técnicos (tabla de personas con el id_rol = 3)
            const listadoTecnicos = await ejecutarConsulta(
                'SELECT dni, nombres, apellidos FROM personas WHERE id_rol = 3'
            );
            return callback({ success: true, data: listadoTecnicos });
        } catch (error) {
            console.error('Error al listar técnicos:', error);
            return callback({ success: false, error: 'Hubo un problema al listar técnicos.' });
        }
    });

    //! FALTA implementar la verificación para que el soporte asignado al cliente sea el mismo que envia la respuesta al usuario
    socket.on('/soporte/enviarRespuestaCliente', async (data, callback) => {
        try {
            const { respuesta, id_incidente, ruc_empresa } = data;

            if (!respuesta) {
                return callback({ success: false, error: 'La respuesta no puede estar vacía.' });
            }
            if (!id_incidente) {
                return callback({ success: false, error: 'Id de incidente no puede ser vacío.' });
            }

            const incidente = await ejecutarConsulta('SELECT * FROM incidentes WHERE id_incidente = ?', [id_incidente]);

            // Verificar si la empresa ya tiene una respuesta existente:
            if (incidente.respuesta_soporte) {
                return callback({ success: false, error: 'Ya existe una respuesta para este incidente.' });
            };
            // Verificar si el incidente tiene una respuesta del tecnico asignado:
            if (!incidente.respuesta_tecnico) {
                return callback({ success: false, error: 'El incidente aún no tiene una respuesta del tecnico.' });
            };

            // Actualizar la respuesta en la base de datos
            await ejecutarConsulta(`
                    UPDATE incidentes 
                    SET 
                        respuesta_soporte = ?, 
                        estado = ?,
                        fecha_resolucion = now(),
                        fecha_cierre = now()
                    WHERE 
                        id_incidente = ?
                `, [respuesta, 'Resuelto', id_incidente]);

            const incidenteFechas = await ejecutarConsulta('SELECT fecha_creacion, fecha_resolucion, fecha_asignacion, fecha_cierre FROM incidentes WHERE id_incidente = ?', [id_incidente]);
            const { fecha_creacion, fecha_resolucion, fecha_asignacion, fecha_cierre } = incidenteFechas[0];
            console.log("Fechas de incidente: ", incidenteFechas);

            // Verificar si el incidente ha sido reasignado
            const personasAsignadas = await ejecutarConsulta('SELECT * FROM personas_incidentes WHERE id_incidente = ?', [id_incidente]);

            const tecnicoAsignado = personasAsignadas[1] ? personasAsignadas[1] : null;

            // Preparar datos para enviar 
            const dataIncidente = {
                id_incidente: Number(id_incidente),

                // Datos del incidente
                titulo: incidente[0].titulo,
                respuesta_soporte: respuesta,
                descripcion_incidente: incidente[0].descripcion_incidente,
                estado: 'Resuelto',
                ruc_empresa: ruc_empresa,
                tecnico_asignado: tecnicoAsignado ? [tecnicoAsignado.nombres, tecnicoAsignado.apellidos] : [],

                // Fechas de incidente
                fecha_creacion: fecha_creacion,
                fecha_resolucion: fecha_resolucion,
                fecha_asignacion: fecha_asignacion,
                fecha_cierre: fecha_cierre,
            };

            console.log("Datos para notificar al cliente: ", dataIncidente);
            // Notificar a todos los clientes de la empresa, el soporte y el administrador sobre la respuesta
            io.of('/cliente').to(`cliente_${ruc_empresa}`).emit('/cliente/actualizacionIncidente', dataIncidente);
            io.of('/administrador').to(`admin`).emit('/administrador/actualizacionIncidente', dataIncidente);
            io.of('/soporte').to(socket.id).emit('/soporte/actualizacionIncidente', dataIncidente);
            return callback({ success: true });


        } catch (error) {
            console.error('Error al enviar respuesta:', error);
            return callback({ success: false, error: 'Hubo un problema al enviar la respuesta.' });
        }
    });
    socket.on('/soporte/reasignarIncidente', async (data, callback) => {
        try {
            const { id_incidente, titulo, ruc_empresa, descripcion_incidente, fecha_creacion, id_tecnico, comentario_soporte, fecha_asignacion } = data;

            // ✅ Validar datos
            if (!id_incidente || !id_tecnico || !comentario_soporte) {
                return callback({ success: false, error: 'Todos los datos son obligatorios para reasignar un incidente.' });
            }

            // ✅ Verificar si el usuario es soporte
            const esSoporte = await ejecutarConsulta(
                `SELECT id_rol FROM personas WHERE dni = ?`, [socket.user.dni]
            );

            if (esSoporte.length === 0 || esSoporte[0].id_rol !== 2) { // Suponiendo que 2 es el rol de soporte
                return callback({ success: false, error: 'No tienes permisos para reasignar incidentes.' });
            }

            // Verificar que el incidente no este ya reasignado
            const verificarIncidente = await ejecutarConsulta(
                `SELECT * FROM personas_incidentes WHERE id_incidente = ?`,
                [id_incidente]
            );
            if (verificarIncidente.length > 1) {
                return callback({ success: false, error: 'El incidente ya esta reasignado.' });
            }

            // ✅ Verificar si el incidente existe y tiene soporte asignado
            const incidenteExiste = await ejecutarConsulta(
                `SELECT pi.id_persona AS soporte_actual
                 FROM personas_incidentes pi
                 JOIN personas p ON pi.id_persona = p.dni
                 WHERE pi.id_incidente = ? AND p.id_rol = 2`, [id_incidente]
            );
            if (incidenteExiste.length === 0) {
                return callback({ success: false, error: 'El incidente no existe o no tiene soporte asignado.' });
            }

            // ✅ Verificar si el técnico existe
            const tecnico = await ejecutarConsulta(
                `SELECT dni FROM personas WHERE dni = ? AND id_rol = 3`, [id_tecnico]
            );
            if (tecnico.length === 0) {
                return callback({ success: false, error: 'El técnico seleccionado no existe o no tiene el rol correcto.' });
            }

            // ✅ Registrar al tecnico en la tabla `personas_incidentes`
            await ejecutarConsulta(
                `INSERT INTO personas_incidentes (id_incidente, id_persona) VALUES (?, ?)`,
                [id_incidente, id_tecnico]
            );
            // ✅ Actualizar la tabla `incidentes` con la fecha de asignación y comentario
            await ejecutarConsulta(
                `UPDATE incidentes 
                 SET fecha_asignacion = ?, comentarios_soporte = ?
                 WHERE id_incidente = ?`,
                [fecha_asignacion, comentario_soporte, id_incidente]
            );

            // Preparar datos para enviar 
            const dataIncidente = {
                id_incidente: Number(id_incidente),
                titulo: titulo,
                ruc_empresa: ruc_empresa,
                descripcion_incidente: descripcion_incidente,
                fecha_creacion: fecha_creacion,
                fecha_asignacion: fecha_asignacion,
                comentarios_soporte: comentario_soporte,
                respuesta_tecnico: null,
                estado: 'Pendiente',
                tecnico_asignado: [{
                    dni: id_tecnico,
                    nombres: tecnico.nombres,
                    apellidos: tecnico.apellidos,
                    correo: tecnico.correo,
                    foto: tecnico.foto_perfil,
                    telefono: tecnico.telefono,
                }],
            };

            // ✅ Emitir evento para notificar al tecnico asignado, al soporte que asignó y al administrador
            io.of('/tecnico').to(`tecnico_${id_tecnico}`).emit('/tecnico/nuevoIncidenteAsignado', dataIncidente);
            io.of('/soporte').to(`soporte_${socket.user.dni}`).emit('/soporte/actualizacionIncidente', dataIncidente);
            io.of('/administrador').to(`admin`).emit('/administrador/actualizacionIncidente', dataIncidente);

            return callback({ success: true });

        } catch (error) {
            console.error('Error al reasignar un incidente:', error);
            return callback({ success: false, error: 'Hubo un problema interno al reasignar el incidente.' });
        }
    });


    //? Configuración
    socket.on('/soporte/miInfoUsuario', async (callback) => {
        try {
            const dni = socket.user.dni;

            const usuario = await ejecutarConsulta(`
                    SELECT  dni, nombres, apellidos, fecha_nacimiento, usuario, foto_perfil, telefono, direccion, correo, estado
                    FROM personas 
                    WHERE dni = ?`, [dni]);
            console.log(`DNI: ${dni} infoUSuario: ${usuario}`);

            return callback({ success: true, data: usuario[0] });

        } catch (error) {
            console.error('Error al obtener información del usuario:', error);
            return callback({ success: false, error: 'Hubo un problema al obtener la información del usuario.' });
        }
    });
});

io.of('/tecnico').use(verificarTokenSocket).on('connection', (socket) => {
    if (socket.user.id_rol !== 3) {
        console.log('Acceso denegado al Socket de Soporte: Rol no autorizado.');
        return socket.disconnect(true);
    }
    if (socket.user.usuario) {
        console.log(`Usuario de Soporte autenticado y conectado: ${socket.user.usuario}`);
    }

    // Agregar al tecnico a su propia sala para que pueda recibir los incidentes de los asesores
    socket.join(`tecnico_${socket.user.dni}`);

    socket.on('disconnect', () => {
        console.log(`Usuario Técnico desconectado: ${socket.user.usuario}`);
    });

    // async () => {
    //     try {
    //         const listadoGeneralUsuario = await ejecutarConsulta('SELECT * FROM personas');
    //         io.of('/tecnico').to(socket.id).emit('listadoGeneralUsuarios', listadoGeneralUsuario);
    //     } catch (error) {
    //         console.error('Error al listar usuarios:', error);
    //         io.of('/tecnico').to(socket.id).emit('listadoGeneralUsuarios', { error: 'Hubo un problema al listar usuarios.' });
    //     }
    // }


    //? INCIDENTES

    socket.on('/tecnico/listadoIncidentes', async ({ pagina, limite, estado = 'Todos' }, callback) => {
        try {
            // ✅ Validar autenticación del usuario
            if (!socket.user || !socket.user.dni) {
                return callback({ success: false, error: 'No estás autenticado.' });
            }

            // ✅ Convertir parámetros
            limite = parseInt(limite, 10);
            pagina = parseInt(pagina, 10);
            if (isNaN(limite) || isNaN(pagina)) {
                return callback({ success: false, error: 'El límite o la página no son válidos.' });
            }

            const offset = (pagina - 1) * limite;

            // ✅ Consultar el total de incidentes asignados al técnico
            const totalIncidentes = await ejecutarConsulta(
                `SELECT COUNT(*) AS count 
                FROM personas_incidentes pi
                JOIN incidentes i ON pi.id_incidente = i.id_incidente
                WHERE pi.id_persona = ?`,
                [socket.user.dni]
            );

            // ✅ Obtener incidentes asignados al técnico, con info del soporte y empresa
            const listadoIncidentes = await ejecutarConsulta(
                ` 
                SELECT 
                    i.id_incidente, 
                    i.titulo, 
                    i.descripcion_incidente, 
                    i.ruc_empresa,
                    i.fecha_creacion,
                    i.fecha_resolucion,
                    i.fecha_asignacion,
                    i.fecha_cierre,
                    i.estado,
                    i.respuesta_soporte,  
                    i.comentarios_soporte,  
                    i.respuesta_tecnico,  

                    -- Información del soporte que asignó el incidente
                    s.dni AS soporte_dni,
                    s.nombres AS soporte_nombres,
                    s.apellidos AS soporte_apellidos,
                    s.telefono AS soporte_telefono,
                    s.correo AS soporte_correo,
                    s.foto_perfil AS soporte_foto

                FROM personas_incidentes pi
                JOIN incidentes i ON pi.id_incidente = i.id_incidente
                JOIN personas_incidentes pi_s ON pi_s.id_incidente = i.id_incidente
                JOIN personas s ON pi_s.id_persona = s.dni AND s.id_rol = 2

                WHERE pi.id_persona = ?
                ${estado !== 'Todos' ? 'AND i.estado = ?' : ''}

                GROUP BY i.id_incidente
                ORDER BY i.fecha_creacion DESC
                LIMIT ? OFFSET ?

                `,
                estado !== 'Todos'
                    ? [socket.user.dni, estado, limite, offset]
                    : [socket.user.dni, limite, offset]
            );

            const total = parseInt(totalIncidentes[0].count);
            let hayMasIncidentes = listadoIncidentes.length < total;

            // ✅ Enviar datos al frontend
            return callback({ success: true, data: listadoIncidentes, total, hayMasIncidentes, estado });

        } catch (error) {
            console.error('Error al listar incidentes para técnicos:', error);
            return callback({ success: false, error: 'Hubo un problema al listar incidentes.' });
        }
    });

    socket.on('/tecnico/crearNuevoIncidente', async (data, callback) => {
        try {
            const { titulo, descripcion_incidente, cliente_dni, ruc_empresa, dni_soporte } = data;

            // Crear el nuevo incidente
            const result = await ejecutarConsulta('INSERT INTO incidentes (titulo, descripcion_incidente, cliente, ruc_empresa, dni_soporte) VALUES (?, ?, ?, ?, ?)', [titulo, descripcion_incidente, cliente_dni, ruc_empresa, dni_soporte]);

            const id_incidente = result.insertId;

            // Obtener los detalles de la empresa
            const empresa = await ejecutarConsulta('SELECT razon_social FROM empresas WHERE ruc = ?', [ruc_empresa]);

            // Obtener la fecha de creación del incidente
            const fecha_creacion = new Date().toISOString(); // la fecha se obtiene de la base de datos

            // Emitir el evento de nuevo incidente a los tecnicoes, tecnicos y soporte menos a los clientes
            io.of('/tecnico').emit('/tecnico/nuevoIncidente', {
                id_incidente: id_incidente,
                titulo: titulo,
                descripcion_incidente: descripcion_incidente,
                cliente_dni: cliente_dni,
                ruc_empresa: ruc_empresa,
                dni_soporte: dni_soporte,
                estado: 'Pendiente',
                razon_social: empresa[0].razon_social,
                fecha_creacion: fecha_creacion
            });

            callback({ success: true });

        } catch (error) {
            console.error('Error al crear nuevo incidente:', error);
            callback({ success: false, error: error });
        }
    });

    socket.on('/tecnico/enviarRespuestaSoporte', async (data, callback) => {
        try {
            const { respuesta, id_incidente, soporte_dni, fecha_resolucion } = data;

            // Verificar si el incidente existe
            const incidente = await ejecutarConsulta('SELECT * FROM incidentes WHERE id_incidente = ?', [id_incidente]);

            if (!incidente) {
                return callback({ success: false, error: 'El incidente no existe.' });
            };

            // Verificar si el incidente tiene una respuesta del tecnico asignado:
            if (incidente.respuesta_tecnico) {
                return callback({ success: false, error: 'El incidente ya tiene una respuesta del tecnico.' });
            };

            // Actualizar la respuesta en la base de datos
            await ejecutarConsulta(`
                UPDATE incidentes
                SET respuesta_tecnico = ?,
                    fecha_resolucion = ?
                WHERE id_incidente = ?
            `, [respuesta, fecha_resolucion, id_incidente]);


            // Preparar datos para enviar 
            const dataIncidente = {
                id_incidente: Number(id_incidente),
                titulo: incidente.titulo,
                ruc_empresa: incidente.ruc_empresa,
                descripcion_incidente: incidente.descripcion_incidente,
                fecha_creacion: incidente.fecha_creacion,
                fecha_asignacion: incidente.fecha_asignacion,
                comentarios_soporte: incidente.comentario_soporte,
                respuesta_tecnico: respuesta,
                estado: 'Pendiente',
                tecnico_asignado: [{
                    dni: socket.user.dni,
                }],
            };

            // Notificar a los administradores y al soporte asignado
            io.of('admin').emit('/administrador/actualizacionIncidente', dataIncidente);
            io.of('soporte').to(`soporte_${soporte_dni}`).emit('/soporte/actualizacionIncidente', dataIncidente);
            io.of('tecnico').to(socket.id).emit('/tecnico/actualizacionIncidente', dataIncidente);

            callback({ success: true });
        } catch (error) {
            console.error('Error en Socket.io /tecnico/enviarRespuestaSoporte:', error);
            callback({ success: false, error: error });
        }
    });

    //? Configuración
    socket.on('/tecnico/miInfoUsuario', async (callback) => {
        try {
            const dni = socket.user.dni;

            console.log("DNI: ", dni);

            const usuario = await ejecutarConsulta(`
                        SELECT  dni, nombres, apellidos, fecha_nacimiento, usuario, foto_perfil, telefono, direccion, correo, estado
                        FROM personas 
                        WHERE dni = ?`, [dni]);
            console.log(`DNI: ${dni} infoUSuario: ${usuario}`);

            return callback({ success: true, data: usuario[0] });

        } catch (error) {
            console.error('Error al obtener información del usuario:', error);
            return callback({ success: false, error: 'Hubo un problema al obtener la información del usuario.' });
        }
    });

});

io.of('/cliente').use(verificarTokenSocket).on('connection', (socket) => {

    if (socket.user.documento) {
        console.log(`CLIENTE autenticado (con Cookie de Innova Negocios) y conectado al socket /cliente con Nro. Documento: ${socket.user.documento}`);
    }

    socket.on('disconnect', () => {
        console.log(`Cliente desconectado con Nro. Documento: ${socket.user.documento}`);
    });

    // Agregar al cliente a su propia sala para que pueda recibir los incidentes de sus asesores
    console.log(`Cliente conectando a /cliente/${socket.user.ruc_empresa}`);
    socket.join(`cliente_${socket.user.ruc_empresa}`);

    // Manuales para el cliente
    socket.on('/cliente/listadoManuales', async (callback) => {
        try {
            // Obtener el total de manuales (la tabla "menu" representa los manuales)
            const totalManualesResult = await ejecutarConsulta('SELECT COUNT(*) AS count FROM menu');
            const total = parseInt(totalManualesResult[0].count);

            // Consulta para obtener los manuales junto con información multimedia (si la hay)
            const listadoManualesResult = await ejecutarConsulta(`
                    SELECT 
                        me.id_menu,
                        me.titulo,
                        me.eventos,
                        ma.id_manual,
                        ma.subtitulo,
                        ma.introduccion,
                        ma.guia,
                        m.link_video,
                        m.link_pdf,
                        m.id_multimedia
                    FROM 
                        menu me
                    LEFT JOIN 
                        manual ma ON me.id_menu = ma.id_menu
                    LEFT JOIN
                        multimedia m ON ma.id_manual = m.id_manual
                `);

            // Agrupar los resultados por manual (id_menu)
            const manualsMap = {};
            listadoManualesResult.forEach(row => {
                // Desestructuramos las columnas con los nuevos nombres
                const {
                    id_menu,
                    titulo,
                    eventos,
                    id_manual,
                    subtitulo,
                    introduccion,
                    guia,
                    link_video,
                    link_pdf,
                    id_multimedia
                } = row;

                // Si aún no se ha agregado el manual, se inicializa en el mapa
                if (!manualsMap[id_menu]) {
                    manualsMap[id_menu] = {
                        id_menu,
                        titulo,
                        eventos,
                        manuales: []
                    };
                }

                // Si existe un contenido (manual) para este manual, se agrega al array "manuales"
                if (id_manual) {
                    manualsMap[id_menu].manuales.push({
                        id_manual,
                        subtitulo,
                        introduccion,
                        guia,
                        link_video: link_video || null,
                        link_pdf: link_pdf || null,
                        id_multimedia
                    });
                }
            });

            // Convertir el mapa a un arreglo
            const listadoManualesAgrupado = Object.values(manualsMap);

            // Devolver los datos agrupados
            return callback({ success: true, data: listadoManualesAgrupado, total });
        } catch (error) {
            console.error('Error al listar manuales:', error);
            return callback({ success: false, error: 'Hubo un problema al listar el manual.' });
        }
    });

    //? INCIDENTES
    socket.on('/cliente/listadoIncidentes', async ({ pagina, limite, estado = 'Todos' }, callback) => {
        try {
            let totalIncidentes;
            let listadoIncidentes;

            // Asegurarse de que limite y pagina sean números válidos
            limite = parseInt(limite, 10);
            pagina = parseInt(pagina, 10);
            if (isNaN(limite) || isNaN(pagina)) {
                return callback({ success: false, error: 'El límite o la página no son válidos.' });
            }

            const offset = (pagina - 1) * limite;

            totalIncidentes = await ejecutarConsulta('SELECT COUNT(*) AS count FROM incidentes');
            listadoIncidentes = await ejecutarConsulta(
                `SELECT
                  incidentes.id_incidente, 
                  incidentes.titulo, 
                  incidentes.descripcion_incidente, 
                  incidentes.ruc_empresa,
                  incidentes.fecha_creacion,
                  incidentes.fecha_resolucion,
                  incidentes.fecha_asignacion,
                  incidentes.fecha_cierre,
                  incidentes.respuesta_soporte,
                  incidentes.estado,

                  personas_incidentes.id_persona, 
                  personas_incidentes.id_incidente
                FROM personas_incidentes JOIN incidentes
                    ON personas_incidentes.id_incidente = incidentes.id_incidente
                WHERE incidentes.ruc_empresa = ?

                GROUP BY incidentes.id_incidente
                ORDER BY incidentes.fecha_creacion
                DESC LIMIT ? OFFSET ?`,
                [socket.user.ruc_empresa, limite, offset]
            );

            const total = parseInt(totalIncidentes[0].count);
            let hayMasIncidentes = listadoIncidentes.length < total;

            // Enviar el resultado formateado al frontend
            return callback({ success: true, data: listadoIncidentes, total, hayMasIncidentes, estado });
        } catch (error) {
            console.error('Error al listar incidentes:', error);
            return callback({ success: false, error: 'Hubo un problema al listar incidentes.' });
        }
    });

    socket.on('/cliente/crearNuevoIncidente', async (nuevoIncidente, callback) => {
        try {
            const { titulo, descripcion_incidente, links_imagenes, links_videos, links_pdfs } = nuevoIncidente;

            // Validar el contenido del incidentes
            if (!titulo || !descripcion_incidente) {
                return callback({ success: false, error: 'El título y la descripción del incidente son obligatorios.' });
            }

            // Obtener la fecha de creación del incidente
            const fecha_creacion = new Date().toISOString(); // la fecha se obtiene de la base de datos

            // Crear el nuevo incidente
            const insertadoIncidentes = await ejecutarConsulta(`
                INSERT INTO incidentes (titulo, descripcion_incidente, fecha_creacion, ruc_empresa) VALUES (?, ?, ?, ?)`,
                [titulo, descripcion_incidente, fecha_creacion, socket.user.ruc_empresa]);

            const id_incidente = insertadoIncidentes.insertId;

            // Crear el registro Personas-Incidentes
            const insertPersonasIncidentes = await ejecutarConsulta('INSERT INTO personas_incidentes (id_incidente, id_persona) VALUES (?, ?)', [id_incidente, socket.user.asesor]);

            // Crear los registros Multimedia si se envió alguno o varios
            // Insertar registros en "multimedia" para cada tipo de archivo, utilizando 0 en id_manual (ya que no aplica)
            if (links_imagenes && links_imagenes.length > 0) {
                for (const link_imagen of links_imagenes) {
                    await ejecutarConsulta(
                        "INSERT INTO multimedia (link_imagen, id_incidente, id_manual) VALUES (?, ?, ?)",
                        [link_imagen, id_incidente, 0]
                    );
                }
            }
            if (links_videos && links_videos.length > 0) {
                for (const link_video of links_videos) {
                    await ejecutarConsulta(
                        "INSERT INTO multimedia (link_video, id_incidente, id_manual) VALUES (?, ?, ?)",
                        [link_video, id_incidente, 0]
                    );
                }
            }
            if (links_pdfs && links_pdfs.length > 0) {
                for (const link_pdf of links_pdfs) {
                    await ejecutarConsulta(
                        "INSERT INTO multimedia (link_pdf, id_incidente, id_manual) VALUES (?, ?, ?)",
                        [link_pdf, id_incidente, 0]
                    );
                }
            }


            let dataIncidente = {
                id_incidente: id_incidente,
                id_persona_incidente: insertPersonasIncidentes.insertId,
                titulo: titulo,
                descripcion_incidente: descripcion_incidente,
                estado: 'Pendiente',
                fecha_creacion: fecha_creacion,
                ruc_empresa: socket.user.ruc_empresa,
                // Multimedias
                links_imagenes: links_imagenes,
                links_videos: links_videos,
                links_pdfs: links_pdfs,
            };

            // Emitir el evento de nuevo incidente a los administradores, al soporte asignado al usuario y a los clientes de esa empresa
            io.of('/administrador').to(`admin`).emit('/administrador/nuevoIncidente', dataIncidente);
            io.of('/soporte').to(`soporte_${socket.user.asesor}`).emit('/soporte/nuevoIncidente', dataIncidente);
            io.of('/cliente').to(`cliente_${socket.user.ruc_empresa}`).emit('/cliente/nuevoIncidente', dataIncidente);

            return callback({ success: true, data: dataIncidente });

        } catch (error) {
            console.error('Error al crear nuevo incidente:', error);
            return callback({ success: false, error: error });
        }
    });
});

io.of('/invitado').on('connection', (socket) => {
    console.log('Cliente conectado a /invitado');
});

