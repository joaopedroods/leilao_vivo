const pool = require('../config/db')
const { encerrarLeilao } = require('./encerrador')

async function reconciliar(io) {
  try {
    // Busca leilões presos em "encerrando" há mais de 5 minutos
    const result = await pool.query(
      `SELECT * FROM leiloes
       WHERE status = 'encerrando'
       AND encerra_em < NOW() - INTERVAL '5 minutes'`
    )

    if (result.rows.length === 0) return

    console.log(`Reconciliador: ${result.rows.length} leilão(ões) preso(s) encontrado(s)`)

    for (const leilao of result.rows) {
      console.log(`Reconciliando leilão ${leilao.id}...`)
      await encerrarLeilao(leilao.id, io)
    }

  } catch (err) {
    console.error('Erro no reconciliador:', err)
  }
}

function iniciarReconciliador(io) {
  // Roda a cada 5 minutos
  setInterval(() => reconciliar(io), 5 * 60 * 1000)
  console.log('Reconciliador iniciado')
}

module.exports = { iniciarReconciliador }