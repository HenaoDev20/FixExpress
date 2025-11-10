// =============================================
// RUTAS Y LÓGICA DEL SERVIDOR
// =============================================
const express = require('express');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const session = require("express-session");
const app = express();
const path = require('path');
const db = require('./bd'); // Conexión MySQL

// Puerto del servidor
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Sesiones
app.use(session({
  secret: "mi_secreto_seguro",
  resave: false,
  saveUninitialized: false
}));

// Archivos estáticos (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// =============================================
// RUTA PRINCIPAL → REGISTRO
// =============================================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'registro.html'));
});

// =============================================
// REGISTRO DE USUARIO
// =============================================
app.post('/registro', async (req, res) => {
  const { nombre, correo, password } = req.body;

  if (!nombre || !correo || !password) {
    return res.status(400).send('Todos los campos son obligatorios');
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

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

// =============================================
// REGISTRO DE TÉCNICO
// =============================================
app.post('/tecnico', (req, res) => {
  const { nombre, whatsapp, residencia, conocimientos } = req.body;

  if (!nombre || !whatsapp || !residencia || !conocimientos) {
    return res.status(400).send('Todos los campos son obligatorios');
  }

  const sql = `
    INSERT INTO tecnicos (nombre, whatsapp, residencia, conocimientos)
    VALUES (?, ?, ?, ?)
  `;

  db.query(sql, [nombre, whatsapp, residencia, conocimientos], (err, result) => {
    if (err) {
      console.error('Error al registrar el técnico:', err.sqlMessage || err);
      return res.status(500).send('Error al registrar el técnico: ' + (err.sqlMessage || err.message));
    }

    res.redirect('/directorio.html'); // Redirige a la página de éxito
  });
});


// =============================================
// API - OBTENER TODOS LOS TÉCNICOS (JSON)
// =============================================
app.get('/api/tecnicos', (req, res) => {
  const sql = 'SELECT * FROM tecnicos';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error al obtener los técnicos:', err.sqlMessage || err);
      return res.status(500).json({ error: 'Error al obtener los técnicos' });
    }
    res.json(results);
  });
});


// =============================================
// LOGIN
// =============================================
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

    res.redirect("/inicio");
  });
});

// =============================================
// RUTA PROTEGIDA PARA DASHBOARD
// =============================================
app.get("/inicio", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login.html");
  }
  res.sendFile(path.join(__dirname, "public", "inicio.html"));
});

// =============================================
// LOGOUT
// =============================================
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login.html");
  });
});

// =============================================
// INICIAR SERVIDOR
// =============================================
app.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
});
