const pool = require('../config/db')
const redis = require('../config/redis')
const { publicar } = require('../config/rabbitmq')
const axios = require('axios')
require('dotenv').config()

async function encerrarLeilao(leilaoId, io) {
  try {
    // Marca como "encerrando" (estado intermediário da Saga)
    const result = await pool.query(
      `UPDATE leiloes SET status = 'encerrando'
       WHERE id = $1 AND status = 'ativo'
       RETURNING *`,
      [leilaoId]
    )

    if (result.rowCount === 0) return // já foi encerrado ou não existe

    const leilao = result.rows[0]
    const temVencedor = leilao.vencedor_id !== null

    if (temVencedor) {
      // Busca o bloqueioId do vencedor no Redis
      const bloqueioId = await redis.get(`bloqueio:${leilaoId}:${leilao.vencedor_id}`)

      try {
        // Debita o vencedor
        await axios.post(`${process.env.CARTEIRA_URL}/carteira/debitar`, {
          bloqueioId
        })

        // Libera os bloqueios dos perdedores
        await liberarPerdedores(leilaoId, leilao.vencedor_id)

        // Marca como encerrado
        await pool.query(
          `UPDATE leiloes SET status = 'encerrado' WHERE id = $1`,
          [leilaoId]
        )

        // Publica evento de encerramento
        await publicar({
          evento: 'leilao_encerrado',
          vencedorId: leilao.vencedor_id,
          vendedorId: leilao.vendedor_id,
          leilaoId,
          nomeItem: leilao.titulo,
          valorFinal: parseFloat(leilao.lance_atual)
        })

      } catch (err) {
        // Saga de compensação: debitar falhou
        console.error('Falha ao debitar vencedor, executando compensação:', err.message)

        await liberarTodos(leilaoId)

        await pool.query(
          `UPDATE leiloes SET status = 'erro_pagamento' WHERE id = $1`,
          [leilaoId]
        )

        await publicar({
          evento: 'leilao_encerrado_sem_vencedor',
          vendedorId: leilao.vendedor_id,
          leilaoId,
          nomeItem: leilao.titulo
        })
      }

    } else {
      // Nenhum lance — encerra sem vencedor
      await pool.query(
        `UPDATE leiloes SET status = 'encerrado' WHERE id = $1`,
        [leilaoId]
      )

      await publicar({
        evento: 'leilao_encerrado_sem_vencedor',
        vendedorId: leilao.vendedor_id,
        leilaoId,
        nomeItem: leilao.titulo
      })
    }

    // Atualiza Redis e notifica clientes
    await redis.del(`leilao:${leilaoId}`)
    io.to(`leilao:${leilaoId}`).emit('leilao_encerrado', {
      leilaoId,
      vencedorId: leilao.vencedor_id,
      valorFinal: parseFloat(leilao.lance_atual)
    })

    console.log(`Leilão ${leilaoId} encerrado.`)

  } catch (err) {
    console.error(`Erro ao encerrar leilão ${leilaoId}:`, err)
  }
}

async function liberarPerdedores(leilaoId, vencedorId) {
  const perdedores = await pool.query(
    `SELECT DISTINCT usuario_id FROM lances
     WHERE leilao_id = $1 AND usuario_id != $2`,
    [leilaoId, vencedorId]
  )

  for (const row of perdedores.rows) {
    const bloqueioId = await redis.get(`bloqueio:${leilaoId}:${row.usuario_id}`)
    if (bloqueioId) {
      await axios.post(`${process.env.CARTEIRA_URL}/carteira/liberar`, { bloqueioId })
    }
  }
}

async function liberarTodos(leilaoId) {
  const participantes = await pool.query(
    `SELECT DISTINCT usuario_id FROM lances WHERE leilao_id = $1`,
    [leilaoId]
  )

  for (const row of participantes.rows) {
    const bloqueioId = await redis.get(`bloqueio:${leilaoId}:${row.usuario_id}`)
    if (bloqueioId) {
      await axios.post(`${process.env.CARTEIRA_URL}/carteira/liberar`, { bloqueioId })
    }
  }
}

function agendarEncerramento(leilao, io) {
  const agora = Date.now()
  const encerra_em = new Date(leilao.encerra_em).getTime()
  const delay = Math.max(0, encerra_em - agora)

  console.log(`Leilão ${leilao.id} encerrará em ${Math.round(delay / 1000)}s`)

  setTimeout(() => encerrarLeilao(leilao.id, io), delay)
}

module.exports = { agendarEncerramento, encerrarLeilao }