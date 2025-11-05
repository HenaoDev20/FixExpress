// Rutas y lógica del servidor
const express = require('express');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const session = require("express-session");
const app = express();
const path = require('path');
const db = require('./bd'); // Conexión MySQL

// Puerto en el que se ejecutará el servidor
const PORT = 3000;

// Middleware para leer datos del formulario
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Sesiones
app.use(session({
  secret: "mi_secreto_seguro",
  resave: false,
  saveUninitialized: false
}));

// Archivo estáticos (HTML, CSS)
app.use(express.static(path.join(__dirname, 'public')));

// Ruta principal → Registro
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'registro.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
});


//  REGISTRO DE USUARIO
app.post('/registro', async (req, res) => {
  const { nombre, correo, password } = req.body;

  // Validar campos
  if (!nombre || !correo || !password) {
    return res.status(400).send('Todos los campos son obligatorios');
  }

  try {
    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar en tabla usuarios
    const sql = 'INSERT INTO usuarios (nombre, correo, password) VALUES (?, ?, ?)';
    db.query(sql, [nombre, correo, hashedPassword], (err, result) => {
      if (err) {
        console.error('Error al registrar el usuario:', err.sqlMessage || err);
        return res.status(500).send('Error al registrar usuario: ' + (err.sqlMessage || err.message));
      }
      res.redirect("/login.html");
    });

  } catch (error) {
    console.error('Error en el proceso de registro:', error);
    res.status(500).send('Error interno del servidor');
  }
});


//  LOGIN
app.post("/login", (req, res) => {
  const { correo, password } = req.body;

  if (!correo || !password) {
    return res.status(400).send("Todos los campos son obligatorios");
  }

  const sql = "SELECT * FROM usuarios WHERE correo = ?";
  db.query(sql, [correo], async (err, results) => {
    if (err) return res.status(500).send("Error en servidor");

    if (results.length === 0) {
      return res.status(401).send("Correo no registrado");
    }

    const user = results[0];

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).send("Contraseña incorrecta");
    }

    // Guardar sesión
    req.session.user = { id: user.id, nombre: user.nombre };

    // Registrar inicio en tabla login
    db.query("INSERT INTO login (usuario_id) VALUES (?)", [user.id]);

    res.redirect("/dashboard");
  });
});


//  RUTA PROTEGIDA PARA DASHBOARD
app.get("/dashboard", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login.html");
  }
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});


//  LOGOUT
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login.html");
  });
});
