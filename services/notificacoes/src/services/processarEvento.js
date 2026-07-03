const { salvarNotificacao } = require('./notificacaoRepository');
const { enviarEmail } = require('./emailService');
const { buscarUsuario } = require('./carteiraClient');

async function processarLanceSuperado(dados) {
  const { userId, nomeItem, lanceAtual } = dados;
  const texto = `Voce foi superado no leilao de ${nomeItem}. Novo lance: R$ ${lanceAtual}.`;

  await salvarNotificacao(userId, texto);

  const usuario = await buscarUsuario(userId);
  await enviarEmail({
    para: usuario.email,
    assunto: `Voce foi superado no leilao de ${nomeItem}`,
    texto,
  });
}

async function processarLeilaoEncerrado(dados) {
  const { vencedorId, vendedorId, nomeItem, valorFinal } = dados;

  const textoVencedor = `Parabens! Voce venceu o leilao de ${nomeItem} por R$ ${valorFinal}.`;
  const textoVendedor = `Seu leilao de ${nomeItem} foi encerrado. Valor final: R$ ${valorFinal}.`;

  await salvarNotificacao(vencedorId, textoVencedor);
  await salvarNotificacao(vendedorId, textoVendedor);

  const [usuarioVencedor, usuarioVendedor] = await Promise.all([
    buscarUsuario(vencedorId),
    buscarUsuario(vendedorId),
  ]);

  await Promise.all([
    enviarEmail({ para: usuarioVencedor.email, assunto: `Voce venceu o leilao de ${nomeItem}!`, texto: textoVencedor }),
    enviarEmail({ para: usuarioVendedor.email, assunto: `Seu leilao de ${nomeItem} foi encerrado`, texto: textoVendedor }),
  ]);
}

async function processarLeilaoEncerradoSemVencedor(dados) {
  const { vendedorId, nomeItem } = dados;
  const texto = `Seu leilao de ${nomeItem} encerrou sem lances.`;

  await salvarNotificacao(vendedorId, texto);

  const usuario = await buscarUsuario(vendedorId);
  await enviarEmail({
    para: usuario.email,
    assunto: `Seu leilao de ${nomeItem} encerrou sem lances`,
    texto,
  });
}

async function processarEvento(mensagem) {
  switch (mensagem.evento) {
    case 'lance_superado':
      return processarLanceSuperado(mensagem);
    case 'leilao_encerrado':
      return processarLeilaoEncerrado(mensagem);
    case 'leilao_encerrado_sem_vencedor':
      return processarLeilaoEncerradoSemVencedor(mensagem);
    default:
      console.warn(`[processarEvento] evento desconhecido, ignorando: ${mensagem.evento}`);
  }
}

module.exports = { processarEvento };
