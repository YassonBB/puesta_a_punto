const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();

// 1. Importar las rutas que han programado tus compañeros
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const mensajesRouter = require('./routes/mensajes');

const app = express();
const port = 3000;

// 2. Configuración del motor de vistas (Pug)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// 3. Middlewares generales
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// 4. Configuración de sesiones para el login
app.use(session({
    secret: 'clave_secreta_proyecto',
    resave: false,
    saveUninitialized: true
}));

// 5. Conexión a la base de datos SQLite
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) console.error('Error al conectar a la base de datos:', err);
    else console.log('Conectado a SQLite.');
});

// Exponer la base de datos para que las rutas de Óscar y Mario puedan usarla
app.set('db', db);

// ==========================================
// MIDDLEWARES DE AUTENTICACIÓN
// ==========================================
function requiereAdmin(req, res, next) {
    if (req.session.usuario_id && req.session.rol === 'admin') {
        next();
    } else {
        res.status(403).send('Acceso denegado. Solo para administradores.');
    }
}

function requiereUsuario(req, res, next) {
    if (req.session.usuario_id && req.session.rol === 'usuario') {
        next();
    } else {
        res.redirect('/login');
    }
}

// ==========================================
// SISTEMA DE LOGIN
// ==========================================
app.get('/login', (req, res) => {
    res.send('<form method="POST" action="/login"><input name="nombre" placeholder="Usuario"><input type="password" name="password" placeholder="Contraseña"><button>Entrar</button></form>');
});

app.post('/login', (req, res) => {
    const { nombre, password } = req.body;

    db.get('SELECT * FROM usuarios WHERE nombre = ? AND password = ?', [nombre, password], (err, usuario) => {
        if (err) return res.status(500).send('Error en el servidor');
        
        if (usuario) {
            req.session.usuario_id = usuario.id;
            req.session.rol = usuario.rol;
            req.session.grupo_id = usuario.grupo_id;

            if (usuario.rol === 'admin') {
                res.redirect('/users'); // Redirige a la zona CRUD de Óscar
            } else {
                res.redirect('/mensajes'); // Redirige al chat de Mario
            }
        } else {
            res.send('Credenciales incorrectas <a href="/login">Volver</a>');
        }
    });
});

// ==========================================
// INTEGRACIÓN DE RUTAS DE COMPAÑEROS
// ==========================================
app.use('/', indexRouter);

// Protegemos la ruta /users con tu función requiereAdmin
app.use('/users', requiereAdmin, usersRouter);

// Protegemos la ruta /mensajes con tu función requiereUsuario
app.use('/mensajes', requiereUsuario, mensajesRouter);

// ==========================================
// MANEJO DE ERRORES Y 404
// ==========================================
app.use(function(req, res, next) {
  next(createError(404));
});

app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

// ==========================================
// ARRANQUE DEL SERVIDOR
// ==========================================
app.listen(port, () => {
    console.log(`Servidor unificado corriendo en http://localhost:${port}`);
});