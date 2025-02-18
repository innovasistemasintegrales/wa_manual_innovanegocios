// routes/routes.js}

const Router = require('express').Router;
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
// Para hacer solicitudes a la API
const router = Router();
const jwt = require('jsonwebtoken');
const { comparePassword } = require('../utils/hash');
require('dotenv').config();

const ejecutarConsulta = require('../utils/consultasDB.js');

// Middleware para verificar tokens de sesión en las rutas y renovarlos con el middleware de refresh tokens
async function verificarToken(req, res, next) {
    const accessToken = req.cookies.jwt; // Token de usuario (no cliente)
    const accessTokenCliente = req.cookies.jwtCliente; // Token de cliente
    const refreshToken = req.cookies.refreshJwt; // Refresh token

    try {
        // Priorizar el acceso de usuarios que no son clientes
        if (accessToken) {
            const payload = jwt.verify(accessToken, process.env.JWT_SECRET);
            req.user = payload;
            return next();
        }

        // Si no hay token de usuario, intentar renovar con refreshToken
        if (refreshToken) {
            const payload = await validarRefreshToken(refreshToken);

            if (payload.id_rol) { // Si el usuario tiene un rol, es prioritario
                const newAccessToken = jwt.sign({
                    dni: payload.dni,
                    nombres: payload.nombres,
                    apellidos: payload.apellidos,
                    telefono: payload.telefono,
                    usuario: payload.usuario,
                    id_rol: payload.id_rol,
                }, process.env.JWT_SECRET, { expiresIn: '1h' });

                res.cookie('jwt', newAccessToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    maxAge: 60 * 60 * 1000,
                });
                req.user = payload;
                return next();
            }
        }

        // Si no hay token de usuario y no se pudo renovar, verificar cliente
        if (accessTokenCliente) {
            try {
                const payloadCliente = jwt.verify(accessTokenCliente, process.env.CLIENTE_JWT_SECRET);
                req.user = payloadCliente;
                return next();
            } catch (error) {
                console.error('Error de autenticación de cliente:', error.message);
                return res.redirect('/login?mensaje=Sesión expirada. Por favor, inicia sesión nuevamente.');
            }
        }

        return res.render('login');

    } catch (error) {
        console.error('Error en la autenticación:', error.message);
        return res.render('login');
    }
}

router.get('/', (req, res) => {
    res.render('index');
});

router.get('/login', verificarToken, (req, res) => {

    console.log(`Sesión activa: ${req.user}`);

    if (req.user.id_rol) {
        if (req.user.id_rol == '1') {
            res.redirect('/administrador');
        } else if (req.user.id_rol == '2') {
            res.redirect('/soporte');
        } else if (req.user.id_rol == '3') {
            res.redirect('/tecnico');
        } else {
            res.render('login');
        }
    } else if (req.user.documento) {
        res.redirect('/cliente');
    } else {
        res.render('login');
    }

    res.render('login');

    // Verificar mediante una API si el usuario existe
    /* fetch('http://localhost:2000/api/validar-credenciales', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            correo: req.body.correo,
            password: req.body.password,
        }),
    }).then(response => response.json()).then(data => {
        if (data.success) {
            // Si el usuario existe, crear sesion
            const sesion = {
                id: data.sesion.id,
                nombre: data.sesion.nombre,
                correo: data.sesion.correo,
                rol: data.sesion.rol,
            };

            res.cookie('sesion', JSON.stringify(sesion), {
                maxAge: 1000 * 60 * 60 * 24 * 7, // 7 días
                httpOnly: true,
                sameSite: 'strict',
                secure: true,
            });
            res.redirect('/');
        } else {
            // Si el usuario no existe, mostrar mensaje de error
            res.render('login', {
                error: 'Usuario o contraseña incorrectos.',
            });
        }
    }); */
});

router.get('/invitado', (req, res) => {
    res.render('invitado');
});
router.get('/cliente', verificarToken, (req, res) => {
    // Validar el rol de usuario
    // if (req.user.id_rol !== 4) {
    //     return res.redirect('/login?mensaje=No tienes los permisos necesarios para ingresar aquí');
    // }
    res.render('cliente');

});
router.get('/soporte', verificarToken, (req, res) => {
    // Validar el rol de usuario
    if (req.user.id_rol !== 2) {
        return res.redirect('/login?mensaje=No tienes los permisos necesarios para ingresar aquí');
    }
    res.render('soporte');
});
router.get('/administrador', verificarToken, (req, res) => {
    // Validar el rol de usuario
    if (req.user.id_rol !== 1) {
        return res.redirect('/login?mensaje=No tienes los permisos necesarios para ingresar aquí');
    }
    res.render('administrador');
});
router.get('/tecnico', verificarToken, (req, res) => {
    // Validar el rol de usuario
    if (req.user.id_rol !== 3) {
        return res.redirect('/login?mensaje=No tienes los permisos necesarios para ingresar aquí');
    }
    res.render('tecnico');
});

