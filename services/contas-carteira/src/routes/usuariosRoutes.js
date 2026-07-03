const express = require('express');
const { buscarPorId } = require('../controllers/usuariosController');
const autenticarServico = require('../middlewares/autenticarServico');

const router = express.Router();

router.get('/:userId', autenticarServico, buscarPorId);

module.exports = router;
