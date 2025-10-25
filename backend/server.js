// server.js
const express = require('express');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const app = express();

// Puerto en el que se ejecutará el servidor
const PORT = 3000;

// Middleware para leer datos del formulario
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Ruta principal
app.get('/', (req, res) => {
  res.send(' Servidor Express funcionando correctamente');
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
});
