var express = require('express');
var router = express.Router();

/* GET home page (ahora muestra el Login de Yassin). */
router.get('/', function(req, res, next) {
  // Cambiamos 'index' por el nombre del archivo de tu vista de login
  res.render('login', { title: 'Iniciar Sesión' }); 
});

module.exports = router;