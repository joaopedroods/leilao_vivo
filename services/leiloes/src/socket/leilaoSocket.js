const redis = require('../config/redis')
const pool = require('../config/db')
const jwt = require('jsonwebtoken')
require('dotenv').config()

module.exports = function leilaoSocket(io) {

  io.use((socket, next) => {
    const token = socket.handshake.auth.token
    if (!token) return next(new Error('token_ausente'))
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET)
      socket.userId = payload.userId
      next()
    } catch {
      next(new Error('token_invalido'))
    }
  })

  io.on('connection', (socket) => {
    console.log('cliente conectado:', socket.id)

    // Entrar num leilão
    socket.on('entrar_leilao', async (leilaoId) => {
      socket.join(`leilao:${leilaoId}`)

      // Busca estado atual do Redis ou do banco
      let estado = await redis.get(`leilao:${leilaoId}`)
      if (estado) {
        estado = JSON.parse(estado)
      } else {
        const result = await pool.query(
          'SELECT * FROM leiloes WHERE id = $1',
          [leilaoId]
        )
        if (result.rows.length === 0) {
          socket.emit('erro', { mensagem: 'leilao_nao_encontrado' })
          return
        }
        const leilao = result.rows[0]
        estado = {
          leilaoId,
          lanceAtual: parseFloat(leilao.lance_atual),
          vencedorId: leilao.vencedor_id,
          status: leilao.status,
          encerra_em: leilao.encerra_em,
        }
        await redis.set(`leilao:${leilaoId}`, JSON.stringify(estado))
      }

      socket.emit('estado_atual', estado)
    })

    // Receber lance
    socket.on('dar_lance', async ({ leilaoId, valor }) => {
      const userId = socket.userId

      try {
        // Busca o estado atual do banco (fonte da verdade)
        const result = await pool.query(
          'SELECT * FROM leiloes WHERE id = $1',
          [leilaoId]
        )

        if (result.rows.length === 0) {
          socket.emit('erro', { mensagem: 'leilao_nao_encontrado' })
          return
        }

        const leilao = result.rows[0]

        if (leilao.status !== 'ativo') {
          socket.emit('lance_rejeitado', { motivo: 'leilao_encerrado' })
          return
        }

        if (valor <= parseFloat(leilao.lance_atual)) {
          socket.emit('lance_rejeitado', { motivo: 'valor_insuficiente' })
          return
        }

        // Optimistic locking
        const update = await pool.query(
          `UPDATE leiloes
           SET lance_atual = $1, vencedor_id = $2
           WHERE id = $3 AND lance_atual = $4
           RETURNING *`,
          [valor, userId, leilaoId, leilao.lance_atual]
        )

        if (update.rowCount === 0) {
          socket.emit('lance_rejeitado', { motivo: 'race_condition' })
          return
        }

        // Registra o lance no histórico
        await pool.query(
          'INSERT INTO lances (leilao_id, usuario_id, valor) VALUES ($1, $2, $3)',
          [leilaoId, userId, valor]
        )

        // Atualiza Redis
        const novoEstado = {
          leilaoId,
          lanceAtual: valor,
          vencedorId: userId,
          status: 'ativo',
          encerra_em: leilao.encerra_em,
        }
        await redis.set(`leilao:${leilaoId}`, JSON.stringify(novoEstado))

        // Broadcast para todos na room
        io.to(`leilao:${leilaoId}`).emit('lance_aceito', {
          leilaoId,
          valor,
          usuarioId: userId,
          timestamp: new Date().toISOString(),
        })

      } catch (err) {
        console.error('Erro ao processar lance:', err)
        socket.emit('erro', { mensagem: 'erro_interno' })
      }
    })

    socket.on('disconnect', () => {
      console.log('cliente desconectado:', socket.id)
    })
  })
}