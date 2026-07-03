const redis = require('../config/redis')
const pool = require('../config/db')
const jwt = require('jsonwebtoken')
const axios = require('axios')
require('dotenv').config()

const carteiraEnabled = process.env.CARTEIRA_ENABLED === 'true'
const serviceHeaders = () => ({ 'x-service-key': process.env.SERVICE_KEY })

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

    socket.on('entrar_leilao', async (leilaoId) => {
      socket.join(`leilao:${leilaoId}`)

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

    socket.on('dar_lance', async ({ leilaoId, valor }) => {
      const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!leilaoId || !UUID_REGEX.test(leilaoId)) {
        socket.emit('erro', { mensagem: 'leilao_invalido' })
        return
      }
      if (!valor || isNaN(valor) || valor <= 0) {
        socket.emit('erro', { mensagem: 'valor_invalido' })
        return
      }

      const userId = socket.userId

      try {
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

        // Bloqueia saldo na Carteira (se habilitado)
        let bloqueioId = null
        if (carteiraEnabled) {
          try {
            const resposta = await axios.post(
              `${process.env.CARTEIRA_URL}/carteira/bloquear`,
              { userId, valor, leilaoId },
              { headers: serviceHeaders() }
            )
            bloqueioId = resposta.data.bloqueioId
          } catch (err) {
            if (err.response?.data?.erro === 'saldo_insuficiente') {
              socket.emit('lance_rejeitado', { motivo: 'saldo_insuficiente' })
            } else {
              socket.emit('erro', { mensagem: 'erro_ao_bloquear_saldo' })
            }
            return
          }
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
          if (carteiraEnabled && bloqueioId) {
            await axios.post(
              `${process.env.CARTEIRA_URL}/carteira/liberar`,
              { bloqueioId },
              { headers: serviceHeaders() }
            )
          }
          socket.emit('lance_rejeitado', { motivo: 'race_condition' })
          return
        }

        // Registra o lance no histórico
        await pool.query(
          'INSERT INTO lances (leilao_id, usuario_id, valor) VALUES ($1, $2, $3)',
          [leilaoId, userId, valor]
        )

        // Salva bloqueioId no Redis e libera o ex-líder
        if (carteiraEnabled && bloqueioId) {
          await redis.set(`bloqueio:${leilaoId}:${userId}`, bloqueioId)

          const exLider = leilao.vencedor_id
          if (exLider && exLider !== userId) {
            const bloqueioAnterior = await redis.get(`bloqueio:${leilaoId}:${exLider}`)
            if (bloqueioAnterior) {
              try {
                await axios.post(
                  `${process.env.CARTEIRA_URL}/carteira/liberar`,
                  { bloqueioId: bloqueioAnterior },
                  { headers: serviceHeaders() }
                )
              } catch (err) {
                console.error('Erro ao liberar bloqueio do ex-líder:', err.message)
              }
            }
          }
        }

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