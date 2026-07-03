const express = require('express');
// Adicionado o método 'sacar' vindo do controller
const { extrato, depositar, sacar, bloquear, liberar, debitar } = require('../controllers/carteiraController');
const autenticarUsuario = require('../middlewares/autenticarUsuario');
const autenticarServico = require('../middlewares/autenticarServico');

const router = express.Router();

router.get('/extrato', autenticarUsuario, extrato);
router.post('/depositar', autenticarUsuario, depositar);
router.post('/sacar', autenticarUsuario, sacar);

router.post('/bloquear', autenticarServico, bloquear);
router.post('/liberar', autenticarServico, liberar);
router.post('/debitar', autenticarServico, debitar);

module.exports = router;