const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
require('dotenv').config()

const pool = require('./config/db')
const redis = require('./config/redis')

const app = express()
const server = http.createServer(app)
const io = new Server(server, { cors: { origin: '*' } })

app.use(cors())
app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ status: 'ok', servico: 'leiloes' })
})

io.on('connection', (socket) => {
  console.log('cliente conectado:', socket.id)
  socket.on('disconnect', () => {
    console.log('cliente desconectado:', socket.id)
  })
})

pool.query('SELECT NOW()', (err, res) => {
  if (err) console.error('Erro ao conectar no banco:', err)
  else console.log('Banco conectado:', res.rows[0].now)
})

const PORT = process.env.PORT || 3001
const leiloesRoutes = require('./routes/leiloes')
app.use('/leiloes', leiloesRoutes)
server.listen(PORT, () => {
  console.log(`Serviço de Leilões rodando na porta ${PORT}`)
})