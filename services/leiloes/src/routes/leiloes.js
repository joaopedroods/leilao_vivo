const router = require('express').Router()
const auth = require('../middlewares/auth')
const {
  listarLeiloes,
  buscarLeilao,
  criarLeilao,
} = require('../controllers/leilaoController')

router.get('/',        listarLeiloes)
router.get('/:id',     buscarLeilao)
router.post('/', auth, criarLeilao)

module.exports = router