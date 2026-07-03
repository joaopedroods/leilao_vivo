const express = require('express');
const { extrato, depositar, bloquear, liberar, debitar } = require('../controllers/carteiraController');
const autenticarUsuario = require('../middlewares/autenticarUsuario');
const autenticarServico = require('../middlewares/autenticarServico');

const router = express.Router();

router.get('/extrato', autenticarUsuario, extrato);
router.post('/depositar', autenticarUsuario, depositar);

router.post('/bloquear', autenticarServico, bloquear);
router.post('/liberar', autenticarServico, liberar);
router.post('/debitar', autenticarServico, debitar);

module.exports = router;
