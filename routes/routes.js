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
    const accessToken = req.cookies.jwt; // Obtener el access token de las cookies
    const refreshToken = req.cookies.refreshJwt; // Obtener el refresh token de las cookies

    if (!accessToken) {
        if (!refreshToken) {
            // Si no hay ningún token, redirigir al login
            return res.render('login');
        }

        try {
            // Renovar el token de acceso usando el refresh token
            const payload = await validarRefreshToken(refreshToken);

            // Generar un nuevo token de acceso
            const newAccessToken = jwt.sign(
                {
                    id: payload.id,
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
    }

    try {
        // Validar el token de acceso
        const payload = jwt.verify(accessToken, process.env.JWT_SECRET);
        req.user = payload; // Adjuntar los datos del usuario al request
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError' && refreshToken) {
            try {
                // Si el token de acceso ha expirado, renovar con el refresh token
                const payload = await validarRefreshToken(refreshToken);

                const newAccessToken = jwt.sign(
                    {
                        id: payload.id,
                        usuario: payload.usuario,
                        id_rol: payload.id_rol,
                    },
                    process.env.JWT_SECRET,
                    { expiresIn: '1h' }
                );

                // Guardar el nuevo token en las cookies
                res.cookie('jwt', newAccessToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    maxAge: 60 * 60 * 1000, // 1 hora
                });

                req.user = payload; // Adjuntar los datos del usuario al request
                return next();
            } catch (refreshError) {
                console.error('Error al intentar renovar el token:', refreshError.message);
                return res.redirect('/login?mensaje=Sesión expirada. Por favor, inicia sesión nuevamente.');
            }
        }

        console.error('Error de autenticación:', error.message);
        return res.redirect('/login?mensaje=Sesión expirada. Por favor, inicia sesión nuevamente.');
    }
}

router.get('/', (req, res) => {
    res.render('index');
});

router.get('/login', verificarToken, (req, res) => {

    console.log(`Sesión activa: ${req.user}`);

    if (req.user) {

        if (req.user.id_rol) {
            if (req.user.id_rol == '1') {
                res.redirect('/administrador');
            } else if (req.user.id_rol == '2') {
                res.redirect('/soporte');
            } else if (req.user.id_rol == '3') {
                res.redirect('/tecnico');
            } else if (req.user.id_rol == '4') {
                res.redirect('/cliente');
            } else if (req.user.id_rol == '5') {
                res.redirect('/invitado');
            } else {
                res.render('login'); // Pasar el mensaje a la vista
            }
        } else {
            res.render('login'); // Pasar el mensaje a la vista
        }

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


router.post('/login/validarCredenciales', async (req, res) => {
    try {
        const { tipoUsuario, nroDocumento, correo, password } = req.body;

        let userDB;

        // Verificación según el tipo de usuario
        if (tipoUsuario === "ClienteInnova") {
            if (!nroDocumento) {
                return res.status(400).json({ success: false, message: "Faltan datos requeridos" });
            }

            // Consultar tu API para verificar si el cliente existe
            const response = await fetch('http://localhost:2000/api/usuarioempresa', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ nroDocumento }),
            });

            userDB = await response.json();

            if (!userDB) {
                return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
            }

        } else if (tipoUsuario === "PersonalInnova") {
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

        } else {
            return res.status(400).json({ success: false, error: 'Tipo de usuario no reconocido' });
        }

        // Generar payload para el token
        const payload = {
            id: userDB.id,
            usuario: tipoUsuario === 'ClienteInnova' ? 'Cliente anónimo' : userDB.usuario,
            id_rol: tipoUsuario === 'ClienteInnova' ? 4 : userDB.id_rol,
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

// Ruta para renovar el Access Token con el refresh token
router.post('/refresh-token', async (req, res) => {
    try {
        const { refreshToken } = req.body; // El cliente debe enviar el refresh token en el cuerpo de la solicitud

        // Validar el refresh token y extraer el payload
        const payload = await validarRefreshToken(refreshToken);

        // Generar un nuevo Access Token (con datos del usuario)
        const accessToken = jwt.sign(
            {
                id: payload.id, // ID del usuario
                id_rol: payload.rol, // Rol del usuario
            },
            process.env.JWT_SECRET,
            { expiresIn: '1h' } // Tiempo de vida corto
        );

        // Enviar el Access Token al cliente
        res.status(200).json({
            success: true,
            accessToken,
        });

    } catch (error) {
        console.error('Error al renovar el token:', error.message);
        res.status(401).json({
            success: false,
            message: error.message,
        });
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
