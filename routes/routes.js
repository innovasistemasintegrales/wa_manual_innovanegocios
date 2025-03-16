// routes/routes.js
const Router = require('express').Router;
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const router = Router();
const jwt = require('jsonwebtoken');
const { comparePassword } = require('../utils/hash');
require('dotenv').config();

const ejecutarConsulta = require('../utils/consultasDB.js');

//  Nombres de las cookies utilizadas para la autenticación
const cookieUsuario = process.env.COOKIE_USUARIO || 'usuarioInnova';
const cookieCliente = process.env.COOKIE_CLIENTE || 'clienteInnova';
const cookieRefreshUsuario = process.env.COOKIE_REFRESH_USUARIO || 'refreshUsuarioInnova';
const cookieRefreshCliente = process.env.COOKIE_REFRESH_CLIENTE || 'refreshClienteInnova';

/**
 * Middleware para verificar y renovar tokens de sesión.
 * 
 * Este middleware se encarga de verificar la autenticidad de los tokens de sesión.
 * Si el usuario posee un token de acceso válido, se permite el acceso.
 * Si el token de acceso ha expirado, se intentará renovar con un refresh token.
 * También se verifica si el cliente tiene un token de acceso propio.
 * 
 * @param {Object} req - Objeto de solicitud HTTP.
 * @param {Object} res - Objeto de respuesta HTTP.
 * @param {Function} next - Función para pasar al siguiente middleware.
 * 
 * @returns {void} - No retorna valor, pero redirecciona o llama a `next()` según el estado de los tokens.
 */
async function verificarRenovarToken(req, res, next) {
    const accessToken = req.cookies[cookieUsuario]; // Token de usuario (no cliente)
    const accessTokenCliente = req.cookies[cookieCliente]; // Token de cliente
    const refreshToken = req.cookies[cookieRefreshUsuario]; // Refresh token
    const refreshTokenCliente = req.cookies[cookieRefreshCliente]; // Refresh token de cliente

    try {
        // 1. Verificar token de acceso de usuario interno
        if (accessToken) {
            try {
                const payload = await validarAccessToken(accessToken, process.env.JWT_SECRET);
                req.user = payload;
                return next();
            } catch (error) {
                // Si el token expiró, intentamos renovarlo con el refresh token
                if (error.name === 'TokenExpiredError' && refreshToken) {
                    await renovarTokenUsuario(req, res, next, refreshToken);
                    return next();
                }
                // Para otros errores, continuamos con las siguientes verificaciones
            }
        }

        // 2. Intentar renovar con refreshToken si existe
        if (refreshToken && !req.user) {
            try {
                console.log('Intentando renovar token de usuario con refresh token');
                await renovarTokenUsuario(req, res, next, refreshToken);
                return next();
            } catch (error) {
                // Si falla, continuamos con las siguientes verificaciones
                console.error('Error al renovar token de usuario:', error.message);
            }
        }

        // 3. Verificar token de acceso de cliente
        if (accessTokenCliente) {
            try {
                const payloadCliente = await validarAccessToken(accessTokenCliente, process.env.CLIENTE_JWT_SECRET);
                req.user = payloadCliente;
                return next();
            } catch (error) {
                // Si el token expiró, intentamos renovarlo con el refresh token
                if (error.name === 'TokenExpiredError' && refreshTokenCliente) {
                    await renovarTokenCliente(req, res, next, refreshTokenCliente);
                    return next();
                }
                // Para otros errores, continuamos con las siguientes verificaciones
                console.error('Error de autenticación de cliente:', error.message);
            }
        }

        // 4. Intentar renovar con refreshTokenCliente si existe
        if (refreshTokenCliente && !req.user) {
            try {
                await renovarTokenCliente(req, res, next, refreshTokenCliente);
                return next();
            } catch (error) {
                console.error('Error al renovar el token del cliente:', error.message);
            }
        }

        // 5. Si llegamos aquí, no hay tokens válidos
        return res.render('login');

    } catch (error) {
        console.error('Error en la autenticación:', error.message);
        return res.render('login');
    }
}
// Rutas básicas
router.get('/', (req, res) => {
    res.render('index');
});

/**
 * Manejador de la ruta GET '/login'.
 * 
 * Si no hay sesión activa, redirige a la página de inicio de sesión.
 * Si hay una sesión activa, redirige al usuario a su sección correspondiente 
 * según su rol o documento.
 */
