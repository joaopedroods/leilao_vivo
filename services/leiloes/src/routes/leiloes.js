const router = require('express').Router()
const auth = require('../middlewares/auth')
const {
  listarLeiloes,
  buscarLeilao,
  criarLeilao,
} = require('../controllers/leilaoController')

router.get('/leiloes',        listarLeiloes)
router.get('/:id',     buscarLeilao)
router.post('/leiloes', auth, criarLeilao)

module.exports = router