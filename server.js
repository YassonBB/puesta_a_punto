const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();

// 1. Importar las rutas que han programado tus compañeros
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users'); // Óscar
const mensajesRouter = require('./routes/mensajes'); // Mario

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

// 5. Conexión a SQLite y CREACIÓN DEL ESQUEMA (Tu tarea de BD)
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) return console.error('Error al abrir la BD:', err.message);
    console.log('✅ Conectado a SQLite.');

    // db.serialize obliga a ejecutar las consultas paso a paso (una tras otra)
    db.serialize(() => {
        // 1. Crear las tablas
        db.run(`CREATE TABLE IF NOT EXISTS grupos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            password TEXT NOT NULL,
            rol TEXT NOT NULL,
            grupo_id INTEGER,
            foto_perfil TEXT,
            FOREIGN KEY(grupo_id) REFERENCES grupos(id)
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS mensajes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            contenido TEXT NOT NULL,
            emisor_id INTEGER,
            receptor_id INTEGER,
            FOREIGN KEY(emisor_id) REFERENCES usuarios(id),
            FOREIGN KEY(receptor_id) REFERENCES usuarios(id)
        )`, () => {
            console.log('Esquema de tablas verificado/creado.');
            
            // 2. Inyectar datos SÓLO después de confirmar que las tablas existen
            db.get("SELECT COUNT(*) as count FROM usuarios", (err, row) => {
                if (row && row.count === 0) {
                    db.run("INSERT INTO grupos (nombre) VALUES ('Grupo Alfa')", function(err) {
                        if (!err) {
                            db.run("INSERT INTO usuarios (nombre, password, rol, grupo_id) VALUES ('admin', '1234', 'admin', 1)");
                            db.run("INSERT INTO usuarios (nombre, password, rol, grupo_id) VALUES ('yassin', '1234', 'usuario', 1)", () => {
                                console.log('Datos de prueba inyectados (admin y yassin).');
                            });
                        }
                    });
                }
            });
        });
    });
});

// Asegurarnos de que el resto de rutas pueden usar la base de datos
app.set('db', db);

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

// Redirigir la raíz directamente al login
app.get('/', (req, res) => {
    res.redirect('/login');
});

// Cargar tu vista Pug de login
app.get('/login', (req, res) => {
    res.render('login', { title: 'Iniciar Sesión', error: null });
});

// Procesar el formulario
app.post('/login', (req, res) => {
    // Nota: Como en el login.pug pusimos username, lo capturamos como username
    const { username, password } = req.body;

    // Buscamos el usuario por el campo "nombre" (o cambias "nombre" por "username" en tu DB)
    db.get('SELECT * FROM usuarios WHERE nombre = ? AND password = ?', [username, password], (err, usuario) => {
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
            // Devuelve la misma vista Pug pero inyectando un mensaje de error
            res.render('login', { title: 'Iniciar Sesión', error: 'Credenciales incorrectas' });
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
    console.log(`🚀 Servidor unificado corriendo en http://localhost:${port}`);
});

// ==========================================
            // INYECCIÓN DE DATOS DE PRUEBA
            // ==========================================
            // 1. Creamos un grupo por defecto
            db.run(`INSERT OR IGNORE INTO grupos (id, nombre) VALUES (1, 'Grupo Alfa')`);

            // 2. Creamos el usuario Administrador (para Óscar)
            // Credenciales: admin / 1234
            db.run(`INSERT OR IGNORE INTO usuarios (id, nombre, password, rol, grupo_id) 
                    VALUES (1, 'admin', '1234', 'admin', 1)`);

            // 3. Creamos un usuario normal (para Mario)
            // Credenciales: yassin / 1234
            db.run(`INSERT OR IGNORE INTO usuarios (id, nombre, password, rol, grupo_id) 
                    VALUES (2, 'yassin', '1234', 'usuario', 1)`);
            
            console.log('✅ Datos de prueba inyectados (admin y yassin).');