// Configuración de la conexión a la base de datos
const mysql = require('mysql2');


const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '', 
  database: 'FixExpress' 
});

// Verificar conexión
db.connect((err) => {
  if (err) {
    console.error(' Error al conectar a MySQL:', err);
  } else {
    console.log(' Conexión exitosa con MySQL');
  }
});

module.exports = db;