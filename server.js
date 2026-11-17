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

// Ruta GET para mostrar el formulario HTML
app.get('/login', (req, res) => {
    // Aquí puedes enviar un archivo HTML con res.sendFile()
    res.send('<form method="POST" action="/login"><input name="nombre" placeholder="Usuario"><input type="password" name="password" placeholder="Contraseña"><button>Entrar</button></form>');
});

// Ruta POST para procesar el login
app.post('/login', (req, res) => {
    const { nombre, password } = req.body;

    db.get('SELECT * FROM usuarios WHERE nombre = ? AND password = ?', [nombre, password], (err, usuario) => {
        if (err) return res.status(500).send('Error en el servidor');
        
        if (usuario) {
            // Guardar datos del usuario en la sesión
            req.session.usuario_id = usuario.id;
            req.session.rol = usuario.rol;
            req.session.grupo_id = usuario.grupo_id;

            // Redirección basada en el rol
            if (usuario.rol === 'admin') {
                res.redirect('/admin/panel'); // Ruta que programará Óscar
            } else {
                res.redirect('/chat'); // Ruta que programará Mario
            }
        } else {
            res.send('Credenciales incorrectas <a href="/login">Volver</a>');
        }
    });
});
// Middleware para proteger las rutas del administrador
function requiereAdmin(req, res, next) {
    if (req.session.usuario_id && req.session.rol === 'admin') {
        next(); // Tiene permiso, continúa a la ruta de Óscar
    } else {
        res.status(403).send('Acceso denegado. Solo para administradores.');
    }
}

// Middleware para proteger las rutas de los usuarios normales
function requiereUsuario(req, res, next) {
    if (req.session.usuario_id && req.session.rol === 'usuario') {
        next(); // Tiene permiso, continúa a la ruta de Mario
    } else {
        res.redirect('/login');
    }
}

// Ejemplo de cómo Óscar o Mario usarán tus middlewares en sus rutas:
app.get('/admin/panel', requiereAdmin, (req, res) => {
    res.send('Bienvenido Administrador'); 
});

app.get('/chat', requiereUsuario, (req, res) => {
    res.send(`Bienvenido al chat de tu grupo: ${req.session.grupo_id}`);
});