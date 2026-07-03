const router = require('express').Router()
const auth = require('../middlewares/auth')
const {
  listarLeiloes,
  buscarLeilao,
  criarLeilao,
  meusLeiloes,
} = require('../controllers/leilaoController')

router.get('/',    listarLeiloes)
router.get('/:id', buscarLeilao)
router.post('/', auth, criarLeilao)
router.get('/meus', auth, meusLeiloes)

module.exports = router