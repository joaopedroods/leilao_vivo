const pool = require('../db/pool');

async function buscarPorId(req, res) {
  const { userId } = req.params;

  try {
    const resultado = await pool.query('SELECT id, nome, email FROM users WHERE id = $1', [userId]);
    const usuario = resultado.rows[0];

    if (!usuario) {
      return res.status(404).json({ erro: 'usuario_nao_encontrado' });
    }

    return res.status(200).json({
      userId: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
    });
  } catch (err) {
    console.error('[usuariosController.buscarPorId] erro:', err.message);
    return res.status(500).json({ erro: 'erro_interno' });
  }
}

module.exports = { buscarPorId };
