const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Configuración de Multer para la subida de fotos de perfil
const storage = multer.diskStorage({
    destination: path.join(__dirname, '../public/uploads/'),
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

// Cargar panel de control
router.get('/', (req, res) => {
    const db = req.app.get('db');
    
    // Traer todos los grupos
    db.all('SELECT * FROM grupos', [], (err, grupos) => {
        // Traer todos los usuarios y el nombre de su grupo
        db.all(`
            SELECT usuarios.*, grupos.nombre as grupo_nombre 
            FROM usuarios 
            LEFT JOIN grupos ON usuarios.grupo_id = grupos.id
        `, [], (err, usuarios) => {
            res.render('admin', { title: 'Panel de Administración', grupos, usuarios });
        });
    });
});

// Crear un grupo nuevo
router.post('/grupos', (req, res) => {
    const db = req.app.get('db');
    db.run('INSERT INTO grupos (nombre) VALUES (?)', [req.body.nombre], () => res.redirect('/users'));
});

// Alta de Usuario con foto
router.post('/crear', upload.single('foto'), (req, res) => {
    const db = req.app.get('db');
    const { nombre, password, rol, grupo_id } = req.body;
    const foto_perfil = req.file ? '/uploads/' + req.file.filename : null;

    db.run('INSERT INTO usuarios (nombre, password, rol, grupo_id, foto_perfil) VALUES (?, ?, ?, ?, ?)', 
        [nombre, password, rol, grupo_id, foto_perfil], 
        () => res.redirect('/users')
    );
});

// Baja de Usuario (Protegida contra borrado de administradores)
router.post('/eliminar/:id', (req, res) => {
    const db = req.app.get('db');
    // Añadida la condición AND rol != 'admin' por seguridad en el backend
    db.run("DELETE FROM usuarios WHERE id = ? AND rol != 'admin'", [req.params.id], () => res.redirect('/users'));
});

module.exports = router;