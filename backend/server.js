//Rutas y lógica del servidor
const express = require('express');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const app = express();
const path = require('path');
const db = require('./bd'); // importa la conexión desde bd.js

// Puerto en el que se ejecutará el servidor
const PORT = 3000;

// Middleware para leer datos del formulario
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, 'public')));

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'registro.html'));
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
});

// Ruta para manejar el registro de usuario
app.post('/registro', async (req, res) => {
  console.log('Datos recibidos desde el formulario:', req.body);

  const { nombre, correo, password, confirmar } = req.body;

  // Validar campos
  if (!nombre || !correo || !password || !confirmar) {
    return res.status(400).send('Todos los campos son obligatorios');
  }

  if (password !== confirmar) {
    return res.status(400).send('Las contraseñas no coinciden');
  }

  try {
    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar datos en la tabla usuarios (sin confirmar)
    const sql = 'INSERT INTO usuarios (nombre, correo, password) VALUES (?, ?, ?)';
    db.query(sql, [nombre, correo, hashedPassword], (err, result) => {
      if (err) {
        console.error('Error al registrar el usuario:', err.sqlMessage || err);
        return res.status(500).send('Error al registrar usuario: ' + (err.sqlMessage || err.message));
      } else {
        console.log('Usuario registrado:', result);
        res.send('Registro exitoso. ¡Tu cuenta ha sido creada!');
      }
    });

  } catch (error) {
    console.error('Error en el proceso de registro:', error);
    res.status(500).send('Error interno del servidor');
  }
});
