const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

// Crear un pool de conexiones
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'db_manual_innova',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    waitForConnections: true,
    connectionLimit: 20, // Máximo número de conexiones simultáneas antes de entrar en cola
    queueLimit: 0 // 0 (sin limite) para no limitar la cantidad de consultas en cola
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

module.exports = pool;
