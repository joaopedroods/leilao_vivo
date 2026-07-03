const pool = require('../db/pool');

async function salvarNotificacao(userId, texto) {
  await pool.query(
    `INSERT INTO notificacoes (user_id, texto) VALUES ($1, $2)`,
    [userId, texto]
  );
}

async function listarPorUsuario(userId) {
  const resultado = await pool.query(
    `SELECT id, texto, lida, criado_em AS "criadoEm"
     FROM notificacoes WHERE user_id = $1 ORDER BY criado_em DESC`,
    [userId]
  );
  return resultado.rows;
}

async function marcarTodasComoLidas(userId) {
  const resultado = await pool.query(
    `UPDATE notificacoes SET lida = TRUE WHERE user_id = $1 AND lida = FALSE`,
    [userId]
  );
  return resultado.rowCount;
}

module.exports = { salvarNotificacao, listarPorUsuario, marcarTodasComoLidas };
