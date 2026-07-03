const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
require('dotenv').config()

const pool = require('./config/db')
const redis = require('./config/redis')
const { conectar: conectarRabbitMQ } = require('./config/rabbitmq')

const app = express()
const server = http.createServer(app)
const io = new Server(server, { cors: { origin: '*' } })

app.use(cors())
app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ status: 'ok', servico: 'leiloes' })
})

const leiloesRoutes = require('./routes/leiloes')
app.use('/leiloes', leiloesRoutes)

const leilaoSocket = require('./socket/leilaoSocket')
leilaoSocket(io)

pool.query('SELECT NOW()', (err, res) => {
  if (err) console.error('Erro ao conectar no banco:', err)
  else console.log('Banco conectado:', res.rows[0].now)
})

const PORT = process.env.PORT || 3001
server.listen(PORT, async () => {
  console.log(`Serviço de Leilões rodando na porta ${PORT}`)
  await conectarRabbitMQ()

  // Reagenda leilões ativos ao reiniciar o servidor
  const { agendarEncerramento } = require('./jobs/encerrador')
  const leiloes = await pool.query(
    `SELECT * FROM leiloes WHERE status = 'ativo' AND encerra_em > NOW()`
  )
  leiloes.rows.forEach(l => agendarEncerramento(l, io))
  console.log(`${leiloes.rows.length} leilão(ões) reagendado(s)`)
})

const { setIO } = require('./controllers/leilaoController')
setIO(io)