const { Router } = require('express');
const router =  Router();

router.get('/', (req,res) => {
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

router.get('/login', (req,res) =>{
    res.render('login');
});

module.exports = router;
