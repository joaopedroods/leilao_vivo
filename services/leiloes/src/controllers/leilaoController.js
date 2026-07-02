const pool = require('../config/db')

async function listarLeiloes(req, res) {
  try {
    const { status } = req.query
    let query = 'SELECT * FROM leiloes ORDER BY criado_em DESC'
    const params = []

    if (status) {
      query = 'SELECT * FROM leiloes WHERE status = $1 ORDER BY criado_em DESC'
      params.push(status)
    }

    const result = await pool.query(query, params)
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'erro_interno' })
  }
}

async function buscarLeilao(req, res) {
  try {
    const { id } = req.params

    const leilao = await pool.query(
      'SELECT * FROM leiloes WHERE id = $1',
      [id]
    )

    if (leilao.rows.length === 0) {
      return res.status(404).json({ erro: 'leilao_nao_encontrado' })
    }

    const lances = await pool.query(
      'SELECT * FROM lances WHERE leilao_id = $1 ORDER BY criado_em DESC',
      [id]
    )

    res.json({ ...leilao.rows[0], lances: lances.rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'erro_interno' })
  }
}

async function criarLeilao(req, res) {
  try {
    const { titulo, descricao, lance_minimo, duracao_minutos } = req.body
    const vendedor_id = req.userId

    if (!titulo || !lance_minimo || !duracao_minutos) {
      return res.status(400).json({ erro: 'campos_obrigatorios' })
    }

    const encerra_em = new Date(Date.now() + duracao_minutos * 60 * 1000)

    const result = await pool.query(
      `INSERT INTO leiloes (vendedor_id, titulo, descricao, lance_minimo, lance_atual, encerra_em)
       VALUES ($1, $2, $3, $4, $4, $5)
       RETURNING *`,
      [vendedor_id, titulo, descricao, lance_minimo, encerra_em]
    )

    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'erro_interno' })
  }
}

module.exports = { listarLeiloes, buscarLeilao, criarLeilao }