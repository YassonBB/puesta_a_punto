const express = require('express');
const router = express.Router();
const messageController = require('../controladores/messageController');
const { isAuthenticated } = require('../middleware/auth');

// Al montarlo en /mensajes en app.js, '/' equivale a '/mensajes'
router.get('/', isAuthenticated, messageController.getChat);
router.post('/enviar', isAuthenticated, messageController.sendMessage);

module.exports = router;