function autenticarServico(req, res, next) {
  const chaveRecebida = req.headers['x-service-key'];

  if (!chaveRecebida || chaveRecebida !== process.env.SERVICE_KEY) {
    return res.status(401).json({ erro: 'servico_nao_autorizado' });
  }

  next();
}

module.exports = autenticarServico;
