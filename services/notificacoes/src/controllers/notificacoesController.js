const { listarPorUsuario, marcarTodasComoLidas } = require('../services/notificacaoRepository');

async function listar(req, res) {
  try {
    const notificacoes = await listarPorUsuario(req.userId);
    return res.status(200).json({ notificacoes });
  } catch (err) {
    console.error('[notificacoesController.listar] erro:', err.message);
    return res.status(500).json({ erro: 'erro_interno' });
  }
}

async function marcarLidas(req, res) {
  try {
    const atualizadas = await marcarTodasComoLidas(req.userId);
    return res.status(200).json({ atualizadas });
  } catch (err) {
    console.error('[notificacoesController.marcarLidas] erro:', err.message);
    return res.status(500).json({ erro: 'erro_interno' });
  }
}

module.exports = { listar, marcarLidas };
