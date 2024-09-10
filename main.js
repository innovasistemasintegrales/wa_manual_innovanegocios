/* Este componente sirve  para levantar o iniciar el sevidor */
const app = require('./app');
const server = app.listen(app.get('port'));
//Websockets
const socketIO = require('socket.io');
const io = socketIO(server);

console.log('Servidor inicializado en puerto', app.get('port'));
