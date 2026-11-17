const express = require('express');
const router = express.Router();

// Mostrar la interfaz del chat
router.get('/', (req, res) => {
    const db = req.app.get('db');
    const mi_id = req.session.usuario_id;
    const grupo_id = req.session.grupo_id;

    // Obtener usuarios que pertenecen al MISMO grupo
    db.all('SELECT * FROM usuarios WHERE grupo_id = ?', [grupo_id], (err, usuarios) => {
        if (err) return res.status(500).send("Error de BD");
        
        // Obtener los mensajes donde el emisor y receptor sean de ese grupo
        const queryMensajes = `
            SELECT m.*, e.nombre as emisor_nombre 
            FROM mensajes m
            JOIN usuarios e ON m.emisor_id = e.id
            JOIN usuarios r ON m.receptor_id = r.id
            WHERE e.grupo_id = ? AND r.grupo_id = ?
            ORDER BY m.id ASC
        `;
        
        db.all(queryMensajes, [grupo_id, grupo_id], (err, mensajes) => {
            res.render('chat', { title: 'Mensajería del Grupo', usuarios, mensajes, mi_id });
        });
    });
});

// Procesar el envío de un mensaje
router.post('/', (req, res) => {
    const db = req.app.get('db');
    const emisor_id = req.session.usuario_id;
    const { receptor_id, contenido } = req.body;

    db.run('INSERT INTO mensajes (contenido, emisor_id, receptor_id) VALUES (?, ?, ?)', 
        [contenido, emisor_id, receptor_id], 
        (err) => {
            res.redirect('/mensajes'); // Recarga el chat
        }
    );
});

module.exports = router;