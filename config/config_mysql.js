const mysql = require('mysql2/promise');

// Crear un pool de conexiones
const pool = mysql.createPool({
    host: 'localhost',
    database: 'db_manual_innova',
    user: 'root',
    password: '',
    waitForConnections: true,
    connectionLimit: 10, // Máximo número de conexiones simultáneas
    queueLimit: 0 // Sin límite de solicitudes en la cola
});

(async () => {
    try {
        // Realizar una consulta simple para verificar la conexión
        await pool.query('SELECT 1');
        console.log('Conexión a la base de datos exitosa');
        console.log(pool)
    } catch (error) {
        console.error('Error al conectar a la base de datos:', error);
        process.exit(1); // Finalizar la aplicación si la conexión falla
    }
})();


// Exportar el pool para usarlo en otros módulos
module.exports = pool;
