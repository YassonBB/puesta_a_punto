const express = require('express');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const port = 3000;

// Configuración para leer datos de formularios y JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configuración de sesiones para el login
app.use(session({
    secret: 'clave_secreta_proyecto',
    resave: false,
    saveUninitialized: true
}));

// Conexión a la base de datos SQLite
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) console.error('Error al conectar a la base de datos:', err);
    else console.log('Conectado a SQLite.');
});

// Exponer la base de datos para que Óscar y Mario la usen en sus rutas
app.set('db', db);

app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});