// Endpoint para listar incidentes
router.get('/listadoIncidentes', verificarToken, async (req, res) => {
    let query;
    const params = [];

    switch (req.user.id_rol) {
        case 1: // Administrador
            query = 'SELECT * FROM incidentes';
            break;
        case 2: // Soporte
            query = `
                SELECT i.* 
                FROM incidentes i
                JOIN empresas e ON i.ruc_empresa = e.ruc
                WHERE e.id_usuario = ?`;
            params.push(req.user.dni);
            break;
        case 3: // Técnico
            query = `
                SELECT i.* 
                FROM incidentes i
                JOIN personas_incidentes pi ON i.id_incidente = pi.id_incidente
                WHERE pi.id_persona = ?`;
            params.push(req.user.dni);
            break;
        case 4: // Cliente
            query = 'SELECT * FROM incidentes WHERE ruc_empresa = ?';
            params.push(req.session.rucEmpresa);
            break;
        default:
            return res.status(403).json({ error: "Acceso denegado" });
    }

    const incidentes = await ejecutarConsulta(query, params);
    res.json({ success: true, data: incidentes });
});

router.post('/login/validarCredenciales', async (req, res) => {
    try {
        const { correo, password } = req.body;

        let userDB;

        if (!correo || !password) {
            return res.status(400).json({ success: false, error: 'Faltan datos requeridos' });
        }

        // Consulta a la base de datos para buscar al usuario
        const rows = await ejecutarConsulta('SELECT * FROM Personas WHERE correo = ?', [correo]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
        }

        userDB = rows[0];

        // Verificar contraseña
        const isValid = await comparePassword(password, userDB.contrasena);
        if (!isValid) {
            return res.status(401).json({ success: false, error: 'Contraseña incorrecta' });
        }


        // Generar payload para el token
        const payload = {
            dni: userDB.dni,
            nombres: userDB.nombres,
            apellidos: userDB.apellidos,
            telefono: userDB.telefono,
            usuario: userDB.usuario,
            id_rol: userDB.id_rol,
        };

        // Generar el access token
        const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN, // Por ejemplo, "1h"
        });

        // Generar el refresh token
        const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
            expiresIn: process.env.JWT_REFRESH_EXPIRES_IN, // Por ejemplo, "7d"
        });

        // Configurar cookies HTTP-only para los tokens
        res.cookie('jwt', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Solo en HTTPS en producción
            maxAge: 60 * 60 * 1000, // 1 hora
        });

        res.cookie('refreshJwt', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
        });

        // Respuesta exitosa
        return res.status(200).json({
            success: true,
            message: 'Inicio de sesión exitoso',
        });

    } catch (error) {
        console.error("Error en /login/validarCredenciales:", error);
        return res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
});

router.get('/obtener-token-cliente', async (req, res) => {
    try {

        // simular payload del token cliente
        const payload = {
            id_usuario: '11',
            id_empresa: '8',
            ruc_empresa: '12345678910',
            tipo_documento: 2,
            documento: '12345678',
            telefono: '123456789',
            fecha_conexion: new Date().toISOString(),
            asesor: '72156106',
        };

        // Generar el access token
        const accessTokenCliente = jwt.sign(payload, process.env.CLIENTE_JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN, //  "1h"
        });

        // Configurar cookies HTTP-only para los tokens
        res.cookie('jwtCliente', accessTokenCliente, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Solo en HTTPS en producción
            maxAge: 60 * 60 * 1000, // 1 hora
        });

        // Respuesta exitosa
        return res.status(200).json({
            success: true,
            message: 'Inicio de sesión exitoso',
        });

    } catch (error) {
        console.error("Error en /obtener-token-cliente:", error);
        return res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
})

// Ruta para renovar el Access Token con el refresh token
router.post('/refresh-token', async (req, res) => {

    const refreshToken = req.cookies.refreshJwt; // Obtener el refresh token de las cookies

    if (!refreshToken) {
        // Si no hay ningún token, redirigir al login
        return res.render('login', { mensaje: 'No hay ningún token' });
    }

    try {
        // Renovar el token de acceso usando el refresh token
        const payload = await validarRefreshToken(refreshToken);

        // Generar un nuevo token de acceso
        const newAccessToken = jwt.sign(
            {
                dni: payload.dni,
                nombres: payload.nombres,
                apellidos: payload.apellidos,
                telefono: payload.telefono,
                usuario: payload.usuario,
                id_rol: payload.id_rol,
            },
            process.env.JWT_SECRET,
            { expiresIn: '1h' } // Tiempo de vida corto
        );

        // Guardar el nuevo token en las cookies
        res.cookie('jwt', newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 1000, // 1 hora
        });

        req.user = payload; // Adjuntar los datos del usuario al request
        return next();
    } catch (error) {
        console.error('Error al renovar el token:', error.message);
        return res.redirect('/login?mensaje=Sesión expirada. Por favor, inicia sesión nuevamente.');
    }

});

router.post('/logout', (req, res) => {
    try {
        // Limpiar las cookies del cliente
        res.clearCookie('jwtCliente', { httpOnly: true, secure: true, sameSite: 'strict' });
        res.clearCookie('jwt', { httpOnly: true, secure: true, sameSite: 'strict' });
        res.clearCookie('refreshJwt', { httpOnly: true, secure: true, sameSite: 'strict' });

        // Responder con éxito al cliente
        res.status(200).json({ success: true, message: 'Sesión cerrada correctamente.' });
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        res.status(500).json({ success: false, message: 'Error interno al cerrar sesión.' });
    }
});

// Middleware para validar el Refresh Token
const validarRefreshToken = async (refreshToken) => {
    if (!refreshToken) {
        throw new Error('No se proporcionó el refresh token.');
    }

    return jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
};





module.exports = router;
