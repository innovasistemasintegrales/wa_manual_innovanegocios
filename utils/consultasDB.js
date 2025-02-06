const pool = require('../config/config_mysql.js'); // Conexión a la base de datos    

// Función genérica para consultas a la base de datos
const ejecutarConsulta = async (query, params = []) => {
  try {
    const [results] = await pool.query(query, params);
    return results;
  } catch (error) {
    console.error('Error al ejecutar la consulta:', error);
    throw error;
  }
};

// Exportar
module.exports = ejecutarConsulta;
