// routes/routes.js}

const Router = require('express').Router;
const router = Router();
const jwt = require('jsonwebtoken');
const { comparePassword } = require('../utils/hash');
require('dotenv').config();

// Middleware para verificar tokens de sesión en las rutas
function verificarToken(req, res, next) {
    const token = req.cookies.jwt; // Obtener token de la cookie (parseado por cookie-parser)
    if (!token) {
        return res.redirect('/login?mensaje=Token no encontrado');
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = payload; // Adjunta datos del usuario al request
        next();
    } catch (error) {
        return res.redirect('/login?mensaje=Token inválido o expirado');
    }
}

router.get('/', (req, res) => {
    res.render('index');
    /* let sesion;

    if(req.cookies){
        if(req.cookies.sesion){
            sesion = JSON.parse(req.cookies.sesion);
        }
    }
    
    if(sesion){
        db.collection("personas").where('id', '==', sesion.id).get().then(persona=>{
            let usuario = persona.docs[0].data();

            if(usuario){
                if(usuario.rol=='1'){
                    res.redirect('/administrador');
                } else if(usuario.rol=='2'){
                    res.redirect('/vendedor');
                } else if(usuario.rol=='3'){
                    res.redirect('/cliente');
                } else {
                    res.redirect('/logout');
                }
            } else {
                res.redirect('/logout');
            }
        });
    } else {
        res.render('index');
    } */
});

router.get('/login', (req, res) => {
    res.render('login');

    // Verificar mediante una API si el usuario existe
    /* fetch('http://localhost:2000/login/validar-credenciales', {
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
        return res.status(403).json({ error: 'No tienes permiso para ingresar aquí' });
    }
    res.render('soporte');
});
router.get('/administrador', verificarToken, (req, res) => {
    // Validar el rol de usuario
    if (req.user.id_rol !== 1) {
        return res.status(403).json({ error: 'No tienes permiso para ingresar aquí' });
    }
    res.render('administrador');
});
router.get('/tecnico', verificarToken, (req, res) => {
    // Validar el rol de usuario
    if (req.user.id_rol !== 3) {
        return res.status(403).json({ error: 'No tienes permiso para ingresar aquí' });
    }
    res.render('tecnico');
});


module.exports = router;
