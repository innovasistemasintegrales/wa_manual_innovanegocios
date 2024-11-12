const connection = require('./config/config_mysql');

/* Este componente sirve  para levantar o iniciar el sevidor */
const app = require('./app');
const server = app.listen(app.get('port'));
//Websockets
const socketIO = require('socket.io');
/* const connection = require('express-myconnection'); */
const io = socketIO(server);

io.of('/index').on('connection', (socket)=>{

});
io.of('/login').on('connection', (socket)=>{

});
io.of('/administrador').on('connection', (socket)=>{

});
io.of('/soporte').on('connection', (socket)=>{

});
io.of('/tecnico').on('connection', (socket)=>{

});

/* SERVIDOR DE COSULTA A DB CON SOCKET PARA EL LADO CLIENTE (backend) */
io.of('/cliente').on('connection', (socket)=>{

    /* Listar titulos */
    connection.query('SELECT * from titulos',(err, results) =>{
        if (err) {
            console.error('Error en la consulta:', err);
        }
        let listadoGeneralTitulos
        for (let i = 0; i < results.length; i++) {
            listadoGeneralTitulos = results[i];
        }
        
        io.of('/cliente').to(socket.id).emit('/cliente/listarTitulo', listadoGeneralTitulos)
    })

    /* Editar titulos */

    /* Resgitrar titulos */
});
io.of('/invitado').on('connection', (socket)=>{

});



console.log('Servidor inicializado en puerto', app.get('port'));
console.log(connection);

