const express = require('express');
const { listar, marcarLidas } = require('../controllers/notificacoesController');
const autenticarUsuario = require('../middlewares/autenticarUsuario');

const router = express.Router();

router.get('/', autenticarUsuario, listar);
router.patch('/marcar-lidas', autenticarUsuario, marcarLidas);

module.exports = router;
