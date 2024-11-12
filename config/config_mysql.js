/* import mysql from 'mysql'; */
var mysql = require('mysql');

var connection = mysql.createConnection({
    host: 'localhost',
    database: 'db_manual_innova',
    user: 'root',
    password: '',
})

connection.connect((err) =>{
    if (err) {
        console.error('Error al conectar la base de datos', err);
        throw err;        
    }
    console.log('Conexión a base de datos exitosa');
    
})


module.exports = connection;