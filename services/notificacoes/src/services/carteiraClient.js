require('dotenv').config();

async function buscarUsuario(userId) {
  const url = `${process.env.CARTEIRA_URL}/usuarios/${userId}`;

  const resposta = await fetch(url, {
    headers: { 'X-Service-Key': process.env.SERVICE_KEY },
  });

  if (!resposta.ok) {
    throw new Error(`falha ao buscar usuario ${userId}: status ${resposta.status}`);
  }

  return resposta.json();
}

module.exports = { buscarUsuario };