router.get('/login', verificarRenovarToken, (req, res) => {
    if (!req.user) {
        return res.render('login');
    }

    console.log(`Sesión activa: ${req.user}`);

    if (req.user.id_rol) {
        switch (req.user.id_rol) {
            case 1:
                return res.redirect('/administrador');
            case 2:
                return res.redirect('/soporte');
            case 3:
                return res.redirect('/tecnico');
            default:
                return res.render('login');
        }
    } else if (req.user.documento) {
        return res.redirect('/cliente');
    }

    return res.render('login');
});

router.get('/invitado', (req, res) => {
    res.render('invitado');
});

// Rutas protegidas por rol
router.get('/cliente', verificarRenovarToken, (req, res) => {
    // Validar el rol de usuario
    if (!req.user.documento) {
        return res.redirect('/login?mensaje=No tienes los permisos necesarios para ingresar aquí');
    }
    res.render('cliente');
});

router.get('/soporte', verificarRenovarToken, (req, res) => {
    // Validar el rol de usuario
    if (req.user.id_rol !== 2) {
        return res.redirect('/login?mensaje=No tienes los permisos necesarios para ingresar aquí');
    }
    res.render('soporte');
});

router.get('/administrador', verificarRenovarToken, (req, res) => {
    // Validar el rol de usuario
    if (req.user.id_rol !== 1) {
        return res.redirect('/login?mensaje=No tienes los permisos necesarios para ingresar aquí');
    }
    res.render('administrador', {
        nombresApellidos: `${req.user.nombres} ${req.user.apellidos}`,
    });
});

router.get('/tecnico', verificarRenovarToken, (req, res) => {
    // Validar el rol de usuario
    if (req.user.id_rol !== 3) {
        return res.redirect('/login?mensaje=No tienes los permisos necesarios para ingresar aquí');
    }
    res.render('tecnico');
});

/**
 * Valida las credenciales de un usuario y genera tokens de sesión
 */
