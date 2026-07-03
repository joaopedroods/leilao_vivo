const pool = require('../db/pool');

async function extrato(req, res) {
  const { userId } = req;

  try {
    const carteiraResult = await pool.query(
      'SELECT saldo_disponivel, saldo_bloqueado FROM carteiras WHERE user_id = $1',
      [userId]
    );
    const carteira = carteiraResult.rows[0];

    if (!carteira) {
      return res.status(404).json({ erro: 'usuario_nao_encontrado' });
    }

    const transacoesResult = await pool.query(
      `SELECT id, tipo, valor, descricao, criado_em AS "criadoEm"
       FROM transacoes WHERE user_id = $1 ORDER BY criado_em DESC`,
      [userId]
    );

    return res.status(200).json({
      saldoDisponivel: Number(carteira.saldo_disponivel),
      saldoBloqueado: Number(carteira.saldo_bloqueado),
      transacoes: transacoesResult.rows,
    });
  } catch (err) {
    console.error('[carteiraController.extrato] erro:', err.message);
    return res.status(500).json({ erro: 'erro_interno' });
  }
}

async function depositar(req, res) {
  const { userId } = req;
  const { valor } = req.body;

  if (!valor || Number(valor) <= 0) {
    return res.status(400).json({ erro: 'dados_invalidos' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const atualizado = await client.query(
      `UPDATE carteiras SET saldo_disponivel = saldo_disponivel + $1
       WHERE user_id = $2 RETURNING saldo_disponivel`,
      [valor, userId]
    );

    if (atualizado.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ erro: 'usuario_nao_encontrado' });
    }

    await client.query(
      `INSERT INTO transacoes (user_id, tipo, valor, descricao) VALUES ($1, 'deposito', $2, $3)`,
      [userId, valor, 'Deposito via PIX']
    );

    await client.query('COMMIT');

    return res.status(200).json({
      saldoDisponivel: Number(atualizado.rows[0].saldo_disponivel),
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[carteiraController.depositar] erro:', err.message);
    return res.status(500).json({ erro: 'erro_interno' });
  } finally {
    client.release();
  }
}

async function bloquear(req, res) {
  const { userId, valor, leilaoId } = req.body;

  if (!userId || !valor || Number(valor) <= 0 || !leilaoId) {
    return res.status(400).json({ erro: 'dados_invalidos' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const carteiraResult = await client.query(
      'SELECT saldo_disponivel FROM carteiras WHERE user_id = $1 FOR UPDATE',
      [userId]
    );
    const carteira = carteiraResult.rows[0];

    if (!carteira) {
      await client.query('ROLLBACK');
      return res.status(404).json({ erro: 'usuario_nao_encontrado' });
    }

    if (Number(carteira.saldo_disponivel) < Number(valor)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ erro: 'saldo_insuficiente' });
    }

    await client.query(
      `UPDATE carteiras
       SET saldo_disponivel = saldo_disponivel - $1, saldo_bloqueado = saldo_bloqueado + $1
       WHERE user_id = $2`,
      [valor, userId]
    );

    const bloqueioResult = await client.query(
      `INSERT INTO bloqueios (user_id, leilao_id, valor, status)
       VALUES ($1, $2, $3, 'ativo') RETURNING id`,
      [userId, leilaoId, valor]
    );

    await client.query(
      `INSERT INTO transacoes (user_id, tipo, valor, descricao) VALUES ($1, 'bloqueio', $2, $3)`,
      [userId, valor, `Bloqueio para lance no leilao ${leilaoId}`]
    );

    const saldoAtualizado = await client.query(
      'SELECT saldo_disponivel FROM carteiras WHERE user_id = $1',
      [userId]
    );

    await client.query('COMMIT');

    return res.status(200).json({
      bloqueioId: bloqueioResult.rows[0].id,
      saldoDisponivel: Number(saldoAtualizado.rows[0].saldo_disponivel),
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[carteiraController.bloquear] erro:', err.message);
    return res.status(500).json({ erro: 'erro_interno' });
  } finally {
    client.release();
  }
}

async function liberar(req, res) {
  const { bloqueioId } = req.body;

  if (!bloqueioId) {
    return res.status(400).json({ erro: 'dados_invalidos' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const bloqueioResult = await client.query(
      'SELECT * FROM bloqueios WHERE id = $1 FOR UPDATE',
      [bloqueioId]
    );
    const bloqueio = bloqueioResult.rows[0];

    if (!bloqueio) {
      await client.query('ROLLBACK');
      return res.status(404).json({ erro: 'bloqueio_nao_encontrado' });
    }

    if (bloqueio.status !== 'ativo') {
      await client.query('ROLLBACK');
      return res.status(409).json({ erro: 'bloqueio_ja_processado' });
    }

    await client.query(
      `UPDATE carteiras
       SET saldo_disponivel = saldo_disponivel + $1, saldo_bloqueado = saldo_bloqueado - $1
       WHERE user_id = $2`,
      [bloqueio.valor, bloqueio.user_id]
    );

    await client.query(`UPDATE bloqueios SET status = 'liberado' WHERE id = $1`, [bloqueioId]);

    await client.query(
      `INSERT INTO transacoes (user_id, tipo, valor, descricao) VALUES ($1, 'estorno', $2, $3)`,
      [bloqueio.user_id, bloqueio.valor, `Liberacao de bloqueio ${bloqueioId} (superado no lance)`]
    );

    const saldoAtualizado = await client.query(
      'SELECT saldo_disponivel FROM carteiras WHERE user_id = $1',
      [bloqueio.user_id]
    );

    await client.query('COMMIT');

    return res.status(200).json({
      saldoDisponivel: Number(saldoAtualizado.rows[0].saldo_disponivel),
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[carteiraController.liberar] erro:', err.message);
    return res.status(500).json({ erro: 'erro_interno' });
  } finally {
    client.release();
  }
}

async function debitar(req, res) {
  const { bloqueioId } = req.body;

  if (!bloqueioId) {
    return res.status(400).json({ erro: 'dados_invalidos' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const bloqueioResult = await client.query(
      'SELECT * FROM bloqueios WHERE id = $1 FOR UPDATE',
      [bloqueioId]
    );
    const bloqueio = bloqueioResult.rows[0];

    if (!bloqueio) {
      await client.query('ROLLBACK');
      return res.status(404).json({ erro: 'bloqueio_nao_encontrado' });
    }

    if (bloqueio.status !== 'ativo') {
      await client.query('ROLLBACK');
      return res.status(409).json({ erro: 'bloqueio_ja_processado' });
    }

    await client.query(
      `UPDATE carteiras SET saldo_bloqueado = saldo_bloqueado - $1 WHERE user_id = $2`,
      [bloqueio.valor, bloqueio.user_id]
    );

    await client.query(`UPDATE bloqueios SET status = 'debitado' WHERE id = $1`, [bloqueioId]);

    await client.query(
      `INSERT INTO transacoes (user_id, tipo, valor, descricao) VALUES ($1, 'debito', $2, $3)`,
      [bloqueio.user_id, bloqueio.valor, `Debito final por vitoria no leilao (bloqueio ${bloqueioId})`]
    );

    const saldoResult = await client.query(
      'SELECT saldo_disponivel, saldo_bloqueado FROM carteiras WHERE user_id = $1',
      [bloqueio.user_id]
    );

    await client.query('COMMIT');

    return res.status(200).json({
      saldoFinal: Number(saldoResult.rows[0].saldo_disponivel),
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[carteiraController.debitar] erro:', err.message);
    return res.status(500).json({ erro: 'erro_interno' });
  } finally {
    client.release();
  }
}

module.exports = { extrato, depositar, bloquear, liberar, debitar };
