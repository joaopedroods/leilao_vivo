const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');

function gerarToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  });
}

async function cadastrar(req, res) {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ erro: 'dados_invalidos' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const existente = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existente.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ erro: 'email_ja_cadastrado' });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    const userResult = await client.query(
      `INSERT INTO users (nome, email, senha_hash) VALUES ($1, $2, $3) RETURNING id, nome`,
      [nome, email, senhaHash]
    );
    const usuario = userResult.rows[0];

    await client.query(
      `INSERT INTO carteiras (user_id, saldo_disponivel, saldo_bloqueado) VALUES ($1, 0, 0)`,
      [usuario.id]
    );

    await client.query('COMMIT');

    const token = gerarToken(usuario.id);
    return res.status(201).json({
      userId: usuario.id,
      nome: usuario.nome,
      token,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[authController.cadastrar] erro:', err.message);
    return res.status(500).json({ erro: 'erro_interno' });
  } finally {
    client.release();
  }
}

async function login(req, res) {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: 'dados_invalidos' });
  }

  try {
    const resultado = await pool.query('SELECT id, nome, senha_hash FROM users WHERE email = $1', [email]);
    const usuario = resultado.rows[0];

    if (!usuario) {
      return res.status(401).json({ erro: 'credenciais_invalidas' });
    }

    const senhaConfere = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaConfere) {
      return res.status(401).json({ erro: 'credenciais_invalidas' });
    }

    const token = gerarToken(usuario.id);
    return res.status(200).json({
      token,
      userId: usuario.id,
      nome: usuario.nome,
    });
  } catch (err) {
    console.error('[authController.login] erro:', err.message);
    return res.status(500).json({ erro: 'erro_interno' });
  }
}

module.exports = { cadastrar, login };
