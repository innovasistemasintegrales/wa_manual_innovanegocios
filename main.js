const app = require('./app');
const server = app.listen(app.get('port'));

// Conexión a la base de datos
const pool = require('./config/config_mysql');  

// Websockets
const socketIO = require('socket.io');
const io = socketIO(server);



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
    console.log('Administrador conectado');

    // Listar incidentes
    (async () => {
        try {
            const incidentes = await ejecutarConsulta('SELECT * FROM incidentes');
            io.of('/administrador').to(socket.id).emit('/administrador/listadoGeneralIncidentes', incidentes);
        } catch (error) {
            console.error('Error al listar incidentes:', error);
        }
    })();

    // Listar últimos incidentes
    (async () => {
        try {
            const ultimosIncidentes = await ejecutarConsulta(
                'SELECT * FROM incidentes ORDER BY fecha_creacion DESC LIMIT 5'
            );
            io.of('/administrador').to(socket.id).emit('/administrador/listadoUltimosIncidentes', ultimosIncidentes);
        } catch (error) {
            console.error('Error al listar últimos incidentes:', error);
        }
    })();

    // Registrar usuario
    socket.on('/administrador/registrarUsuario', async (data) => {
        try {
            const result = await ejecutarConsulta('INSERT INTO usuarios SET ?', data);
            console.log('Usuario registrado exitosamente');
            io.of('/administrador').to(socket.id).emit('/administrador/usuarioRegistrado', result);
        } catch (error) {
            console.error('Error al registrar usuario:', error);
        }
    });

    // Solicitar incidentes con paginación
    socket.on('/administrador/solicitarIncidentes', async ({ pagina, limite }, callback) => {
        try {
            const offset = (pagina - 1) * limite;
            const total = await ejecutarConsulta('SELECT COUNT(*) AS total FROM incidentes');
            const incidentes = await ejecutarConsulta(
                'SELECT * FROM incidentes ORDER BY fecha_creacion DESC LIMIT ? OFFSET ?',
                [limite, offset]
            );
            callback({ incidentes, total: total[0].total });
        } catch (error) {
            console.error('Error al obtener incidentes:', error);
            callback({ error: 'Hubo un problema al obtener los incidentes.' });
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
    (async () => {
        try {
            const titulos = await ejecutarConsulta('SELECT * FROM titulos');
            io.of('/cliente').to(socket.id).emit('/cliente/listarTitulo', titulos);
        } catch (error) {
            console.error('Error al listar títulos:', error);
        }
    })();
});

io.of('/invitado').on('connection', (socket) => {
    console.log('Cliente conectado a /invitado');
});

console.log('Servidor inicializado en puerto', app.get('port'));