router.post('/login/validarCredenciales', async (req, res) => {
    try {
        const { correo, password } = req.body;

        if (!correo || !password) {
            return res.status(400).json({ success: false, error: 'Faltan datos requeridos' });
        }

        // Consulta a la base de datos para buscar al usuario
        const usuario = await ejecutarConsulta('SELECT * FROM Personas WHERE correo = ?', [correo]);
        if (usuario.length === 0) {
            return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
        }
        // Validar que el usuario esté activo
        if (usuario[0].estado !== 'Activo') {
            return res.status(401).json({ success: false, error: 'El usuario ha sido inactivado, por favor, contacte al administrador.' });
        }

        let userDB = usuario[0];

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
            correo: userDB.correo,
            estado: userDB.estado,
            id_rol: userDB.id_rol,
        };

        // Generar tokens
        const accessToken = generarAccessToken(
            payload,
            process.env.JWT_SECRET,
            process.env.JWT_EXPIRES_IN
        );

        const refreshToken = generarRefreshToken(
            payload,
            process.env.JWT_REFRESH_SECRET,
            process.env.JWT_REFRESH_EXPIRES_IN
        );

        // Establecer cookies
        establecerCookieRespuesta(
            res,
            accessToken,
            refreshToken,
            cookieUsuario,
            cookieRefreshUsuario,
            parseInt(process.env.JWT_EXPIRES_IN.replace(/\D/g, '')) * 3600000,
            parseInt(process.env.JWT_REFRESH_EXPIRES_IN.replace(/\D/g, '')) * 86400000
        );

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

/**
 * Genera tokens de sesión para un cliente externo
 * Esta ruta simula la recepción de un cliente del sistema principal
 */
router.get('/obtener-token-cliente', async (req, res) => {
    try {
        // Simular payload del token cliente
        // En un caso real, este payload vendría del sistema principal
        const payload = {
            id_usuario: '11',
            id_empresa: '8',
            ruc_empresa: '12345678910',
            tipo_documento: 2,
            documento: '12345678',
            telefono: '123456789',
            fecha_conexion: new Date().toISOString(),
            asesor: '87654321',
        };

        // Generar tokens
        const accessTokenCliente = generarAccessToken(
            payload,
            process.env.CLIENTE_JWT_SECRET,
            process.env.CLIENTE_JWT_EXPIRES_IN
        );

        const refreshTokenCliente = generarRefreshToken(
            payload,
            process.env.CLIENTE_JWT_REFRESH_SECRET,
            process.env.CLIENTE_JWT_REFRESH_EXPIRES_IN
        );

        // Establecer cookies 
        establecerCookieRespuesta(
            res,
            accessTokenCliente,
            refreshTokenCliente,
            cookieCliente,
            cookieRefreshCliente,
            parseInt(process.env.CLIENTE_JWT_EXPIRES_IN.replace(/\D/g, '')) * 3600000,
            parseInt(process.env.CLIENTE_JWT_REFRESH_EXPIRES_IN.replace(/\D/g, '')) * 86400000
        );

        // Respuesta exitosa
        return res.status(200).json({
            success: true,
            message: 'Inicio de sesión exitoso',
        });

    } catch (error) {
        console.error("Error en /obtener-token-cliente:", error);
        return res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
});

/**
 * Renueva el token de acceso usando el refresh token
 */
router.post('/refresh-token', async (req, res, next) => {
    const refreshToken = req.cookies[cookieRefreshUsuario];
    const refreshTokenCliente = req.cookies[cookieRefreshCliente];

    // Si no hay ningún token, redirigir al login
    if (!refreshToken && !refreshTokenCliente) {
        return res.status(401).json({
            success: false,
            message: 'No hay token de refresco disponible'
        });
    }

    try {
        // Intentar renovar el token de usuario interno primero
        if (refreshToken) {
            try {
                await renovarTokenUsuario(req, res, next, refreshToken);
                return res.status(200).json({
                    success: true,
                    message: 'Token renovado exitosamente'
                });
            } catch (error) {
                // Si el refresh token ha expirado, intentar con el token de cliente
                if (error.name === 'TokenExpiredError' && refreshTokenCliente) {
                    console.log('Refresh token de usuario expirado, intentando con token de cliente');
                } else {
                    throw error; // Propagar el error si no hay token de cliente o es otro tipo de error
                }
            }
        }

        // Si no hay token de usuario interno o falló su renovación, intentar con el de cliente
        if (refreshTokenCliente) {
            try {
                await renovarTokenCliente(req, res, next, refreshTokenCliente);
                return res.status(200).json({
                    success: true,
                    message: 'Token de cliente renovado exitosamente'
                });
            } catch (error) {
                throw error;
            }
        }
    } catch (error) {
        console.error('Error al renovar el token:', error.message);

        // Mensaje personalizado según el tipo de error
        let mensaje = 'Error al renovar el token: ' + error.message;
        if (error.name === 'TokenExpiredError') {
            mensaje = 'La sesión ha expirado completamente. Por favor, inicia sesión nuevamente.';
        }

        return res.status(401).json({
            success: false,
            message: mensaje,
            errorType: error.name || 'Error'
        });
    }
});


/**
 * Manejador de la ruta POST '/logout'.
 * 
 * Este manejador se encarga de cerrar la sesión del usuario eliminando todas
 * las cookies de autenticación establecidas en el navegador. Una vez 
 * completado, responde al cliente con un mensaje de éxito o de error 
 * según el resultado de la operación.
 * 
 * @param {Object} req - Objeto de solicitud HTTP.
 * @param {Object} res - Objeto de respuesta HTTP.
 * 
 * @returns {void} - No retorna valor, pero envía una respuesta HTTP al cliente.
 */
router.post('/logout', (req, res) => {
    try {
        // Limpiar todas las cookies de autenticación
        res.clearCookie(cookieUsuario, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
        res.clearCookie(cookieCliente, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
        res.clearCookie(cookieRefreshUsuario, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
        res.clearCookie(cookieRefreshCliente, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });

        // Responder con éxito al cliente
        res.status(200).json({ success: true, message: 'Sesión cerrada correctamente.' });
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        res.status(500).json({ success: false, message: 'Error interno al cerrar sesión.' });
    }
});

/**
 * Genera un token de acceso para un usuario
 * @param {Object} payload - Datos del usuario para incluir en el token
 * @param {string} secret - Clave secreta para firmar el token
 * @param {string} expiresIn - Tiempo de expiración
 * @returns {string} Token JWT firmado
 */
const generarAccessToken = (payload, secret, expiresIn) => {
    return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Genera un token de refresco para un usuario
 * @param {Object} payload - Datos del usuario para incluir en el token
 * @param {string} secret - Clave secreta para firmar el token
 * @param {string} expiresIn - Tiempo de expiración
 * @returns {string} Token JWT firmado
 */
const generarRefreshToken = (payload, secret, expiresIn) => {
    // Aseguramos que el refresh token tenga una fecha de expiración más larga
    // Si no se proporciona expiresIn o es menor a 7 días, usamos 30 días por defecto
    const refreshExpiresIn = expiresIn || '30d';

    // Crear una copia del payload sin la fecha de expiración original
    const refreshPayload = { ...payload };

    return jwt.sign(refreshPayload, secret, { expiresIn: refreshExpiresIn });
};

/**
 * Establece cookies de autenticación en la respuesta HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 * @param {string} accessToken - Token de acceso
 * @param {string} refreshToken - Token de refresco
 * @param {string} nameToken - Nombre de la cookie de acceso
 * @param {string} refreshName - Nombre de la cookie de refresco
 * @param {number} accessMaxAge - Tiempo de vida de la cookie de acceso en milisegundos
 * @param {number} refreshMaxAge - Tiempo de vida de la cookie de refresco en milisegundos
 */
const establecerCookieRespuesta = (res, accessToken, refreshToken, nameToken = '', refreshName = '', accessMaxAge = 3600000, refreshMaxAge = 2592000000) => {

    res.cookie(nameToken, accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: accessMaxAge // Por defecto 1 hora
    });

    res.cookie(refreshName, refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: refreshMaxAge // Por defecto 30 días
    });
};

/**
 * Valida un token de acceso
 * @param {string} accessToken - Token de acceso a validar
 * @param {string} secret - Clave secreta para verificar el token
 * @returns {Object} Payload decodificado del token
 * @throws {Error} Si el token no es válido o ha expirado
 */
const validarAccessToken = async (accessToken, secret) => {
    if (!accessToken) {
        throw new Error('No se proporcionó el access token.');
    }
    return jwt.verify(accessToken, secret);
};

/**
 * Valida un token de refresco
 * @param {string} refreshToken - Token de refresco a validar
 * @param {string} secret - Clave secreta para verificar el token
 * @returns {Object} Payload decodificado del token
 * @throws {Error} Si el token no es válido o ha expirado
 */
const validarRefreshToken = async (refreshToken, secret) => {
    if (!refreshToken) {
        throw new Error('No se proporcionó el refresh token.');
    }
    return jwt.verify(refreshToken, secret);
};

/**
 * Renueva el token de un usuario interno usando su refresh token
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 * @param {Function} next - Función para pasar al siguiente middleware
 * @param {string} refreshToken - Token de refresco
 */
async function renovarTokenUsuario(req, res, next, refreshToken) {
    try {
        const payload = await validarRefreshToken(refreshToken, process.env.JWT_REFRESH_SECRET);

        if (!payload.id_rol) {
            throw new Error('Token de usuario inválido: falta id_rol');
        }

        const newAccessToken = generarAccessToken({
            dni: payload.dni,
            nombres: payload.nombres,
            apellidos: payload.apellidos,
            telefono: payload.telefono,
            usuario: payload.usuario,
            correo: payload.correo,
            estado: payload.estado,
            id_rol: payload.id_rol,
        }, process.env.JWT_SECRET, process.env.JWT_EXPIRES_IN);

        establecerCookieRespuesta(
            res,
            newAccessToken,
            refreshToken,
            cookieUsuario,
            cookieRefreshUsuario,
            parseInt(process.env.JWT_EXPIRES_IN.replace(/\D/g, '')) * 3600000
        );

        req.user = payload;
    } catch (error) {
        throw error;
    }
}

/**
 * Renueva el token de un cliente usando su refresh token
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 * @param {Function} next - Función para pasar al siguiente middleware
 * @param {string} refreshTokenCliente - Token de refresco del cliente
 */
async function renovarTokenCliente(req, res, next, refreshTokenCliente) {
    try {
        const payloadCliente = await validarRefreshToken(refreshTokenCliente, process.env.CLIENTE_JWT_REFRESH_SECRET);

        if (!payloadCliente.documento) {
            throw new Error('Token de cliente inválido: falta documento');
        }

        const newAccessTokenCliente = generarAccessToken({
            id_usuario: payloadCliente.id_usuario,
            id_empresa: payloadCliente.id_empresa,
            ruc_empresa: payloadCliente.ruc_empresa,
            tipo_documento: payloadCliente.tipo_documento,
            documento: payloadCliente.documento,
            telefono: payloadCliente.telefono,
            fecha_conexion: new Date().toISOString(),
            asesor: payloadCliente.asesor,
        }, process.env.CLIENTE_JWT_SECRET, process.env.CLIENTE_JWT_EXPIRES_IN);

        establecerCookieRespuesta(
            res,
            newAccessTokenCliente,
            refreshTokenCliente,
            cookieCliente,
            cookieRefreshCliente,
            parseInt(process.env.CLIENTE_JWT_EXPIRES_IN.replace(/\D/g, '')) * 3600000,
            parseInt(process.env.CLIENTE_JWT_REFRESH_EXPIRES_IN.replace(/\D/g, '')) * 86400000
        );

        req.user = payloadCliente;
    } catch (error) {
        throw error;
    }
}

module.exports = router;
